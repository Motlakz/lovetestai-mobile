// Offline-capable local computation engine — mirrors the web compatibility rule engine.
// Used as fallback when the API is unreachable.

const BASE = 52;

// ── Zodiac ────────────────────────────────────────────────────────────────────

type ZodiacSign = 'Aries'|'Taurus'|'Gemini'|'Cancer'|'Leo'|'Virgo'|'Libra'|'Scorpio'|'Sagittarius'|'Capricorn'|'Aquarius'|'Pisces';
type Element  = 'Fire'|'Earth'|'Air'|'Water';
type Modality = 'Cardinal'|'Fixed'|'Mutable';

const ELEMENTS: Record<ZodiacSign, Element> = {
  Aries:'Fire', Leo:'Fire', Sagittarius:'Fire',
  Taurus:'Earth', Virgo:'Earth', Capricorn:'Earth',
  Gemini:'Air', Libra:'Air', Aquarius:'Air',
  Cancer:'Water', Scorpio:'Water', Pisces:'Water',
};

const MODALITIES: Record<ZodiacSign, Modality> = {
  Aries:'Cardinal', Cancer:'Cardinal', Libra:'Cardinal', Capricorn:'Cardinal',
  Taurus:'Fixed', Leo:'Fixed', Scorpio:'Fixed', Aquarius:'Fixed',
  Gemini:'Mutable', Virgo:'Mutable', Sagittarius:'Mutable', Pisces:'Mutable',
};

const ELEMENT_DESC: Record<Element, string> = {
  Fire:  'passionate, dynamic energy',
  Earth: 'grounded, practical strength',
  Air:   'intellectual, communicative spirit',
  Water: 'deep emotional intuition',
};

const RULERS: Record<ZodiacSign, string[]> = {
  Aries:['Mars'], Taurus:['Venus'], Gemini:['Mercury'], Cancer:['Moon'], Leo:['Sun'],
  Virgo:['Mercury'], Libra:['Venus'], Scorpio:['Mars','Pluto'], Sagittarius:['Jupiter'],
  Capricorn:['Saturn'], Aquarius:['Saturn','Uranus'], Pisces:['Jupiter','Neptune'],
};

const OPPOSITION_PAIRS: [ZodiacSign, ZodiacSign][] = [
  ['Aries','Libra'],['Taurus','Scorpio'],['Gemini','Sagittarius'],
  ['Cancer','Capricorn'],['Leo','Aquarius'],['Virgo','Pisces'],
];

const CLASSIC_PAIRS: [ZodiacSign, ZodiacSign][] = [
  ['Aries','Leo'],['Aries','Sagittarius'],['Taurus','Virgo'],['Taurus','Capricorn'],
  ['Gemini','Libra'],['Gemini','Aquarius'],['Cancer','Scorpio'],['Cancer','Pisces'],
  ['Leo','Sagittarius'],['Virgo','Capricorn'],['Libra','Aquarius'],['Scorpio','Pisces'],
];

function pairMatch(pairs: [ZodiacSign, ZodiacSign][], s1: ZodiacSign, s2: ZodiacSign): boolean {
  return pairs.some(([a, b]) => (a === s1 && b === s2) || (a === s2 && b === s1));
}

function elementRelation(e1: Element, e2: Element): 'same'|'complementary'|'supportive'|'challenging' {
  if (e1 === e2) return 'same';
  if ((e1==='Fire'&&e2==='Air')||(e1==='Air'&&e2==='Fire')) return 'complementary';
  if ((e1==='Earth'&&e2==='Water')||(e1==='Water'&&e2==='Earth')) return 'complementary';
  if ((e1==='Fire'&&e2==='Earth')||(e1==='Earth'&&e2==='Fire')) return 'supportive';
  if ((e1==='Water'&&e2==='Air')||(e1==='Air'&&e2==='Water')) return 'supportive';
  return 'challenging';
}

