const SYSTEM_PROMPTS: Record<string, string> = {
  'love-letter': `You are a romantic writer with a gift for deeply personal, moving letters. Write a heartfelt love letter. Return only the letter text. No explanations. No subject line.`,
  'love-poem': `You are a romantic poet. Write a beautiful love poem. Return only the poem. No title unless it flows naturally.`,
  'love-note': `You are a romantic. Write a short, genuine love note. Max 60 words. Return only the note.`,
  'love-quote': `You are a romantic philosopher. Write one original love quote. Max 35 words. Poetic but real. Return only the quote.`,
  'date-ideas': `You are a creative romantic planner. Suggest 5 specific date ideas. Be specific. Format as a clean numbered list. Return only the list.`,
  'conversation-starters': `You are a relationship coach. Generate 5 meaningful, open-ended conversation starters. Make them thought-provoking but approachable. Format as a clean numbered list. Return only the list.`,
  'coach': `You are a warm, thoughtful relationship communication coach. You help people communicate better, reflect more clearly, and navigate love with emotional intelligence. You do not diagnose, prescribe, or provide therapy. Ask open questions. Be concise (2-3 sentences unless depth is needed). If the topic requires professional support, gently acknowledge it and suggest speaking with a qualified counsellor - then continue supporting within your scope. Never start a message with a greeting word.`,
  'rewrite': `Rewrite the following message while preserving the original intent and meaning. Return only the rewritten message. No explanation.`,
};

interface GenerateParams {
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

function buildUserMessage(params: GenerateParams): string {
  const parts: string[] = [];

  if (params.fromName) parts.push(`From: ${params.fromName}`);
  if (params.toName) parts.push(`For: ${params.toName}`);
  if (params.tone) parts.push(`Tone: ${params.tone}`);
  if (params.length) parts.push(`Length: ${params.length}`);
  if (params.detail) parts.push(`What makes them special: ${params.detail}`);
  if (params.occasion) parts.push(`Occasion: ${params.occasion}`);
  if (params.style) parts.push(`Style: ${params.style}`);
  if (params.memory) parts.push(`Inspired by: ${params.memory}`);
  if (params.message) parts.push(`Core message: ${params.message}`);
  if (params.word) parts.push(`Inspired by the word: ${params.word}`);
  if (params.city) parts.push(`Location: ${params.city}`);
  if (params.vibe) parts.push(`Vibe: ${params.vibe}`);
  if (params.stage) parts.push(`Relationship stage: ${params.stage}`);

  return parts.join('\n');
}

export async function generateContent(params: GenerateParams, apiKey?: string): Promise<string> {
  const systemPrompt = SYSTEM_PROMPTS[params.tool] || SYSTEM_PROMPTS['love-letter'];
  const userMessage = buildUserMessage(params);

  if (!apiKey) {
    await simulateDelay();
    return getMockResponse(params.tool, params);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    if (data.content && data.content[0]) {
      return data.content[0].text;
    }
    return getMockResponse(params.tool, params);
  } catch (error) {
    console.log('Claude API error:', error);
    return getMockResponse(params.tool, params);
  }
}

export async function sendCoachMessage(
  messages: { role: string; content: string }[],
  apiKey?: string
): Promise<string> {
  if (!apiKey) {
    await simulateDelay();
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    return getMockCoachResponse(lastMessage);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPTS['coach'],
        messages: messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      }),
    });

    const data = await response.json();
    if (data.content && data.content[0]) {
      return data.content[0].text;
    }
    return getMockCoachResponse('');
  } catch (error) {
    console.log('Coach API error:', error);
    return getMockCoachResponse('');
  }
}

export async function rewriteMessage(originalMessage: string, tone: string, apiKey?: string): Promise<string> {
  if (!apiKey) {
    await simulateDelay();
    return getMockRewriteResponse(originalMessage, tone);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `${SYSTEM_PROMPTS['rewrite']} Tone: ${tone}.`,
        messages: [{ role: 'user', content: `Original message: "${originalMessage}"` }],
      }),
    });

    const data = await response.json();
    if (data.content && data.content[0]) {
      return data.content[0].text;
    }
    return getMockRewriteResponse(originalMessage, tone);
  } catch (error) {
    console.log('Rewrite API error:', error);
    return getMockRewriteResponse(originalMessage, tone);
  }
}

function simulateDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
}

