import { Gauge, Mic2, Moon, SlidersHorizontal, Sun } from "lucide-react";

import { useSpeechVoices } from "../hooks/useSpeechVoices";
import type { PreferredHand, RecognitionMode, RecognitionSettings } from "../types/recognition";

type SettingsPanelProps = {
  settings: RecognitionSettings;
  onChange: (settings: RecognitionSettings) => void;
};

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const voices = useSpeechVoices();

  const update = <K extends keyof RecognitionSettings>(key: K, value: RecognitionSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <section className="surface p-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-ink-500" aria-hidden="true" />
        <h2 className="section-title">Settings</h2>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <fieldset className="space-y-4">
          <legend className="flex items-center gap-2 text-sm font-medium text-ink-800 dark:text-ink-100">
            <Gauge className="h-4 w-4" aria-hidden="true" />
            Recognition
          </legend>
          <label className="setting-row">
            <span>Confidence threshold</span>
            <input
              type="range"
              min="0.45"
              max="0.95"
              step="0.01"
              value={settings.confidenceThreshold}
              onChange={(event) => update("confidenceThreshold", Number(event.target.value))}
            />
            <output>{Math.round(settings.confidenceThreshold * 100)}%</output>
          </label>
          <label className="setting-row">
            <span>Stabilization</span>
            <input
              type="range"
              min="300"
              max="1200"
              step="50"
              value={settings.stabilizationMs}
              onChange={(event) => update("stabilizationMs", Number(event.target.value))}
            />
            <output>{settings.stabilizationMs} ms</output>
          </label>
          <label className="setting-row">
            <span>Prediction buffer</span>
            <input
              type="range"
              min="8"
              max="24"
              step="1"
              value={settings.predictionBufferLength}
              onChange={(event) => update("predictionBufferLength", Number(event.target.value))}
            />
            <output>{settings.predictionBufferLength} frames</output>
          </label>
          <label className="setting-row">
            <span>Repeat cooldown</span>
            <input
              type="range"
              min="500"
              max="2500"
              step="100"
              value={settings.repeatCooldownMs}
              onChange={(event) => update("repeatCooldownMs", Number(event.target.value))}
            />
            <output>{settings.repeatCooldownMs} ms</output>
          </label>
          <label className="field-label">
            <span>Preferred signing hand</span>
            <select
              value={settings.preferredHand}
              onChange={(event) => update("preferredHand", event.target.value as PreferredHand)}
            >
              <option value="either">Either</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="field-label">
            <span>Recognition mode</span>
            <select
              value={settings.recognitionMode}
              onChange={(event) => update("recognitionMode", event.target.value as RecognitionMode)}
            >
              <option value="static">Static signs</option>
              <option value="dynamic" disabled>
                Dynamic signs require a trained temporal model
              </option>
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="check-row">
              <input
                type="checkbox"
                checked={settings.showLandmarks}
                onChange={(event) => update("showLandmarks", event.target.checked)}
              />
              <span>Show landmarks</span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={settings.mirroredCamera}
                onChange={(event) => update("mirroredCamera", event.target.checked)}
              />
              <span>Mirror camera</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="flex items-center gap-2 text-sm font-medium text-ink-800 dark:text-ink-100">
            <Mic2 className="h-4 w-4" aria-hidden="true" />
            Speech and Display
          </legend>
          <label className="field-label">
            <span>Voice</span>
            <select
              value={settings.voiceURI}
              onChange={(event) => update("voiceURI", event.target.value)}
            >
              <option value="">Browser default</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
          <label className="setting-row">
            <span>Speech rate</span>
            <input
              type="range"
              min="0.5"
              max="1.6"
              step="0.05"
              value={settings.speechRate}
              onChange={(event) => update("speechRate", Number(event.target.value))}
            />
            <output>{settings.speechRate.toFixed(2)}x</output>
          </label>
          <label className="setting-row">
            <span>Pitch</span>
            <input
              type="range"
              min="0.5"
              max="1.6"
              step="0.05"
              value={settings.speechPitch}
              onChange={(event) => update("speechPitch", Number(event.target.value))}
            />
            <output>{settings.speechPitch.toFixed(2)}</output>
          </label>
          <label className="setting-row">
            <span>Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.speechVolume}
              onChange={(event) => update("speechVolume", Number(event.target.value))}
            />
            <output>{Math.round(settings.speechVolume * 100)}%</output>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="check-row">
              <input
                type="checkbox"
                checked={settings.automaticSpeech}
                onChange={(event) => update("automaticSpeech", event.target.checked)}
              />
              <span>Automatic speech</span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={settings.muted}
                onChange={(event) => update("muted", event.target.checked)}
              />
              <span>Mute speech</span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(event) => update("darkMode", event.target.checked)}
              />
              <span className="inline-flex items-center gap-2">
                {settings.darkMode ? (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Sun className="h-4 w-4" aria-hidden="true" />
                )}
                Dark mode
              </span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(event) => update("reducedMotion", event.target.checked)}
              />
              <span>Reduced motion</span>
            </label>
          </div>
        </fieldset>
      </div>
    </section>
  );
}
