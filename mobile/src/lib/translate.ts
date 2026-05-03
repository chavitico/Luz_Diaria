const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY ?? '';
const ANTHROPIC_URL = 'https://api.anthropic.com.proxy.vibecodeapp.com/v1/messages';

export async function translateText(text: string, targetLanguage: 'es' | 'en'): Promise<string> {
  const targetLabel = targetLanguage === 'en' ? 'English' : 'Spanish';
  const prompt = `Translate the following text to ${targetLabel}. Return ONLY the translated text, no quotes, no explanation:\n\n${text}`;

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Anthropic error ${response.status}: ${errText.slice(0, 100)}`);
  }

  const data = await response.json() as { content?: Array<{ type: string; text?: string }> };
  const translated = data.content?.[0]?.text?.trim();
  if (!translated) throw new Error('Empty response from Anthropic');
  return translated;
}