function getMockResponse(tool: string, params?: GenerateParams): string {
  const toName = params?.toName || 'my love';
  const fromName = params?.fromName || 'Me';

  const letterVariants = [
    `My Dearest ${toName},\n\nEvery morning I wake to a world made brighter simply because you exist in it. There is a tenderness in the way you move through life that catches me off guard still, after all this time.\n\nYou have this extraordinary way of making ordinary moments feel sacred. The way you laugh at your own jokes before you finish telling them. The way you remember the smallest details about the people you love. The way you hold my hand a little tighter when you sense I need it.\n\nI want you to know that loving you has made me a better person. Not because you asked me to change, but because your love gave me the courage to become who I always wanted to be.\n\nWith all my heart and then some more,\n${fromName}`,
    `Dear ${toName},\n\nThere are things I carry with me that I have never quite found the words for until now. The way the light catches your eyes when you are telling me something that matters to you. The sound of your voice when it softens just for me. These are the moments I hold closest.\n\nYou walked into my life and rearranged everything I thought I knew about love. You showed me that it is not about grand gestures or perfect timing. It is about choosing each other, every single day, even on the hard ones.\n\nI do not need the world to be perfect. I just need you in it.\n\nAlways yours,\n${fromName}`,
    `${toName},\n\nI have been thinking about what it means to truly know someone. Not the surface things, but the quiet parts. The way you stir your coffee without thinking. The crease between your brows when you are concentrating. The way you always make sure everyone around you is taken care of before you think of yourself.\n\nThese are the things that made me fall in love with you. Not once, but again and again, every day.\n\nSome people spend their whole lives searching for what we have. I never want to take that for granted.\n\nWith everything I am,\n${fromName}`,
  ];

  const poemVariants = [
    `In the quiet hours before dawn breaks,\nWhen the world is still and soft,\nI find you in the spaces between heartbeats,\nIn the warmth that lingers where your hand was.\n\nYou are the poem I never learned to write,\nThe melody that finds me unaware,\nA love so deep it lives beneath my skin,\nA truth so bright I see it everywhere.\n\nAnd if the stars should ask me what I wish for,\nI would simply whisper back your name.`,
    `Love arrived not as thunder,\nBut as morning light through curtains drawn,\nSoft, persistent, undeniable,\nTurning everything it touched to gold.\n\nYou were the answer\nTo a question I forgot I asked,\nThe missing verse in every song\nI tried to sing alone.\n\nNow my days begin and end\nWith the same three syllables,\nA prayer, a promise, a place to rest:\nYour name upon my lips.`,
    `I did not fall in love with you.\nI walked into it, eyes wide open,\nChoosing you with every step,\nEvery breath, every morning\nI decided to stay.\n\nLove is not a cliff's edge.\nIt is a garden tended daily,\nWatered with patience,\nFed by the small, deliberate acts\nOf two people who refuse to let go.`,
  ];

  const noteVariants = [
    `You are my favourite thought, my softest place to land, and the reason I smile before I even open my eyes. Just wanted you to know.`,
    `In a world full of noise, you are my peace. Thank you for being exactly who you are.`,
    `I keep finding new reasons to love you, hidden in ordinary moments. You make everything better without even trying.`,
    `No matter what today brings, know this: you are loved, you are enough, and I would choose you all over again.`,
  ];

  const quoteVariants = [
    `Love is not finding someone to live with; it is finding someone you cannot imagine your life without.`,
    `The best love stories are not about finding perfection, but about learning to see beauty in each other's imperfections.`,
    `To love deeply is to accept the risk of loss and decide, every single day, that the beauty is worth it.`,
    `Love is the courage to be seen completely and the grace to see another as they truly are.`,
    `We are not two halves of a whole. We are two wholes who chose to walk side by side.`,
  ];

  const dateIdeasVariants = [
    `1. Sunset picnic at a botanical garden with homemade pastries and your favourite playlist\n2. A hands-on cooking class for a cuisine neither of you has tried before\n3. Stargazing drive to a spot outside the city with blankets and hot chocolate\n4. Visit an independent bookshop, each pick a book for the other, then read at a cozy cafe\n5. Take a sunrise hike to a lookout point and have breakfast at the top`,
    `1. Wine and pottery painting evening at a local studio\n2. A food tour through the oldest neighbourhood in your city\n3. Rent kayaks or paddleboards and explore a nearby lake at golden hour\n4. Create a homemade spa evening with candles, face masks, and a curated playlist\n5. Visit a farmers market together, then cook a meal from only what you find there`,
    `1. Take a scenic train ride to a nearby town and explore for the day\n2. Go to an outdoor cinema screening with a picnic blanket and snacks\n3. Sign up for a dance class together, something new to both of you\n4. Visit an art gallery, then sketch portraits of each other at a cafe afterward\n5. Plan a themed dinner night at home, recreating a meal from a country you both want to visit`,
  ];

  const startersVariants = [
    `1. What is one dream you have never told anyone about?\n2. If we could relive one day together, which would you choose and why?\n3. What does feeling truly safe with someone mean to you?\n4. What is something you have always wanted to ask me but never have?\n5. When do you feel most loved and appreciated in our relationship?`,
    `1. What is one thing you wish you could change about how we communicate?\n2. If you could describe our relationship in three words, what would they be?\n3. What is a childhood memory that shaped how you love today?\n4. What is one small thing I do that means more to you than I probably realise?\n5. Where do you see us in five years, and what does that look like to you?`,
    `1. What is the most important lesson love has taught you so far?\n2. If we had an entire weekend with no responsibilities, how would you want to spend it?\n3. What is one thing about yourself that you hope I always understand?\n4. How do you know when you feel truly connected to someone?\n5. What does a perfect ordinary day together look like for you?`,
  ];

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const responses: Record<string, () => string> = {
    'love-letter': () => pick(letterVariants),
    'love-poem': () => pick(poemVariants),
    'love-note': () => pick(noteVariants),
    'love-quote': () => pick(quoteVariants),
    'date-ideas': () => pick(dateIdeasVariants),
    'conversation-starters': () => pick(startersVariants),
  };

  const fn = responses[tool] || responses['love-letter'];
  return fn();
}