export function zodiacLocal(sign1: string, sign2: string): { score: number; analysis: string } {
  const s1 = sign1 as ZodiacSign;
  const s2 = sign2 as ZodiacSign;
  const e1 = ELEMENTS[s1] ?? 'Fire';
  const e2 = ELEMENTS[s2] ?? 'Fire';
  const m1 = MODALITIES[s1] ?? 'Cardinal';
  const m2 = MODALITIES[s2] ?? 'Cardinal';
  const notes: string[] = [];
  let delta = 0;

  // Element
  const er = elementRelation(e1, e2);
  if (er === 'same') {
    delta += 22;
    notes.push(`Both ${s1} and ${s2} share ${e1} energy (${ELEMENT_DESC[e1]}), creating an instinctive mutual recognition — they speak the same elemental language without translation.`);
  } else if (er === 'complementary') {
    delta += 16;
    const pair = (e1==='Fire'||e2==='Fire')
      ? `Air fans ${e1==='Fire'?s1:s2}'s Fire — intellect and action form a self-amplifying cycle`
      : `Earth gives ${e1==='Water'?s1:s2}'s Water purpose and direction`;
    notes.push(`${s1} (${e1}) and ${s2} (${e2}) share a complementary elemental bond: ${pair}.`);
  } else if (er === 'supportive') {
    delta -= 7;
    notes.push(`${e1} and ${e2} create productive friction — different energies that require conscious bridging but can produce real growth.`);
  } else {
    delta -= 12;
    const desc = (e1==='Fire'||e2==='Fire')
      ? 'Fire and Water — passion and emotion can forge something extraordinary or overwhelm each other'
      : 'Earth and Air — practicality meets idealism, demanding profound patience';
    notes.push(`${s1} and ${s2} face elemental contrast: ${desc}.`);
  }

  // Modality
  if (m1 !== m2) {
    if ((m1==='Cardinal'&&m2==='Mutable')||(m1==='Mutable'&&m2==='Cardinal')) {
      delta += 8;
      const init = m1==='Cardinal'?s1:s2; const adapt = m1==='Mutable'?s1:s2;
      notes.push(`${init}'s Cardinal drive pairs beautifully with ${adapt}'s Mutable adaptability — one leads while the other flows.`);
    } else if ((m1==='Fixed'&&m2==='Mutable')||(m1==='Mutable'&&m2==='Fixed')) {
      delta += 5;
      const stable = m1==='Fixed'?s1:s2; const flex = m1==='Mutable'?s1:s2;
      notes.push(`${stable}'s Fixed commitment provides an anchor for ${flex}'s Mutable flexibility across life's changes.`);
    } else {
      delta += 4;
      const lead = m1==='Cardinal'?s1:s2; const sustain = m1==='Fixed'?s1:s2;
      notes.push(`${lead}'s initiative and ${sustain}'s follow-through form a productive cycle — one opens doors, the other builds what lies beyond.`);
    }
  } else if (m1 === 'Fixed') {
    delta -= 8;
    notes.push(`Both ${s1} and ${s2} are Fixed signs — profound loyalty, but compromise must be consciously chosen rather than assumed.`);
  } else if (m1 === 'Mutable') {
    delta += 4;
    notes.push(`Both are Mutable — fluid and open to change, they bend together rather than break.`);
  }

  // Special pairings
  if (s1 === s2) {
    delta += 8;
    notes.push(`Two ${s1}s understand each other with uncanny precision — immediate rapport through shared drives and gifts.`);
  } else if (pairMatch(OPPOSITION_PAIRS, s1, s2)) {
    delta += 7;
    notes.push(`${s1} and ${s2} sit on the same polarity axis — opposites who complete each other, each teaching what the other most needs to develop.`);
  }
  if (pairMatch(CLASSIC_PAIRS, s1, s2)) {
    delta += 10;
    notes.push(`${s1} and ${s2} are among astrology's most celebrated pairings, studied for centuries for their natural chemistry and lasting depth.`);
  }
  if (s1 !== s2 && RULERS[s1].some(p => RULERS[s2].includes(p))) {
    delta += 5;
    const shared = RULERS[s1].find(p => RULERS[s2].includes(p))!;
    notes.push(`Both signs share ${shared} as a ruling influence, producing quietly aligned values and instincts.`);
  }

  const score = Math.min(99, Math.max(35, BASE + delta));
  const analysis = notes.join('\n\n');
  return { score, analysis };
}

