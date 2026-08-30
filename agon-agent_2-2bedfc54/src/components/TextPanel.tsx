import { Copy, Check, Eraser, Volume2 } from 'lucide-react';
import { useState } from 'react';

interface TextPanelProps {
  title: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
  onSpeak?: () => void;
  speakDisabled?: boolean;
  isSpeaking?: boolean;
  charLimit?: number;
  dir?: 'ltr' | 'rtl';
}

export function TextPanel({
  title,
  value,
  onChange,
  placeholder,
  readOnly,
  onSpeak,
  speakDisabled,
  isSpeaking,
  charLimit = 5000,
  dir = 'ltr',
}: TextPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex min-h-[220px] flex-1 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm transition focus-within:border-indigo-300 focus-within:shadow-md focus-within:shadow-indigo-500/5">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
        <div className="flex items-center gap-1">
          {onSpeak && (
            <button
              type="button"
              onClick={onSpeak}
              disabled={speakDisabled}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-40 ${
                isSpeaking
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-indigo-600 hover:bg-indigo-50'
              }`}
              title="Listen"
              aria-label={`Listen to ${title}`}
            >
              <Volume2 className={`h-3.5 w-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
              Listen
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!value}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-40"
            title="Copy"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {!readOnly && value && (
            <button
              type="button"
              onClick={() => onChange?.('')}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              title="Clear"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col p-4">
        {readOnly ? (
          <div
            dir={dir}
            className={`min-h-[140px] flex-1 whitespace-pre-wrap break-words text-base leading-relaxed ${
              value ? 'text-slate-800' : 'text-slate-400'
            }`}
          >
            {value || placeholder}
          </div>
        ) : (
          <textarea
            dir={dir}
            value={value}
            onChange={(e) => onChange?.(e.target.value.slice(0, charLimit))}
            placeholder={placeholder}
            className="min-h-[140px] flex-1 resize-none bg-transparent text-base leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none"
            spellCheck
          />
        )}

        {!readOnly && (
          <div className="mt-2 text-right text-[11px] tabular-nums text-slate-400">
            {value.length}/{charLimit}
          </div>
        )}
      </div>
    </div>
  );
}
