import { useCallback, useEffect, useRef, useState } from 'react';
import { getSpeechCode } from '../lib/languages';

export interface SpeechSettings {
  rate: number;
  pitch: number;
  volume: number;
}

export interface UseSpeechReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  settings: SpeechSettings;
  speak: (text: string, langCode: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setSelectedVoiceURI: (uri: string) => void;
  setSettings: (settings: Partial<SpeechSettings>) => void;
  getVoicesForLang: (langCode: string) => SpeechSynthesisVoice[];
}

const DEFAULT_SETTINGS: SpeechSettings = {
  rate: 1,
  pitch: 1,
  volume: 1,
};

export function useSpeech(): UseSpeechReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [settings, setSettingsState] = useState<SpeechSettings>(DEFAULT_SETTINGS);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const getVoicesForLang = useCallback(
    (langCode: string): SpeechSynthesisVoice[] => {
      const speechCode = getSpeechCode(langCode).toLowerCase();
      const base = speechCode.split('-')[0];

      const exact = voices.filter((v) => v.lang.toLowerCase() === speechCode);
      if (exact.length) return exact;

      const prefix = voices.filter((v) =>
        v.lang.toLowerCase().startsWith(base)
      );
      return prefix;
    },
    [voices]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  const speak = useCallback(
    (text: string, langCode: string) => {
      if (!isSupported || !text.trim()) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      const speechCode = getSpeechCode(langCode);
      utterance.lang = speechCode;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      const langVoices = getVoicesForLang(langCode);
      let voice: SpeechSynthesisVoice | undefined;

      if (selectedVoiceURI) {
        voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
      }
      if (!voice && langVoices.length) {
        voice =
          langVoices.find((v) => v.default) ||
          langVoices.find((v) => v.localService) ||
          langVoices[0];
      }
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, settings, selectedVoiceURI, voices, getVoicesForLang]
  );

  const setSettings = useCallback((partial: Partial<SpeechSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...partial }));
  }, []);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    voices,
    selectedVoiceURI,
    settings,
    speak,
    pause,
    resume,
    stop,
    setSelectedVoiceURI,
    setSettings,
    getVoicesForLang,
  };
}