function getMockCoachResponse(lastMessage: string): string {
  if (lastMessage.includes('hard conversation') || lastMessage.includes('difficult')) {
    return 'Starting a hard conversation takes courage, and the fact that you are thinking about it shows real emotional maturity. What specifically feels most daunting about it - is it the fear of their reaction, or the vulnerability of expressing your own needs?';
  }

  if (lastMessage.includes('rewrite') || lastMessage.includes('message')) {
    return 'I can help you craft a message that says what you truly mean. When you are ready, share the original message and tell me what tone you are going for. We can work through it together to make sure it lands the way you intend.';
  }

  if (lastMessage.includes('demanding') || lastMessage.includes('too much')) {
    return 'Having needs does not make you demanding. The question is whether you are expressing those needs in a way that invites collaboration rather than defensiveness. What specific need are you worried might be perceived as too much?';
  }

  if (lastMessage.includes('reconnect') || lastMessage.includes('disconnect')) {
    return 'Feeling disconnected is one of the most common relationship challenges, and it often signals that something important needs attention. When did you first notice the distance, and what was different before that shift?';
  }

  if (lastMessage.includes('attachment') || lastMessage.includes('anxious') || lastMessage.includes('avoidant')) {
    return 'Understanding your attachment style can be incredibly illuminating for how you show up in relationships. It is not a label that defines you, but a pattern you can become aware of and work with. What specifically about your attachment patterns are you noticing right now?';
  }

  if (lastMessage.includes('angry') || lastMessage.includes('frustrated') || lastMessage.includes('upset')) {
    return 'Anger often sits on top of a deeper feeling - hurt, fear, or unmet expectations. Before we think about what to say, let us explore what is underneath that frustration. What do you think you really need in this situation?';
  }

  if (lastMessage.includes('trust') || lastMessage.includes('betrayed')) {
    return 'Trust is one of the most delicate parts of any relationship, and rebuilding it requires both patience and intentional action from both people. This is something where professional support can be incredibly valuable. What does trust look like for you in its healthiest form?';
  }

  if (lastMessage.includes('love') || lastMessage.includes('feelings')) {
    return 'Expressing your feelings authentically is one of the bravest things you can do. What is holding you back from sharing what you feel - is it uncertainty about how they will respond, or uncertainty about the feelings themselves?';
  }

  const generalResponses = [
    'That sounds like something worth exploring further. What specifically about that situation feels most challenging for you right now?',
    'It takes real self-awareness to notice that pattern. When you think about what you truly need in that moment, what comes to mind?',
    'I hear you. Sometimes the hardest conversations are the ones we most need to have. What would it look like if you could express that honestly, without fear of the outcome?',
    'There is something important in what you are describing. Let us slow down and look at it from a different angle. If your partner were telling you this same thing, what would you want them to know?',
    'That is a really thoughtful observation about yourself. How long have you been noticing this pattern, and what do you think might be driving it?',
    'It sounds like you are carrying a lot right now. Before we work on solutions, I want to make sure you feel heard. What is the core of what you are experiencing?',
    'Sometimes the most powerful thing we can do is simply sit with what we are feeling before trying to fix it. What would it feel like to give yourself permission to not have all the answers right now?',
    'You are asking the right questions, which tells me you are already on a path of growth. What would a good outcome look like for you in this situation?',
  ];
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

function getMockRewriteResponse(originalMessage: string, tone: string): string {
  const toneMap: Record<string, (msg: string) => string> = {
    'Kinder': (msg) => `I have been thinking about this, and I want to share something with you from a place of care. ${msg.charAt(0).toUpperCase() + msg.slice(1).replace(/[!]+/g, '.')} I hope we can talk about this together.`,
    'Clearer': (msg) => `I want to be straightforward with you about something important. ${msg.charAt(0).toUpperCase() + msg.slice(1).replace(/[!]+/g, '.')} I would appreciate it if we could discuss this openly.`,
    'More Romantic': (msg) => `There is something on my heart that I need to share with you. ${msg.charAt(0).toUpperCase() + msg.slice(1).replace(/[!]+/g, '.')} You mean everything to me, and that is exactly why this matters.`,
    'Firmer': (msg) => `I need to be honest about where I stand on this. ${msg.charAt(0).toUpperCase() + msg.slice(1).replace(/[!]+/g, '.')} This is important to me, and I need us to address it.`,
  };

  const fn = toneMap[tone] || toneMap['Kinder'];
  return fn(originalMessage);
}
