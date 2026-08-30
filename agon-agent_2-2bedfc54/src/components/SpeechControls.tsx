import type { ReactNode } from 'react';
import {
  Pause,
  Play,
  Square,
  Volume2,
  Gauge,
  Music2,
} from 'lucide-react';
import type { UseSpeechReturn } from '../hooks/useSpeech';

interface SpeechControlsProps {
  speech: UseSpeechReturn;
  text: string;
  langCode: string;
  label: string;
  accent?: 'source' | 'target';
  /** When false, this panel is not the one currently driving speech */
  panelActive?: boolean;
  onActivate?: () => void;
}

export function SpeechControls({
  speech,
  text,
  langCode,
  label,
  accent = 'target',
  panelActive = true,
  onActivate,
}: SpeechControlsProps) {
  const {
    isSupported,
    isSpeaking,
    isPaused,
    settings,
    speak,
    pause,
    resume,
    stop,
    setSettings,
    getVoicesForLang,
    selectedVoiceURI,
    setSelectedVoiceURI,
  } = speech;

  const langVoices = getVoicesForLang(langCode);
  const canSpeak = isSupported && text.trim().length > 0;
  const isActive = panelActive && isSpeaking && !isPaused;
  const isPanelPaused = panelActive && isPaused;
  const isPanelBusy = panelActive && (isSpeaking || isPaused);

  const ringColor =
    accent === 'target'
      ? 'from-indigo-500 to-violet-500'
      : 'from-sky-500 to-cyan-500';

  const handlePlay = () => {
    onActivate?.();
    if (isPanelPaused) {
      resume();
    } else {
      speak(text, langCode);
    }
  };

  const handlePause = () => {
    if (panelActive) pause();
  };

  const handleStop = () => {
    if (panelActive || isSpeaking || isPaused) stop();
  };

  if (!isSupported) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Text-to-speech is not supported in this browser. Try Chrome, Edge, or Safari.
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-[1px] shadow-lg ${
        accent === 'target'
          ? 'border-indigo-200/60 from-indigo-500/20 via-violet-500/10 to-fuchsia-500/20 shadow-indigo-500/10'
          : 'border-sky-200/60 from-sky-500/20 via-cyan-500/10 to-teal-500/20 shadow-sky-500/10'
      }`}
    >
      <div className="rounded-[15px] bg-white/95 p-4 backdrop-blur-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${ringColor} text-white shadow-md`}
            >
              <Volume2 className="h-4.5 w-4.5 h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500">Text-to-speech</p>
            </div>
          </div>

          {/* Waveform indicator */}
          <div className="flex h-8 items-end gap-0.5" aria-hidden>
            {[0.4, 0.7, 1, 0.55, 0.85, 0.45, 0.65].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full bg-gradient-to-t ${ringColor} transition-all duration-300 ${
                  isActive ? 'animate-pulse' : 'opacity-30'
                }`}
                style={{
                  height: `${h * 100}%`,
                  animationDelay: `${i * 80}ms`,
                  animationDuration: isActive ? `${0.4 + (i % 3) * 0.15}s` : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {/* Primary transport controls */}
        <div className="mb-5 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={!canSpeak && !isPanelBusy}
            onClick={handlePlay}
            className={`group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${ringColor} text-white shadow-lg transition hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100`}
            aria-label={isPanelPaused ? 'Resume' : 'Speak'}
            title={isPanelPaused ? 'Resume' : 'Speak aloud'}
          >
            <Play className={`h-6 w-6 fill-current ${isPanelPaused || !isActive ? 'ml-0.5' : ''}`} />
            {isActive && (
              <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/40" />
            )}
          </button>

          <button
            type="button"
            disabled={!isActive}
            onClick={handlePause}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Pause"
            title="Pause"
          >
            <Pause className="h-5 w-5" />
          </button>

          <button
            type="button"
            disabled={!isPanelBusy}
            onClick={handleStop}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Stop"
            title="Stop"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        </div>

        {/* Voice picker */}
        {langVoices.length > 0 && (
          <div className="mb-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Music2 className="h-3.5 w-3.5" />
              Voice
            </label>
            <select
              value={selectedVoiceURI}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Auto (best match)</option>
              {langVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sliders */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Slider
            icon={<Gauge className="h-3.5 w-3.5" />}
            label="Speed"
            min={0.5}
            max={2}
            step={0.1}
            value={settings.rate}
            display={`${settings.rate.toFixed(1)}×`}
            onChange={(v) => setSettings({ rate: v })}
          />
          <Slider
            icon={<Music2 className="h-3.5 w-3.5" />}
            label="Pitch"
            min={0.5}
            max={2}
            step={0.1}
            value={settings.pitch}
            display={settings.pitch.toFixed(1)}
            onChange={(v) => setSettings({ pitch: v })}
          />
          <Slider
            icon={<Volume2 className="h-3.5 w-3.5" />}
            label="Volume"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            display={`${Math.round(settings.volume * 100)}%`}
            onChange={(v) => setSettings({ volume: v })}
          />
        </div>
      </div>
    </div>
  );
}

function Slider({
  icon,
  label,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="flex items-center gap-1 text-xs font-medium text-slate-500">
          {icon}
          {label}
        </label>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="tts-slider w-full"
      />
    </div>
  );
}
