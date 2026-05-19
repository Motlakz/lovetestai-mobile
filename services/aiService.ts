import { zodiacLocal, birthdateLocal, loveScoreLocal, numerologyLocal, soulmateLocal, quizLocal } from './localEngine';
import {
  trackError,
  trackGeneratorCompleted,
  trackGeneratorFailed,
  trackGeneratorStarted,
} from '@/services/analytics';

const PLATFORM_API_BASE =
  process.env.EXPO_PUBLIC_LOVETESTAI_API_BASE_URL?.replace(/\/$/, '') ||
  'https://lovetestai.com';

const ENABLE_LOCAL_CONTENT_FALLBACK =
  process.env.EXPO_PUBLIC_ENABLE_LOCAL_AI_FALLBACK === 'true';

const CONTENT_ROUTES: Partial<Record<string, string>> = {
  'love-letter': '/api/generate-letter',
  'love-note': '/api/generate-note',
  'love-poem': '/api/generate-poem',
  'love-quote': '/api/generate-quote',
};

export interface GenerateParams {
  tool: string;
  fromName?: string;
  toName?: string;
  tone?: string;
  length?: string;
  detail?: string;
  occasion?: string;
  style?: string;
  memory?: string;
  message?: string;
  word?: string;
  city?: string;
  vibe?: string;
  stage?: string;
}

export interface PlatformPrompt {
  id: string;
  text: string;
  category: string;
}

interface PlatformGenerationResponse {
  content?: string;
  text?: string;
  result?: string;
  output?: string;
  letter?: string;
  note?: string;
  poem?: string;
  quote?: string;
  analysis?: string;
  insight?: string;
  message?: string;
  // generate-quote API returns { quote: string }
  data?: {
    content?: string;
    text?: string;
    result?: string;
    output?: string;
    letter?: string;
    note?: string;
    poem?: string;
    quote?: string;
    analysis?: string;
    insight?: string;
    message?: string;
  };
}

function getResponseText(data: PlatformGenerationResponse): string | null {
  return (
    data.content ||
    data.text ||
    data.result ||
    data.output ||
    data.letter ||
    data.note ||
    data.poem ||
    data.quote ||
    data.analysis ||
    data.insight ||
    data.message ||
    data.data?.content ||
    data.data?.text ||
    data.data?.result ||
    data.data?.output ||
    data.data?.letter ||
    data.data?.note ||
    data.data?.poem ||
    data.data?.quote ||
    data.data?.analysis ||
    data.data?.insight ||
    data.data?.message ||
    null
  );
}

async function postToPlatform(route: string, body: unknown): Promise<string | null> {
  const response = await fetch(`${PLATFORM_API_BASE}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client': 'lovetestai-mobile',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await readResponseDetails(response);
    throw new Error(`Platform API request failed: ${route} ${response.status}${details ? ` ${details}` : ''}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return extractTaggedLetter(await response.text());
  }

  const data = await response.json() as PlatformGenerationResponse;
  return getResponseText(data);
}

function extractTaggedLetter(text: string): string {
  const match = text.match(/<LETTER>([\s\S]*?)<\/LETTER>/);
  return (match?.[1] || text).trim();
}

export async function fetchPrompts(category = 'All', limit = 30): Promise<PlatformPrompt[] | null> {
  try {
    const url = new URL(`${PLATFORM_API_BASE}/api/prompts`);
    url.searchParams.set('category', category);
    url.searchParams.set('limit', String(limit));
    const response = await fetch(url.toString(), {
      headers: { 'x-client': 'lovetestai-mobile' },
    });
    if (!response.ok) return null;
    const data = await response.json() as { prompts?: PlatformPrompt[] };
    return Array.isArray(data.prompts) ? data.prompts : null;
  } catch (error) {
    console.log('[AI] Prompts route failed:', error);
    return null;
  }
}

export async function generateContent(params: GenerateParams): Promise<string> {
  const route = CONTENT_ROUTES[params.tool];
  trackGeneratorStarted(params.tool);

  if (route) {
    try {
      const text = await postToPlatform(route, buildContentPayload(params));
      if (text) {
        trackGeneratorCompleted(params.tool, 'platform');
        return text;
      }
    } catch (error) {
      trackGeneratorFailed(params.tool, 'platform_route_failed');
      console.log(`[AI] Platform route failed: ${route}`, error);
    }
  }

  if (!ENABLE_LOCAL_CONTENT_FALLBACK) {
    trackGeneratorFailed(params.tool, 'local_fallback_disabled');
    throw new Error(`AI generation failed for ${params.tool}. Local mock fallback is disabled.`);
  }

  await simulateDelay();
  trackGeneratorCompleted(params.tool, 'local_mock');
  return getMockResponse(params.tool, params);
}

