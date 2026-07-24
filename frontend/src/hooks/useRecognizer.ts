import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LOCAL_STORAGE_KEYS } from "../constants/vocabulary";
import { AslSignsClassifier, canUseAslSignsClassifier } from "../services/aslSignsClassifier";
import { classifyPrototype } from "../services/prototypeClassifier";
import { PredictionStabilizer } from "../services/predictionStabilizer";
import { speechService } from "../services/speechService";
import {
  classifyUserTrainedSign,
  encodeFrameSequence,
  isUserTrainedSignProfiles,
  removeUserTrainedProfile,
  trainUserSignProfile,
  type UserTrainedSignProfile,
} from "../services/userTrainedClassifier";
import { useHandTracker } from "./useHandTracker";
import { useLocalStorage } from "./useLocalStorage";
import { createId } from "../utils/ids";
import { isRecognitionHistory, isString } from "../utils/guards";
import type {
  FrameAnalysis,
  ModelComponentStatus,
  ModelLoadState,
  RecognitionHistoryItem,
  RecognitionSettings,
  SignPrediction,
  StabilizedPrediction,
} from "../types/recognition";

const INITIAL_RECOGNITION: StabilizedPrediction = {
  status: "idle",
  label: null,
  confidence: 0,
  consistency: 0,
  message: "Ready",
  justConfirmed: false,
};

const TRAINING_SEQUENCE_MS = 1_400;
const MAX_RECENT_FRAME_COUNT = 32;
const MINIMUM_USER_TRAINED_CONFIDENCE = 0.5;

type AslModelRuntimeState = {
  status: ModelComponentStatus;
  message: string;
  warnings: string[];
};

const INITIAL_ASL_MODEL_STATE: AslModelRuntimeState = {
  status: "idle",
  message: "ASL Signs model is not loaded yet.",
  warnings: [],
};