// ── Birthdate ─────────────────────────────────────────────────────────────────

const ANIMALS = ['Monkey','Rooster','Dog','Pig','Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat'];
const TRINITIES = [[4,8,0],[5,9,1],[6,10,2],[7,11,3]];
const HARMONIOUS_PAIRS: [number,number][] = [[4,5],[6,3],[7,2],[8,1],[9,0],[10,11]];
const CLASH_PAIRS: [number,number][] = [[4,10],[5,11],[6,0],[7,1],[8,2],[9,3]];

function czIndex(year: number): number { return year % 12; }
function inTrinity(a: number, b: number): boolean { return TRINITIES.some(t => t.includes(a) && t.includes(b)); }
function inHarmony(a: number, b: number): boolean { return HARMONIOUS_PAIRS.some(([x,y]) => (x===a&&y===b)||(x===b&&y===a)); }
function inClash(a: number, b: number): boolean { return CLASH_PAIRS.some(([x,y]) => (x===a&&y===b)||(x===b&&y===a)); }

function getSeason(month: number): string {
  if (month>=3&&month<=5) return 'Spring';
  if (month>=6&&month<=8) return 'Summer';
  if (month>=9&&month<=11) return 'Autumn';
  return 'Winter';
}

function parseYMD(dateStr: string): { year: number; month: number } {
  const d = new Date(dateStr + 'T12:00:00Z');
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export function birthdateLocal(date1: string, date2: string): { score: number; analysis: string } {
  const { year: y1, month: m1 } = parseYMD(date1);
  const { year: y2, month: m2 } = parseYMD(date2);
  const a1 = czIndex(y1); const a2 = czIndex(y2);
  const animal1 = ANIMALS[a1] ?? 'an animal'; const animal2 = ANIMALS[a2] ?? 'an animal';
  const notes: string[] = [];
  let delta = 0;

  if (y1 !== y2 && a1 === a2) {
    delta -= 3;
    notes.push(`Both born in the Year of the ${animal1} — identical energy creates deep familiarity but also mirrors each other's shadows; growth requires stepping beyond the echo.`);
  } else if (a1 !== a2 && inTrinity(a1, a2)) {
    delta += 14;
    notes.push(`${animal1} and ${animal2} belong to the same Chinese zodiac trinity — among the most harmonious pairings in Eastern astrology, sharing compatible temperament and life philosophy.`);
  } else if (inHarmony(a1, a2)) {
    delta += 8;
    notes.push(`${animal1} and ${animal2} form a harmonious Chinese zodiac pairing — naturally cooperative, each brings what the other needs.`);
  } else if (inClash(a1, a2)) {
    delta -= 15;
    notes.push(`${animal1} and ${animal2} are in a classic zodiac clash — this creates friction that demands real patience, but the dynamic can also forge extraordinary resilience together.`);
  } else {
    notes.push(`${animal1} and ${animal2} carry neutral Chinese zodiac energy — their story is written by their choices, not cosmic constraints.`);
  }

  // Season
  const s1 = getSeason(m1); const s2 = getSeason(m2);
  if (s1 === s2) {
    delta += 6;
    notes.push(`Both born in ${s1} — shared seasonal rhythms tend to produce intuitive timing and compatible energy cycles.`);
  } else if ((s1==='Spring'&&s2==='Autumn')||(s1==='Autumn'&&s2==='Spring')||(s1==='Summer'&&s2==='Winter')||(s1==='Winter'&&s2==='Summer')) {
    delta += 9;
    notes.push(`${s1} meets ${s2} — complementary seasonal energies that create a satisfying sense of completeness in each other.`);
  } else {
    delta += 2;
    notes.push(`${s1} and ${s2} bring adjacent seasonal energies that transition naturally into one another.`);
  }

  const score = Math.min(99, Math.max(35, BASE + delta));
  const analysis = notes.join('\n\n');
  return { score, analysis };
}

// ── Numerology ────────────────────────────────────────────────────────────────

function reduceNum(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((s, c) => s + parseInt(c, 10), 0);
  }
  return n;
}

