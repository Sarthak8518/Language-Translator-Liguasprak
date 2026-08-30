export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
}

/**
 * Translate text using MyMemory free translation API.
 * Falls back to LibreTranslate public instance if needed.
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { translatedText: '' };
  }

  const source = normalizeLang(sourceLang);
  const target = normalizeLang(targetLang);

  try {
    return await translateMyMemory(trimmed, source, target);
  } catch {
    try {
      return await translateLibre(trimmed, source, target);
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Translation failed. Please try again.'
      );
    }
  }
}

function normalizeLang(code: string): string {
  if (code === 'zh-CN') return 'zh-CN';
  if (code === 'zh-TW') return 'zh-TW';
  if (code === 'pt-BR') return 'pt-BR';
  return code.split('-')[0];
}

async function translateMyMemory(
  text: string,
  source: string,
  target: string
): Promise<TranslationResult> {
  const langpair = `${source}|${target}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Translation service unavailable');

  const data = await res.json();
  if (data.responseStatus !== 200 && data.responseStatus !== '200') {
    const msg = data.responseDetails || 'Translation failed';
    throw new Error(typeof msg === 'string' ? msg : 'Translation failed');
  }

  const translated = data.responseData?.translatedText ?? '';
  if (!translated) throw new Error('Empty translation response');

  // MyMemory sometimes returns MATCH warnings as the text
  if (translated.toUpperCase().includes('PLEASE SELECT TWO DISTINCT LANGUAGES')) {
    throw new Error('Please select two different languages');
  }

  return {
    translatedText: translated,
    detectedLanguage: data.responseData?.detectedSourceLanguage,
  };
}

async function translateLibre(
  text: string,
  source: string,
  target: string
): Promise<TranslationResult> {
  const res = await fetch('https://libretranslate.com/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: source === 'auto' ? 'auto' : source.split('-')[0],
      target: target.split('-')[0],
      format: 'text',
    }),
  });

  if (!res.ok) throw new Error('Translation service unavailable');
  const data = await res.json();
  if (!data.translatedText) throw new Error('Empty translation response');

  return { translatedText: data.translatedText };
}
