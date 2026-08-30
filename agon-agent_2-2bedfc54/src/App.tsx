import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  Languages,
  Loader2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { LanguageSelect } from './components/LanguageSelect';
import { TextPanel } from './components/TextPanel';
import { SpeechControls } from './components/SpeechControls';
import { HistoryPanel, type HistoryItem } from './components/HistoryPanel';
import { translateText } from './lib/translate';
import { getLanguage } from './lib/languages';
import { useSpeech } from './hooks/useSpeech';

const RTL_CODES = new Set(['ar', 'he', 'fa', 'ur']);
const HISTORY_KEY = 'lingua-speak-history';

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
  } catch {
    /* ignore */
  }
}

export default function App() {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [activeSpeechSide, setActiveSpeechSide] = useState<'source' | 'target' | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const speech = useSpeech();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const lastSpokenRef = useRef('');

  const sourceDir = RTL_CODES.has(sourceLang.split('-')[0]) ? 'rtl' : 'ltr';
  const targetDir = RTL_CODES.has(targetLang.split('-')[0]) ? 'rtl' : 'ltr';

  const pushHistory = useCallback(
    (src: string, translated: string, from: string, to: string) => {
      const item: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sourceText: src,
        translatedText: translated,
        sourceLang: from,
        targetLang: to,
        timestamp: Date.now(),
      };
      setHistory((prev) => {
        const next = [item, ...prev.filter((h) => h.sourceText !== src || h.targetLang !== to)].slice(
          0,
          12
        );
        saveHistory(next);
        return next;
      });
    },
    []
  );

  const runTranslate = useCallback(
    async (text: string, from: string, to: string, speakAfter: boolean) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setTranslatedText('');
        setError(null);
        setLoading(false);
        return;
      }

      if (from === to) {
        setTranslatedText(trimmed);
        setError(null);
        setLoading(false);
        if (speakAfter && autoSpeak) {
          lastSpokenRef.current = trimmed;
          setActiveSpeechSide('target');
          speech.speak(trimmed, to);
        }
        return;
      }

      const id = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const result = await translateText(trimmed, from, to);
        if (id !== requestIdRef.current) return;

        setTranslatedText(result.translatedText);
        pushHistory(trimmed, result.translatedText, from, to);

        if (speakAfter && autoSpeak && result.translatedText) {
          lastSpokenRef.current = result.translatedText;
          setActiveSpeechSide('target');
          // slight delay so UI updates first
          setTimeout(() => speech.speak(result.translatedText, to), 120);
        }
      } catch (err) {
        if (id !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Translation failed');
        setTranslatedText('');
      } finally {
        if (id === requestIdRef.current) setLoading(false);
      }
    },
    [autoSpeak, pushHistory, speech]
  );

  // Debounced auto-translate (without auto-speak)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!sourceText.trim()) {
      setTranslatedText('');
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void runTranslate(sourceText, sourceLang, targetLang, false);
    }, 650);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceText, sourceLang, targetLang]);

  useEffect(() => {
    if (!speech.isSpeaking && !speech.isPaused) {
      setActiveSpeechSide(null);
    }
  }, [speech.isSpeaking, speech.isPaused]);

  const handleSwap = () => {
    speech.stop();
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleTranslateAndSpeak = () => {
    void runTranslate(sourceText, sourceLang, targetLang, true);
  };

  const speakSource = () => {
    if (!sourceText.trim()) return;
    setActiveSpeechSide('source');
    speech.speak(sourceText, sourceLang);
  };

  const speakTarget = () => {
    if (!translatedText.trim()) return;
    setActiveSpeechSide('target');
    speech.speak(translatedText, targetLang);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    speech.stop();
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const sourceName = getLanguage(sourceLang)?.name ?? sourceLang;
  const targetName = getLanguage(targetLang)?.name ?? targetLang;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-violet-50">
      {/* soft background accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute -right-24 top-40 h-80 w-80 rounded-full bg-violet-200/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        {/* Header */}
        <header className="mb-8 text-center sm:mb-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm backdrop-blur"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Speak any language instantly
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-4 flex items-center justify-center gap-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <Languages className="h-5 w-5" />
            </span>
            LinguaSpeak
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base"
          >
            Translate between 40+ languages and hear natural speech with full voice, speed, and pitch
            controls — built around listening first.
          </motion.p>
        </header>

        {/* Main card */}
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl border border-white/80 bg-white/70 p-4 shadow-xl shadow-slate-200/60 backdrop-blur-md sm:p-6"
        >
          {/* Language row */}
          <div className="mb-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
            <LanguageSelect
              label="From"
              value={sourceLang}
              onChange={(code) => {
                speech.stop();
                setSourceLang(code);
              }}
            />

            <button
              type="button"
              onClick={handleSwap}
              className="mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:rotate-180 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:mb-0.5"
              title="Swap languages"
              aria-label="Swap languages"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>

            <LanguageSelect
              label="To"
              value={targetLang}
              onChange={(code) => {
                speech.stop();
                setTargetLang(code);
              }}
            />
          </div>

          {/* Text panels */}
          <div className="grid gap-4 lg:grid-cols-2">
            <TextPanel
              title={`Original · ${sourceName}`}
              value={sourceText}
              onChange={setSourceText}
              placeholder="Type or paste text to translate…"
              onSpeak={speakSource}
              speakDisabled={!sourceText.trim()}
              isSpeaking={activeSpeechSide === 'source' && speech.isSpeaking}
              dir={sourceDir}
            />
            <TextPanel
              title={`Translation · ${targetName}`}
              value={translatedText}
              placeholder={loading ? 'Translating…' : 'Translation appears here'}
              readOnly
              onSpeak={speakTarget}
              speakDisabled={!translatedText.trim()}
              isSpeaking={activeSpeechSide === 'target' && speech.isSpeaking}
              dir={targetDir}
            />
          </div>

          {/* Action bar */}
          <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Auto-speak after translate
              </span>
            </label>

            <button
              type="button"
              onClick={handleTranslateAndSpeak}
              disabled={!sourceText.trim() || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              Translate & Speak
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Featured TTS panel */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
                Voice studio
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SpeechControls
                speech={speech}
                text={sourceText}
                langCode={sourceLang}
                label={`Hear original (${sourceName})`}
                accent="source"
                panelActive={activeSpeechSide === 'source'}
                onActivate={() => setActiveSpeechSide('source')}
              />
              <SpeechControls
                speech={speech}
                text={translatedText}
                langCode={targetLang}
                label={`Hear translation (${targetName})`}
                accent="target"
                panelActive={activeSpeechSide === 'target'}
                onActivate={() => setActiveSpeechSide('target')}
              />
            </div>
          </div>
        </motion.main>

        <HistoryPanel
          items={history}
          onSelect={handleHistorySelect}
          onClear={clearHistory}
          onSpeak={(text, lang) => {
            setActiveSpeechSide('target');
            speech.speak(text, lang);
          }}
        />

        <footer className="mt-10 text-center text-xs text-slate-400">
          LinguaSpeak · Instant translation with natural text-to-speech
        </footer>
      </div>
    </div>
  );
}