function lifePathNumber(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00Z');
  return reduceNum(reduceNum(d.getUTCDate()) + reduceNum(d.getUTCMonth() + 1) + reduceNum(d.getUTCFullYear()));
}

function expressionNumber(name: string): number {
  const map: Record<string,number> = {
    a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,
    j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,
    s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8,
  };
  const sum = name.toLowerCase().replace(/[^a-z]/g,'').split('').reduce((acc, ch) => acc + (map[ch] ?? 0), 0);
  return reduceNum(sum);
}

const LP_MEANING: Record<number, string> = {
  1:'The Leader', 2:'The Diplomat', 3:'The Creator', 4:'The Builder', 5:'The Explorer',
  6:'The Nurturer', 7:'The Seeker', 8:'The Achiever', 9:'The Humanitarian',
  11:'The Visionary', 22:'The Master Builder', 33:'The Master Teacher',
};

const LP_DELTA: Record<string,number> = {
  '1-1':-8,'1-2':12,'1-3':10,'1-4':-12,'1-5':18,'1-6':8,'1-7':6,'1-8':12,'1-9':10,
  '2-2':14,'2-3':12,'2-4':16,'2-5':-8,'2-6':20,'2-7':14,'2-8':8,'2-9':12,
  '3-3':8,'3-4':-6,'3-5':16,'3-6':15,'3-7':12,'3-8':10,'3-9':18,
  '4-4':10,'4-5':-12,'4-6':18,'4-7':14,'4-8':16,'4-9':8,
  '5-5':8,'5-6':-10,'5-7':14,'5-8':10,'5-9':14,
  '6-6':14,'6-7':12,'6-8':15,'6-9':20,
  '7-7':8,'7-8':8,'7-9':16,
  '8-8':-5,'8-9':12,
  '9-9':12,'11-11':15,'22-22':15,'33-33':15,'11-22':10,'11-33':10,'22-33':10,
};

const LP_NARRATIVES: Record<string,string> = {
  '1-5':'two dynamic free-spirited souls who ignite each other\'s pioneering energy',
  '2-6':'the Diplomat and the Nurturer — love, harmony, and devotion woven into a complementary whole',
  '3-9':'the Creator and the Humanitarian — artistic vision meets universal compassion',
  '4-6':'the Builder and the Nurturer — stability and warmth create an enduring foundation',
  '4-8':'two achievement-oriented forces who build empires together',
  '6-9':'love and universal compassion — both devoted to others, they find their deepest calling in each other',
  '2-4':'emotional depth meets practical structure — quiet, profound reliability',
  '3-5':'joy meets adventure — expressive creativity and free-spirited exploration',
  '5-7':'the Explorer and the Seeker — two souls who discover meaning together',
  '7-9':'wisdom and compassion converge — a rare, soulful bond',
};

export function numerologyLocal(name1: string, name2: string, date1: string, date2: string): { score: number; analysis: string } {
  const lp1 = lifePathNumber(date1); const lp2 = lifePathNumber(date2);
  const expr1 = expressionNumber(name1); const expr2 = expressionNumber(name2);
  const lpKey = lp1 <= lp2 ? `${lp1}-${lp2}` : `${lp2}-${lp1}`;
  const lpDelta = LP_DELTA[lpKey] ?? 0;
  const exprKey = expr1 <= expr2 ? `${expr1}-${expr2}` : `${expr2}-${expr1}`;
  const exprDelta = Math.round((LP_DELTA[exprKey] ?? 0) * 0.5);
  const score = Math.min(99, Math.max(35, BASE + lpDelta + exprDelta));

  const m1 = LP_MEANING[lp1] ?? `Life Path ${lp1}`;
  const m2 = LP_MEANING[lp2] ?? `Life Path ${lp2}`;
  const narrative = LP_NARRATIVES[lpKey];
  const lpLine = narrative
    ? `${name1}'s Life Path ${lp1} (${m1}) and ${name2}'s Life Path ${lp2} (${m2}) form ${narrative}.`
    : lpDelta >= 10
      ? `${name1}'s Life Path ${lp1} (${m1}) and ${name2}'s Life Path ${lp2} (${m2}) carry compatible numerological energy — their numbers reinforce rather than resist each other.`
      : lpDelta <= -5
        ? `${name1}'s Life Path ${lp1} (${m1}) and ${name2}'s Life Path ${lp2} (${m2}) represent contrasting paths — real harmony here is earned through understanding, not assumed.`
        : `${name1}'s Life Path ${lp1} (${m1}) and ${name2}'s Life Path ${lp2} (${m2}) occupy neutral numerological ground — their story is shaped by intention.`;

  const exprLine = expr1 === expr2
    ? `Their Expression Numbers both resolve to ${expr1}, suggesting a shared approach to communicating love.`
    : `${name1}'s Expression Number ${expr1} and ${name2}'s Expression Number ${expr2} bring complementary communicative styles.`;

  const analysis = `${lpLine}\n\n${exprLine}`;
  return { score, analysis };
}

