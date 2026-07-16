import type { RecognitionSettings, SpeechVoiceOption } from "../types/recognition";

export class SpeechService {
  private lastText = "";

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  getVoices(): SpeechVoiceOption[] {
    if (!this.isSupported()) {
      return [];
    }

    return window.speechSynthesis.getVoices().map((voice) => ({
      name: voice.name,
      lang: voice.lang,
      voiceURI: voice.voiceURI,
      default: voice.default,
    }));
  }

  speakWord(word: string, settings: RecognitionSettings): string {
    return this.speak(word, settings, true);
  }

  speakSentence(sentence: string, settings: RecognitionSettings): string {
    return this.speak(sentence, settings, false);
  }

  replayLast(settings: RecognitionSettings): string {
    if (!this.lastText) {
      return "";
    }

    return this.speak(this.lastText, settings, false);
  }

  stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  private speak(text: string, settings: RecognitionSettings, cancelQueuedSpeech: boolean): string {
    const cleanText = text.trim();

    if (!cleanText || settings.muted || !this.isSupported()) {
      return "";
    }

    if (cancelQueuedSpeech) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const selectedVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.voiceURI === settings.voiceURI);

    utterance.lang = selectedVoice?.lang ?? settings.speechLanguage;
    utterance.voice = selectedVoice ?? null;
    utterance.rate = settings.speechRate;
    utterance.pitch = settings.speechPitch;
    utterance.volume = settings.speechVolume;

    this.lastText = cleanText;
    window.speechSynthesis.speak(utterance);

    return cleanText;
  }
}

export const speechService = new SpeechService();
