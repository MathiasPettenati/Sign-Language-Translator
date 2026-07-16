import { useEffect, useState } from "react";

import { speechService } from "../services/speechService";
import type { SpeechVoiceOption } from "../types/recognition";

export function useSpeechVoices(): SpeechVoiceOption[] {
  const [voices, setVoices] = useState<SpeechVoiceOption[]>(() => speechService.getVoices());

  useEffect(() => {
    const updateVoices = () => setVoices(speechService.getVoices());

    updateVoices();

    if (!speechService.isSupported()) {
      return undefined;
    }

    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  return voices;
}