export function useRecognizer(settings: RecognitionSettings) {
  const settingsRef = useRef(settings);
  const stabilizerRef = useRef(new PredictionStabilizer(settings));
  const recentFramesRef = useRef<FrameAnalysis[]>([]);
  const aslSignsClassifierRef = useRef<AslSignsClassifier | null>(null);
  const aslRuntimeWarningRef = useRef<string | null>(null);
  const [recognition, setRecognition] = useState<StabilizedPrediction>(INITIAL_RECOGNITION);
  const [currentPrediction, setCurrentPrediction] = useState<SignPrediction | null>(null);
  const [aslModelState, setAslModelState] = useState<AslModelRuntimeState>(INITIAL_ASL_MODEL_STATE);
  const [spokenCaption, setSpokenCaption] = useState("");
  const [sentence, setSentence] = useLocalStorage(LOCAL_STORAGE_KEYS.sentence, "", isString);
  const [history, setHistory] = useLocalStorage<RecognitionHistoryItem[]>(
    LOCAL_STORAGE_KEYS.history,
    [],
    isRecognitionHistory,
  );
  const [trainedProfiles, setTrainedProfiles] = useLocalStorage<UserTrainedSignProfile[]>(
    LOCAL_STORAGE_KEYS.trainedProfiles,
    [],
    isUserTrainedSignProfiles,
  );
  const trainedProfilesRef = useRef(trainedProfiles);

  useEffect(() => {
    settingsRef.current = settings;
    stabilizerRef.current.updateSettings(settings);
  }, [settings]);

  useEffect(() => {
    trainedProfilesRef.current = trainedProfiles;
  }, [trainedProfiles]);

  useEffect(() => {
    let cancelled = false;

    if (!canUseAslSignsClassifier()) {
      setAslModelState({
        status: "missing",
        message: "ASL Signs model waits for a WebAssembly-capable browser.",
        warnings: [],
      });
      return;
    }

    setAslModelState({
      status: "loading",
      message: "Loading the ASL Signs 250-sign model.",
      warnings: [],
    });

    AslSignsClassifier.create()
      .then((classifier) => {
        if (cancelled) {
          return;
        }

        aslSignsClassifierRef.current = classifier;
        setAslModelState({
          status: "ready",
          message: `ASL Signs model is ready with ${classifier.labelCount} isolated signs.`,
          warnings: [],
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "The ASL Signs model failed to load.";
        setAslModelState({
          status: "error",
          message,
          warnings: [message],
        });
      });

    return () => {
      cancelled = true;
      aslSignsClassifierRef.current = null;
    };
  }, []);

  const rememberFrame = useCallback((frame: FrameAnalysis) => {
    recentFramesRef.current = [...recentFramesRef.current, frame]
      .filter((candidate) => frame.timestampMs - candidate.timestampMs <= TRAINING_SEQUENCE_MS)
      .slice(-MAX_RECENT_FRAME_COUNT);
  }, []);

  const acceptConfirmedSign = useCallback(
    (label: string, prediction: SignPrediction | null, confidence: number) => {
      setSentence((current) => `${current.trim()} ${label}`.trim());
      setHistory((current) => [
        {
          id: createId("history"),
          label,
          confidence,
          source: prediction?.source ?? "prototype",
          createdAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 60));

      if (settingsRef.current.automaticSpeech) {
        const caption = speechService.speakWord(label, settingsRef.current);
        setSpokenCaption(caption);
      }
    },
    [setHistory, setSentence],
  );

  const handleFrame = useCallback(
    (frame: FrameAnalysis) => {
      const filteredFrame = filterPreferredHand(frame, settingsRef.current);
      rememberFrame(filteredFrame);

      const modelPrediction = frame.gesturePrediction;
      const aslSignsClassifier = aslSignsClassifierRef.current;
      const aslSignsPrediction = aslSignsClassifier?.classify(
        recentFramesRef.current,
        frame.timestampMs,
      );
      const aslRuntimeWarning = aslSignsClassifier?.getWarnings()[0] ?? null;
      if (aslRuntimeWarning !== aslRuntimeWarningRef.current) {
        aslRuntimeWarningRef.current = aslRuntimeWarning;
        setAslModelState((current) => ({
          ...current,
          warnings: aslRuntimeWarning ? [aslRuntimeWarning] : [],
        }));
      }
      const userTrainedPrediction = classifyUserTrainedSign(
        trainedProfilesRef.current,
        recentFramesRef.current,
      );
      const prototypePrediction = classifyPrototype(filteredFrame);
      const prediction =
        aslSignsPrediction &&
        aslSignsPrediction.confidence >= settingsRef.current.confidenceThreshold
          ? aslSignsPrediction
          : modelPrediction && modelPrediction.confidence >= settingsRef.current.confidenceThreshold
            ? modelPrediction
            : userTrainedPrediction &&
              userTrainedPrediction.confidence >= MINIMUM_USER_TRAINED_CONFIDENCE
            ? userTrainedPrediction
            : prototypePrediction;
      const stabilized = stabilizerRef.current.update(prediction, frame.timestampMs);

      setCurrentPrediction(prediction);
      setRecognition(stabilized);

      if (stabilized.justConfirmed && stabilized.label) {
        acceptConfirmedSign(stabilized.label, prediction, stabilized.confidence);
      }
    },
    [acceptConfirmedSign, rememberFrame],
  );

  const tracker = useHandTracker({
    settings,
    onFrame: handleFrame,
    overlayLabel: recognition.label ?? recognition.message,
    overlayConfidence: recognition.confidence,
  });

  const modelState = useMemo<ModelLoadState>(
    () => ({
      ...tracker.modelState,
      aslSignsModel: aslModelState.status,
      message: summarizeModelMessage(tracker.modelState.message, aslModelState),
    }),
    [aslModelState, tracker.modelState],
  );

  const modelWarnings = useMemo(() => {
    const classifierWarnings = aslSignsClassifierRef.current?.getWarnings() ?? [];
    return [...new Set([...aslModelState.warnings, ...classifierWarnings])];
  }, [aslModelState]);

  const sentenceWords = useMemo(() => sentence.split(/\s+/).filter(Boolean), [sentence]);

  const undoLastWord = useCallback(() => {
    setSentence((current) => current.split(/\s+/).filter(Boolean).slice(0, -1).join(" "));
  }, [setSentence]);

  const clearSentence = useCallback(() => {
    setSentence("");
    setSpokenCaption("");
    stabilizerRef.current.reset();
  }, [setSentence]);

  const speakSentence = useCallback(() => {
    const caption = speechService.speakSentence(sentence, settingsRef.current);
    setSpokenCaption(caption);
  }, [sentence]);

  const replayLastSpeech = useCallback(() => {
    const caption = speechService.replayLast(settingsRef.current);
    setSpokenCaption(caption);
  }, []);

  const stopSpeaking = useCallback(() => {
    speechService.stop();
    setSpokenCaption("");
  }, []);

  const captureTrainingSample = useCallback(
    (label: string) => {
      const vector = encodeFrameSequence(recentFramesRef.current);

      if (!vector) {
        return false;
      }

      setTrainedProfiles((current) => trainUserSignProfile(current, label, vector));
      return true;
    },
    [setTrainedProfiles],
  );

  const removeTrainingProfile = useCallback(
    (label: string) => {
      setTrainedProfiles((current) => removeUserTrainedProfile(current, label));
    },
    [setTrainedProfiles],
  );

  return {
    ...tracker,
    modelState,
    modelWarnings,
    recognition,
    currentPrediction,
    sentence,
    sentenceWords,
    history,
    trainedProfiles,
    spokenCaption,
    setSentence,
    undoLastWord,
    clearSentence,
    speakSentence,
    replayLastSpeech,
    stopSpeaking,
    captureTrainingSample,
    removeTrainingProfile,
  };
}

function summarizeModelMessage(
  mediaPipeMessage: string,
  aslModelState: AslModelRuntimeState,
): string {
  if (aslModelState.status === "ready") {
    return `${mediaPipeMessage} ${aslModelState.message}`;
  }

  if (aslModelState.status === "loading") {
    return `${mediaPipeMessage} ${aslModelState.message}`;
  }

  if (aslModelState.status === "error") {
    return `${mediaPipeMessage} ${aslModelState.message}`;
  }

  return mediaPipeMessage;
}

function filterPreferredHand(frame: FrameAnalysis, settings: RecognitionSettings): FrameAnalysis {
  if (settings.preferredHand === "either") {
    return frame;
  }

  const expectedHand = settings.preferredHand === "left" ? "Left" : "Right";
  return {
    ...frame,
    hands: frame.hands.filter((hand) => hand.handedness === expectedHand),
  };
}