function buildContentPayload(params: GenerateParams): Record<string, unknown> {
  const name1 = params.fromName || 'Me';
  const name2 = params.toName || 'my love';

  if (params.tool === 'love-poem') {
    return {
      name1,
      name2,
      theme: params.detail || params.memory || params.word || params.tone || params.occasion || 'romantic',
      poemLength: params.length === 'Long' ? 8 : params.length === 'Short' ? 3 : 5,
      rhyming: params.style === 'Rhyming',
      recaptchaToken: 'mobile',
      source: 'mobile',
    };
  }

  if (params.tool === 'love-note') {
    return {
      sender: name1,
      recipient: name2,
      occasion: toLoveNoteOccasion(params.occasion),
      vibe: toLoveNoteVibe(params.tone || params.vibe),
      detail: params.message || params.detail || params.memory || '',
      withEmoji: false,
      rhyming: false,
      recaptchaToken: 'mobile',
      source: 'mobile',
    };
  }

  if (params.tool === 'love-quote') {
    return {
      word: params.word || '',
      tone: toneToQuoteTone(params.tone),
      recaptchaToken: 'mobile',
      source: 'mobile',
    };
  }

  return {
    name1,
    name2,
    theme: toLetterTheme(params.occasion || params.style || params.detail),
    tone: toLetterTone(params.tone),
    letterType: toLetterType(params.style),
    formality: 'informal',
    letterLength: params.length === 'Long' ? 5 : params.length === 'Short' ? 2 : 3,
    feeling: params.vibe || params.tone || '',
    occasion: params.occasion || '',
    personalNote: params.detail || params.memory || params.message || '',
    recaptchaToken: 'mobile',
    source: 'mobile',
  };
}

function toLetterTheme(value?: string): string {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('anniversary')) return 'anniversary';
  if (normalized.includes('distance')) return 'long-distance';
  if (normalized.includes('apolog')) return 'apology';
  if (normalized.includes('appreciat') || normalized.includes('thank')) return 'appreciation';
  if (normalized.includes('missing')) return 'missing-you';
  return 'romance';
}

function toLetterTone(value?: string): string {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('play')) return 'playful';
  if (normalized.includes('heart')) return 'heartfelt';
  if (normalized.includes('poet') || normalized.includes('dream')) return 'poetic';
  if (normalized.includes('nostalg')) return 'nostalgic';
  return 'romantic';
}

function toLetterType(value?: string): string {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('formal')) return 'formal';
  if (normalized.includes('poet')) return 'poetic';
  if (normalized.includes('passion')) return 'passionate';
  return 'casual';
}

function toLoveNoteOccasion(value?: string): string {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('valentine')) return "valentine's day";
  if (normalized.includes('anniversary')) return 'anniversary';
  if (normalized.includes('distance')) return 'long distance';
  if (normalized.includes('apolog')) return 'apology';
  if (normalized.includes('missing')) return 'missing you';
  if (normalized.includes('morning')) return 'good morning';
  if (normalized.includes('night')) return 'good night';
  return 'just because';
}

function toLoveNoteVibe(value?: string): string {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('play') || normalized.includes('flirt')) return 'playful and flirty';
  if (normalized.includes('poet') || normalized.includes('dream')) return 'poetic and dreamy';
  if (normalized.includes('simple') || normalized.includes('sweet')) return 'sweet and simple';
  if (normalized.includes('passion') || normalized.includes('intense')) return 'passionate and intense';
  if (normalized.includes('nostalg') || normalized.includes('tender')) return 'nostalgic and tender';
  return 'romantic and heartfelt';
}

function toneToQuoteTone(tone?: string): string {
  const value = (tone || '').toLowerCase();
  if (value.includes('playful') || value.includes('flirty')) return 'playful';
  if (value.includes('poetic') || value.includes('dreamy')) return 'poetic';
  if (value.includes('sincere') || value.includes('simple') || value.includes('tender')) return 'sincere';
  return 'romantic';
}

