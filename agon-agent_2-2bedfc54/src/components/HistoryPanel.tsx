import { Clock, Trash2, Volume2 } from 'lucide-react';
import { getLanguage } from '../lib/languages';

export interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onSpeak: (text: string, lang: string) => void;
}

export function HistoryPanel({ items, onSelect, onClear, onSpeak }: HistoryPanelProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Clock className="h-4 w-4 text-slate-400" />
          Recent translations
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const src = getLanguage(item.sourceLang);
          const tgt = getLanguage(item.targetLang);
          return (
            <li key={item.id}>
              <div className="group flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <span>
                      {src?.flag} {src?.name}
                    </span>
                    <span className="text-slate-300">→</span>
                    <span>
                      {tgt?.flag} {tgt?.name}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-600">{item.sourceText}</p>
                  <p className="truncate text-sm font-medium text-slate-800">{item.translatedText}</p>
                </button>
                <button
                  type="button"
                  onClick={() => onSpeak(item.translatedText, item.targetLang)}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-indigo-500 opacity-70 transition hover:bg-indigo-50 hover:opacity-100 group-hover:opacity-100"
                  title="Speak translation"
                  aria-label="Speak translation"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