// ── Love Score ────────────────────────────────────────────────────────────────

function nameHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const STATUS_INSIGHT: Record<string, string> = {
  'Just Met': 'There is something quietly electric in the early stages of discovery. The numbers point to genuine potential here — a connection worth exploring with openness and patience.',
  'Dating': 'The early chapters of this relationship carry real momentum. What you are building now has the texture of something that could last.',
  'Committed': 'A committed connection often contains depths its participants haven\'t fully mapped yet. The numbers suggest a bond that has already proven itself in small, meaningful ways.',
  'Married': 'The mathematics of a lasting union go beyond compatibility scores — they are written in chosen moments, forgiven silences, and the daily act of showing up. This pairing carries that kind of quiet strength.',
};

const STATUS_MESSAGE: Record<string, string> = {
  'Just Met': 'Let curiosity lead. The best love stories rarely announce themselves.',
  'Dating': 'Enjoy the discovery. The foundation you are laying now matters more than the pace.',
  'Committed': 'Keep choosing each other — especially on the ordinary days.',
  'Married': 'You already know the answer to the question the numbers are asking.',
};

export function loveScoreLocal(name1: string, name2: string, status: string, _duration?: string): { score: number; insight: string; message: string } {
  const combined = nameHash(name1.toLowerCase() + name2.toLowerCase());
  const score = 55 + (combined % 36);
  const insight = STATUS_INSIGHT[status] ?? STATUS_INSIGHT['Dating'];
  const message = STATUS_MESSAGE[status] ?? STATUS_MESSAGE['Dating'];
  return { score, insight, message };
}

// ── Soulmate ──────────────────────────────────────────────────────────────────

const ELEMENT_COMPLEMENT: Record<Element, string> = {
  Fire:  'Air or Fire — someone who either fans your flame or shares your heat',
  Earth: 'Water or Earth — someone who nourishes your groundedness or stands equally rooted',
  Air:   'Fire or Air — someone who lights up your mind or speaks the same intellectual language',
  Water: 'Earth or Water — someone who holds your depth or dives equally deep',
};

const ELEMENT_PARTNER_DESC: Record<Element, string> = {
  Fire:  'someone with the imagination to match your passion and the courage to dream as boldly as you do',
  Earth: 'someone reliable, emotionally present, and capable of building a life with you rather than just sharing it',
  Air:   'someone who can keep up with you intellectually and bring grounded emotion to balance your restless mind',
  Water: 'someone secure enough to hold your depth without being overwhelmed, and open enough to be moved by you',
};

const LL_PARTNER_TRAITS: Record<string, string[]> = {
  'Words of Affirmation': ['verbally expressive and affirming', 'communicates love clearly and often', 'notices and names what they appreciate in you'],
  'Physical Touch':       ['physically warm and present', 'comfortable with closeness and affection', 'expresses care through touch and proximity'],
  'Quality Time':         ['fully present when with you', 'prioritises shared experiences over distractions', 'listens without an agenda'],
  'Receiving Gifts':      ['thoughtful and observant', 'remembers the small things that matter to you', 'shows they were thinking of you through gesture'],
  'Acts of Service':      ['action-oriented in showing care', 'notices what you need and does it', 'reliable and consistent in follow-through'],
};

