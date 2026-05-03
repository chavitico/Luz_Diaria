const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL ?? '').replace(/\/$/, '');

export async function translateText(text: string, targetLanguage: 'es' | 'en'): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLanguage }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Translate error ${response.status}: ${errText.slice(0, 100)}`);
  }

  const data = await response.json() as { translatedText?: string; error?: string };
  if (!data.translatedText) throw new Error(data.error ?? 'Empty translation response');
  return data.translatedText;
}
