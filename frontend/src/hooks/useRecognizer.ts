import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LOCAL_STORAGE_KEYS } from "../constants/vocabulary";
import { classifyPrototype } from "../services/prototypeClassifier";
import { PredictionStabilizer } from "../services/predictionStabilizer";
import { speechService } from "../services/speechService";
import { useHandTracker } from "./useHandTracker";
import { useLocalStorage } from "./useLocalStorage";
import { createId } from "../utils/ids";
import { isRecognitionHistory, isString } from "../utils/guards";
import type {
  FrameAnalysis,
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

export function useRecognizer(settings: RecognitionSettings) {
  const settingsRef = useRef(settings);
  const stabilizerRef = useRef(new PredictionStabilizer(settings));
  const [recognition, setRecognition] = useState<StabilizedPrediction>(INITIAL_RECOGNITION);
  const [currentPrediction, setCurrentPrediction] = useState<SignPrediction | null>(null);
  const [spokenCaption, setSpokenCaption] = useState("");
  const [sentence, setSentence] = useLocalStorage(LOCAL_STORAGE_KEYS.sentence, "", isString);
  const [history, setHistory] = useLocalStorage<RecognitionHistoryItem[]>(
    LOCAL_STORAGE_KEYS.history,
    [],
    isRecognitionHistory,
  );

  useEffect(() => {
    settingsRef.current = settings;
    stabilizerRef.current.updateSettings(settings);
  }, [settings]);

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
      const modelPrediction = frame.gesturePrediction;
      const prototypePrediction = classifyPrototype(filteredFrame);
      const prediction =
        modelPrediction && modelPrediction.confidence >= settingsRef.current.confidenceThreshold
          ? modelPrediction
          : prototypePrediction;
      const stabilized = stabilizerRef.current.update(prediction, frame.timestampMs);

      setCurrentPrediction(prediction);
      setRecognition(stabilized);

      if (stabilized.justConfirmed && stabilized.label) {
        acceptConfirmedSign(stabilized.label, prediction, stabilized.confidence);
      }
    },
    [acceptConfirmedSign],
  );

  const tracker = useHandTracker({
    settings,
    onFrame: handleFrame,
    overlayLabel: recognition.label ?? recognition.message,
    overlayConfidence: recognition.confidence,
  });

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

  return {
    ...tracker,
    recognition,
    currentPrediction,
    sentence,
    sentenceWords,
    history,
    spokenCaption,
    setSentence,
    undoLastWord,
    clearSentence,
    speakSentence,
    replayLastSpeech,
    stopSpeaking,
  };
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