export async function analyzeLoveCompatibility(
  person1: string,
  person2: string,
  loveLanguage1: string,
  loveLanguage2: string,
  score: number,
  recaptchaToken?: string
): Promise<{ result: string; adjustedScore: number }> {
  try {
    const data = await postJson<{ result: string; adjustedScore?: number }>('/api/analyze-compatibility', {
      person1, person2, loveLanguage1, loveLanguage2, score, recaptchaToken,
    });
    trackGeneratorCompleted('love-quiz', 'platform');
    return { result: data.result, adjustedScore: data.adjustedScore ?? score };
  } catch {
    trackError('analyze_compatibility', 'platform_failed_local_fallback');
    return quizLocal(loveLanguage1, loveLanguage2, score);
  }
}

export async function calculateLoveScore(
  name1: string,
  name2: string,
  relationshipStatus: string,
  duration: string,
  recaptchaToken?: string
): Promise<{ score: number; insight: string; message: string }> {
  try {
    const result = await postJson<{ score: number; insight: string; message: string }>('/api/calculate-love', { name1, name2, relationshipStatus, duration, recaptchaToken });
    trackGeneratorCompleted('love-score', 'platform');
    return result;
  } catch {
    trackError('calculate_love_score', 'platform_failed_local_fallback');
    return loveScoreLocal(name1, name2, relationshipStatus, duration);
  }
}

export async function calculateZodiacCompatibility(
  sign1: string,
  sign2: string,
  recaptchaToken?: string
): Promise<{ score: number; analysis: string }> {
  try {
    const result = await postJson<{ score: number; analysis: string }>('/api/zodiac-compatibility', { sign1, sign2, recaptchaToken });
    trackGeneratorCompleted('zodiac', 'platform');
    return result;
  } catch {
    trackError('zodiac_compatibility', 'platform_failed_local_fallback');
    return zodiacLocal(sign1, sign2);
  }
}

export async function calculateBirthdateCompatibility(
  date1: string,
  date2: string,
  recaptchaToken?: string
): Promise<{ score: number; analysis: string }> {
  try {
    const result = await postJson<{ score: number; analysis: string }>('/api/birthdate-compatibility', { date1, date2, recaptchaToken });
    trackGeneratorCompleted('birthdate', 'platform');
    return result;
  } catch {
    trackError('birthdate_compatibility', 'platform_failed_local_fallback');
    return birthdateLocal(date1, date2);
  }
}

export async function calculateNumerology(
  name1: string,
  name2: string,
  date1: string,
  date2: string,
  recaptchaToken?: string
): Promise<{ score: number; analysis: string }> {
  try {
    const result = await postJson<{ score: number; analysis: string }>('/api/numerology', { name1, name2, date1, date2, recaptchaToken });
    trackGeneratorCompleted('numerology', 'platform');
    return result;
  } catch {
    trackError('numerology', 'platform_failed_local_fallback');
    return numerologyLocal(name1, name2, date1, date2);
  }
}

export async function findSoulmate(data: {
  name: string;
  birthday: string;
  zodiacSign: string;
  interests: string[];
  loveLanguage: string;
  recaptchaToken?: string;
}): Promise<{ analysis: string; traits: string[] }> {
  try {
    const result = await postJson<{ analysis: string; traits: string[] }>('/api/soulmate-finder', data);
    trackGeneratorCompleted('soulmate', 'platform');
    return result;
  } catch {
    trackError('soulmate_finder', 'platform_failed_local_fallback');
    return soulmateLocal(data.name, data.zodiacSign, data.interests, data.loveLanguage);
  }
}

export async function generatePoem(
  name1: string,
  name2: string,
  theme: string,
  poemLength: number,
  rhyming: boolean,
  recaptchaToken?: string
): Promise<string> {
  trackGeneratorStarted('love-poem');
  const data = await postJson<{ poem: string }>('/api/generate-poem', {
    name1,
    name2,
    theme,
    poemLength,
    rhyming,
    recaptchaToken,
  });
  trackGeneratorCompleted('love-poem', 'platform');
  return data.poem;
}