export function soulmateLocal(
  name: string,
  zodiacSign: string,
  interests: string[],
  loveLanguage: string,
): { analysis: string; traits: string[] } {
  const element = ELEMENTS[zodiacSign as ZodiacSign] ?? 'Fire';
  const complement = ELEMENT_COMPLEMENT[element];
  const partnerDesc = ELEMENT_PARTNER_DESC[element];
  const llTraits = LL_PARTNER_TRAITS[loveLanguage] ?? LL_PARTNER_TRAITS['Quality Time'];
  const interestNote = interests.length > 0
    ? `Someone who shares or respects your interest in ${interests.slice(0, 2).join(' and ')} will feel like a natural fit.`
    : 'Someone who is curious about your world and invites you into theirs.';

  const analysis = [
    `${name}'s soulmate profile points to ${partnerDesc}.`,
    `Elementally, ${zodiacSign} finds the deepest resonance with ${complement}.`,
    `Because your love language is ${loveLanguage}, the most important thing your ideal partner can offer is: ${llTraits[0]}.`,
    interestNote,
  ].join('\n\n');

  const traits = [
    ...llTraits,
    `emotionally secure and not threatened by your independence`,
    `curious about life and committed to growing alongside you`,
  ].slice(0, 6);

  return { analysis, traits };
}

// ── Compatibility Quiz ────────────────────────────────────────────────────────

const LANG_COMPAT: Record<string, Record<string, number>> = {
  'Words of Affirmation': { 'Words of Affirmation':20, 'Quality Time':14, 'Acts of Service':8, 'Physical Touch':8, 'Receiving Gifts':5 },
  'Acts of Service':      { 'Words of Affirmation':8,  'Acts of Service':18, 'Quality Time':14, 'Physical Touch':12, 'Receiving Gifts':8 },
  'Quality Time':         { 'Words of Affirmation':14, 'Acts of Service':14, 'Quality Time':20, 'Physical Touch':14, 'Receiving Gifts':6 },
  'Physical Touch':       { 'Words of Affirmation':8,  'Acts of Service':12, 'Quality Time':14, 'Physical Touch':22, 'Receiving Gifts':6 },
  'Receiving Gifts':      { 'Words of Affirmation':5,  'Acts of Service':8,  'Quality Time':6,  'Physical Touch':6,  'Receiving Gifts':10 },
};

function langDelta(l1: string, l2: string): number {
  return LANG_COMPAT[l1]?.[l2] ?? LANG_COMPAT[l2]?.[l1] ?? 8;
}

export function quizLocal(loveLanguage1: string, loveLanguage2: string, quizScore: number): { result: string; adjustedScore: number } {
  const raw = langDelta(loveLanguage1, loveLanguage2);
  const langNormalized = (raw / 22) * 100;
  const blended = quizScore * 0.8 + langNormalized * 0.2;
  const adjustedScore = Math.round(Math.min(99, Math.max(20, blended)));

  const tier = adjustedScore >= 85 ? 'exceptional' : adjustedScore >= 70 ? 'strong' : adjustedScore >= 55 ? 'promising' : adjustedScore >= 40 ? 'complex' : 'challenging';
  const langSame = loveLanguage1 === loveLanguage2;

  const langLine = langSame
    ? `Both of you speak the language of **${loveLanguage1}** — you understand each other's expressions of love intuitively, which creates a deep, reassuring baseline of connection.`
    : `Your love languages — **${loveLanguage1}** and **${loveLanguage2}** — represent different but potentially complementary ways of giving and receiving love. Learning each other's preferred forms of care is the highest-leverage investment you can make.`;

  const scoreLine = adjustedScore >= 70
    ? `Your quiz score reflects a **${tier}** alignment — a genuinely encouraging foundation to actively build on.`
    : adjustedScore >= 50
      ? `Your quiz score reflects a **${tier}** alignment — real strengths alongside honest growth areas. The most valuable next step is an open conversation about what each of you needs most.`
      : `Your quiz score reflects a **${tier}** alignment — meaningful differences that deserve courageous, direct conversation. Awareness of the gaps is the first step toward bridging them.`;

  const result = `${langLine}\n\n${scoreLine}`;
  return { result, adjustedScore };
}
