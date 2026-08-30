import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { LANGUAGES, type Language } from '../lib/languages';

interface LanguageSelectProps {
  value: string;
  onChange: (code: string) => void;
  label: string;
  disabled?: boolean;
}

export function LanguageSelect({
  value,
  onChange,
  label,
  disabled,
}: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = LANGUAGES.find((l) => l.code === value) ?? LANGUAGES[0];

  const filtered = LANGUAGES.filter((l) => {
    const q = query.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const pick = (lang: Language) => {
    onChange(lang.code);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative flex-1 min-w-0" ref={containerRef}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
      >
        <span className="text-xl leading-none" aria-hidden>
          {selected.flag}
        </span>
        <span className="min-w-0 flex-1 truncate">
          <span className="block text-sm font-semibold text-slate-800">{selected.name}</span>
          <span className="block truncate text-xs text-slate-500">{selected.nativeName}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search languages…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-500">No languages found</li>
            )}
            {filtered.map((lang) => (
              <li key={lang.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={lang.code === value}
                  onClick={() => pick(lang)}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition hover:bg-indigo-50 ${
                    lang.code === value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{lang.name}</span>
                    <span className="block truncate text-xs text-slate-500">{lang.nativeName}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