async function postJson<T>(route: string, body: unknown): Promise<T> {
  const response = await fetch(`${PLATFORM_API_BASE}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client': 'lovetestai-mobile',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await readResponseDetails(response);
    throw new Error(`Platform API request failed: ${route} ${response.status}${details ? ` ${details}` : ''}`);
  }

  return await response.json() as T;
}

async function readResponseDetails(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return '';
  }
}

export async function sendCoachMessage(messages: { role: string; content: string }[]): Promise<string> {
  for (const route of ['/api/ai/coach', '/api/coach'] as const) {
    try {
      const text = await postToPlatform(route, { messages, source: 'mobile' });
      if (text) {
        trackGeneratorCompleted('coach', 'platform');
        return text;
      }
    } catch (error) {
      trackError('coach', 'platform_route_failed');
      console.log(`[AI] Coach route failed: ${route}`, error);
    }
  }

  await simulateDelay();
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  return getMockCoachResponse(lastMessage);
}

export async function rewriteMessage(originalMessage: string, tone: string): Promise<string> {
  for (const route of ['/api/ai/rewrite', '/api/rewrite'] as const) {
    try {
      const text = await postToPlatform(route, { originalMessage, tone, source: 'mobile' });
      if (text) {
        trackGeneratorCompleted('rewrite', 'platform');
        return text;
      }
    } catch (error) {
      trackError('rewrite', 'platform_route_failed');
      console.log(`[AI] Rewrite route failed: ${route}`, error);
    }
  }

  await simulateDelay();
  return getMockRewriteResponse(originalMessage, tone);
}

function simulateDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 700));
}

function getMockResponse(tool: string, params?: GenerateParams): string {
  const toName = params?.toName || 'my love';
  const fromName = params?.fromName || 'Me';

  const letterVariants = [
    `My Dearest ${toName},\n\nEvery morning I wake to a world made brighter simply because you exist in it. There is a tenderness in the way you move through life that catches me off guard still, after all this time.\n\nYou have this extraordinary way of making ordinary moments feel sacred. The way you laugh at your own jokes before you finish telling them. The way you remember the smallest details about the people you love.\n\nI want you to know that loving you has made me a better person. Not because you asked me to change, but because your love gave me the courage to become who I always wanted to be.\n\nWith all my heart,\n${fromName}`,
    `Dear ${toName},\n\nThere are things I carry with me that I have never quite found the words for until now. The way the light catches your eyes when you are telling me something that matters to you. The sound of your voice when it softens just for me.\n\nYou walked into my life and rearranged everything I thought I knew about love. You showed me that it is not about grand gestures or perfect timing. It is about choosing each other, every single day.\n\nAlways yours,\n${fromName}`,
  ];

  const poemVariants = [
    `In the quiet hours before dawn breaks,\nWhen the world is still and soft,\nI find you in the spaces between heartbeats,\nIn the warmth that lingers where your hand was.\n\nYou are the poem I never learned to write,\nThe melody that finds me unaware,\nA love so deep it lives beneath my skin,\nA truth so bright I see it everywhere.`,
    `Love arrived not as thunder,\nBut as morning light through curtains drawn,\nSoft, persistent, undeniable,\nTurning everything it touched to gold.\n\nYou were the answer\nTo a question I forgot I asked,\nThe missing verse in every song\nI tried to sing alone.`,
  ];

  const noteVariants = [
    `You are my favourite thought, my softest place to land, and the reason I smile before I even open my eyes.`,
    `In a world full of noise, you are my peace. Thank you for being exactly who you are.`,
    `I keep finding new reasons to love you, hidden in ordinary moments. You make everything better without even trying.`,
  ];

  const quoteVariants = [
    `Love is not finding someone to live with; it is finding someone you cannot imagine your life without.`,
    `The best love stories are not about finding perfection, but about learning to see beauty in each other's imperfections.`,
    `Love is the courage to be seen completely and the grace to see another as they truly are.`,
  ];

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const responses: Record<string, () => string> = {
    'love-letter': () => pick(letterVariants),
    'love-poem': () => pick(poemVariants),
    'love-note': () => pick(noteVariants),
    'love-quote': () => pick(quoteVariants),
  };

  return (responses[tool] || responses['love-letter'])();
}

function getMockCoachResponse(lastMessage: string): string {
  if (lastMessage.includes('rewrite') || lastMessage.includes('message')) {
    return 'Share the message and the tone you want, and I can help shape it into something clearer.';
  }

  return 'That sounds worth reflecting on. What would you like the other person to understand most clearly?';
}

function getMockRewriteResponse(originalMessage: string, tone: string): string {
  const cleaned = originalMessage.trim();
  if (!cleaned) return '';

  if (tone === 'Firmer') {
    return `I need to be clear about this: ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}`;
  }

  if (tone === 'More Romantic') {
    return `I want to say this with care, because you matter to me: ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}`;
  }

  return `I have been thinking about this, and I want to share it honestly: ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}`;
}
