export type CreationTool = 'love-letter' | 'love-poem' | 'love-note' | 'love-quote';

export type CreationTemplateId =
  | 'midnight-roses'
  | 'golden-hour'
  | 'ocean-mist'
  | 'blush-confetti'
  | 'forest-spell'
  | 'cosmic-dream'
  | 'coastal-serenity'
  | 'enchanted-woodland'
  | 'celestial-embrace'
  | 'cherry-blossom'
  | 'vintage-love'
  | 'parisian-twilight'
  | 'underwater-reverie'
  | 'alpine-dawn'
  | 'autumn-whispers'
  | 'cosmic-convergence';

export interface CreationGlyph {
  symbol: string;
  x: `${number}%`;
  y: `${number}%`;
  size: number;
  rotate: number;
  opacity: number;
}

export interface CreationTemplate {
  id: CreationTemplateId;
  name: string;
  description: string;
  tools: CreationTool[];
  accent: string;
  secondary: string;
  tertiary: string;
  background: readonly [string, string, string];
  text: string;
  muted: string;
  badge: string;
  glow: string;
  previewGlyph: string;
  fontTone: 'serif' | 'script' | 'modern' | 'editorial';
  glyphs: CreationGlyph[];
}

const noteTemplates: CreationTemplate[] = [
  {
    id: 'midnight-roses',
    name: 'Midnight Roses',
    description: 'Deep rose glow and soft star marks',
    tools: ['love-note', 'love-quote'],
    accent: '#F9C8D8',
    secondary: '#DC5078',
    tertiary: '#5A183D',
    background: ['#1A0A1E', '#2D0E2E', '#1A0815'],
    text: '#F7E8F0',
    muted: 'rgba(247,232,240,0.62)',
    badge: 'rgba(255,255,255,0.10)',
    glow: 'rgba(220,80,120,0.65)',
    previewGlyph: 'rose',
    fontTone: 'script',
    glyphs: [
      { symbol: 'rose', x: '76%', y: '2%', size: 86, rotate: 18, opacity: 0.1 },
      { symbol: 'heart', x: '8%', y: '70%', size: 56, rotate: -16, opacity: 0.08 },
      { symbol: 'sparkle', x: '18%', y: '12%', size: 24, rotate: 0, opacity: 0.18 },
    ],
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    description: 'Warm amber light for tender notes',
    tools: ['love-note', 'love-poem', 'love-quote'],
    accent: '#F0C860',
    secondary: '#B88917',
    tertiary: '#FFDC98',
    background: ['#1C1408', '#2E2010', '#1A1206'],
    text: '#F5E6C0',
    muted: 'rgba(245,230,192,0.60)',
    badge: 'rgba(255,255,255,0.10)',
    glow: 'rgba(200,160,40,0.65)',
    previewGlyph: 'sunny',
    fontTone: 'serif',
    glyphs: [
      { symbol: 'sunny', x: '67%', y: '-2%', size: 104, rotate: 0, opacity: 0.09 },
      { symbol: 'flame', x: '4%', y: '67%', size: 54, rotate: -8, opacity: 0.08 },
      { symbol: 'sparkle', x: '84%', y: '72%', size: 18, rotate: 45, opacity: 0.16 },
    ],
  },
  {
    id: 'ocean-mist',
    name: 'Ocean Mist',
    description: 'Blue moonlight and quiet waves',
    tools: ['love-note', 'love-poem'],
    accent: '#80CEF8',
    secondary: '#5AB5D0',
    tertiary: '#D0F0FF',
    background: ['#081824', '#0D2030', '#06131E'],
    text: '#D0EAF8',
    muted: 'rgba(208,234,248,0.60)',
    badge: 'rgba(255,255,255,0.10)',
    glow: 'rgba(0,150,220,0.60)',
    previewGlyph: 'water',
    fontTone: 'serif',
    glyphs: [
      { symbol: 'water', x: '0%', y: '68%', size: 96, rotate: 0, opacity: 0.1 },
      { symbol: 'moon', x: '74%', y: '4%', size: 62, rotate: 8, opacity: 0.1 },
      { symbol: 'sparkle', x: '16%', y: '14%', size: 18, rotate: 0, opacity: 0.18 },
    ],
  },
  {
    id: 'blush-confetti',
    name: 'Blush Confetti',
    description: 'Playful blush hearts and celebration',
    tools: ['love-note', 'love-quote'],
    accent: '#FFA8C8',
    secondary: '#FF78A0',
    tertiary: '#FFE8F0',
    background: ['#2A0F1A', '#381420', '#200C14'],
    text: '#FDE8F0',
    muted: 'rgba(253,232,240,0.62)',
    badge: 'rgba(255,255,255,0.10)',
    glow: 'rgba(255,120,160,0.55)',
    previewGlyph: 'heart',
    fontTone: 'modern',
    glyphs: [
      { symbol: 'heart', x: '73%', y: '2%', size: 84, rotate: 15, opacity: 0.1 },
      { symbol: 'flower', x: '8%', y: '66%', size: 58, rotate: -12, opacity: 0.09 },
      { symbol: 'sparkle', x: '82%', y: '72%', size: 19, rotate: 45, opacity: 0.18 },
    ],
  },
  {
    id: 'forest-spell',
    name: 'Forest Spell',
    description: 'Moonlit green, leaves, and quiet magic',
    tools: ['love-note', 'love-poem'],
    accent: '#7CE4A8',
    secondary: '#4AAA70',
    tertiary: '#D0FFB8',
    background: ['#071210', '#0D1E18', '#060E0C'],
    text: '#D8F0E4',
    muted: 'rgba(216,240,228,0.60)',
    badge: 'rgba(255,255,255,0.10)',
    glow: 'rgba(60,180,100,0.50)',
    previewGlyph: 'leaf',
    fontTone: 'serif',
    glyphs: [
      { symbol: 'leaf', x: '72%', y: '2%', size: 88, rotate: 28, opacity: 0.1 },
      { symbol: 'flower', x: '4%', y: '66%', size: 62, rotate: -20, opacity: 0.08 },
      { symbol: 'feather', x: '32%', y: '50%', size: 34, rotate: -10, opacity: 0.09 },
    ],
  },
  {
    id: 'cosmic-dream',
    name: 'Cosmic Dream',
    description: 'Nebula violet with starlit detail',
    tools: ['love-note', 'love-poem', 'love-quote'],
    accent: '#C0A8FF',
    secondary: '#7848C8',
    tertiary: '#F8E0FF',
    background: ['#080C20', '#101428', '#06091A'],
    text: '#E0E8FF',
    muted: 'rgba(224,232,255,0.60)',
    badge: 'rgba(255,255,255,0.10)',
    glow: 'rgba(120,80,255,0.60)',
    previewGlyph: 'planet',
    fontTone: 'editorial',
    glyphs: [
      { symbol: 'planet', x: '67%', y: '0%', size: 96, rotate: 0, opacity: 0.1 },
      { symbol: 'moon', x: '5%', y: '58%', size: 58, rotate: -15, opacity: 0.09 },
      { symbol: 'sparkle', x: '20%', y: '8%', size: 22, rotate: 20, opacity: 0.2 },
    ],
  },
];

const letterInspiredTemplates: CreationTemplate[] = [
  {
    id: 'coastal-serenity',
    name: 'Coastal Serenity',
    description: 'Golden tide and lighthouse calm',
    tools: ['love-letter', 'love-poem'],
    accent: '#5AB5D0',
    secondary: '#D0F0FF',
    tertiary: '#FFD890',
    background: ['#082333', '#164D60', '#F2B75E'],
    text: '#F4FCFF',
    muted: 'rgba(244,252,255,0.68)',
    badge: 'rgba(255,255,255,0.14)',
    glow: 'rgba(90,181,208,0.58)',
    previewGlyph: 'water',
    fontTone: 'serif',
    glyphs: [
      { symbol: 'water', x: '4%', y: '72%', size: 96, rotate: 0, opacity: 0.12 },
      { symbol: 'sunny', x: '76%', y: '6%', size: 58, rotate: 0, opacity: 0.12 },
    ],
  },
  {
    id: 'enchanted-woodland',
    name: 'Enchanted Woodland',
    description: 'Bioluminescent forest under moonlight',
    tools: ['love-letter', 'love-poem'],
    accent: '#4AAA70',
    secondary: '#A0FFC0',
    tertiary: '#D0FFB8',
    background: ['#06130F', '#123422', '#29543A'],
    text: '#E9FFF0',
    muted: 'rgba(233,255,240,0.66)',
    badge: 'rgba(255,255,255,0.12)',
    glow: 'rgba(160,255,192,0.48)',
    previewGlyph: 'leaf',
    fontTone: 'script',
    glyphs: [
      { symbol: 'leaf', x: '76%', y: '0%', size: 92, rotate: 18, opacity: 0.12 },
      { symbol: 'sparkle', x: '18%', y: '12%', size: 22, rotate: 30, opacity: 0.2 },
    ],
  },
  {
    id: 'celestial-embrace',
    name: 'Celestial Embrace',
    description: 'Milky Way violet and soft starlight',
    tools: ['love-letter', 'love-quote'],
    accent: '#7058B0',
    secondary: '#C0B0FF',
    tertiary: '#F0F0FF',
    background: ['#070A1A', '#171B3D', '#322159'],
    text: '#F0F0FF',
    muted: 'rgba(240,240,255,0.66)',
    badge: 'rgba(255,255,255,0.12)',
    glow: 'rgba(192,176,255,0.52)',
    previewGlyph: 'sparkle',
    fontTone: 'editorial',
    glyphs: [
      { symbol: 'sparkle', x: '18%', y: '10%', size: 24, rotate: 25, opacity: 0.22 },
      { symbol: 'moon', x: '78%', y: '4%', size: 68, rotate: 10, opacity: 0.12 },
    ],
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom Dreams',
    description: 'Petals on still water at dawn',
    tools: ['love-letter', 'love-note'],
    accent: '#D06088',
    secondary: '#FFC8D8',
    tertiary: '#FFE8F0',
    background: ['#37101F', '#74314A', '#F2B6C7'],
    text: '#FFF4F8',
    muted: 'rgba(255,244,248,0.68)',
    badge: 'rgba(255,255,255,0.16)',
    glow: 'rgba(255,200,216,0.50)',
    previewGlyph: 'flower',
    fontTone: 'script',
    glyphs: [
      { symbol: 'flower', x: '76%', y: '2%', size: 86, rotate: 20, opacity: 0.12 },
      { symbol: 'heart', x: '8%', y: '70%', size: 44, rotate: -18, opacity: 0.1 },
    ],
  },
  {
    id: 'vintage-love',
    name: 'Vintage Love Story',
    description: 'Warm lamplight on weathered letters',
    tools: ['love-letter', 'love-quote'],
    accent: '#C88048',
    secondary: '#F8D890',
    tertiary: '#FFF8E0',
    background: ['#291509', '#5A321B', '#A76433'],
    text: '#FFF8E0',
    muted: 'rgba(255,248,224,0.68)',
    badge: 'rgba(255,255,255,0.14)',
    glow: 'rgba(248,216,144,0.48)',
    previewGlyph: 'mail',
    fontTone: 'editorial',
    glyphs: [
      { symbol: 'mail', x: '74%', y: '4%', size: 76, rotate: -8, opacity: 0.12 },
      { symbol: 'feather', x: '8%', y: '68%', size: 46, rotate: -14, opacity: 0.12 },
    ],
  },
  {
    id: 'autumn-whispers',
    name: 'Autumn Whispers',
    description: 'Crimson leaves and amber path',
    tools: ['love-poem', 'love-quote'],
    accent: '#B05528',
    secondary: '#F88850',
    tertiary: '#FFDC98',
    background: ['#281006', '#5B2010', '#9B4523'],
    text: '#FFF0D8',
    muted: 'rgba(255,240,216,0.66)',
    badge: 'rgba(255,255,255,0.12)',
    glow: 'rgba(248,136,80,0.48)',
    previewGlyph: 'leaf',
    fontTone: 'serif',
    glyphs: [
      { symbol: 'leaf', x: '76%', y: '2%', size: 82, rotate: 24, opacity: 0.12 },
      { symbol: 'sparkle', x: '18%', y: '10%', size: 20, rotate: 35, opacity: 0.18 },
    ],
  },
  {
    id: 'cosmic-convergence',
    name: 'Cosmic Convergence',
    description: 'Two galaxies in violet motion',
    tools: ['love-letter', 'love-poem', 'love-quote'],
    accent: '#7848C8',
    secondary: '#C898FF',
    tertiary: '#F8E0FF',
    background: ['#0A061A', '#21103D', '#4A2385'],
    text: '#F8E0FF',
    muted: 'rgba(248,224,255,0.66)',
    badge: 'rgba(255,255,255,0.12)',
    glow: 'rgba(200,152,255,0.54)',
    previewGlyph: 'planet',
    fontTone: 'editorial',
    glyphs: [
      { symbol: 'planet', x: '72%', y: '0%', size: 94, rotate: 0, opacity: 0.12 },
      { symbol: 'sparkle', x: '16%', y: '12%', size: 22, rotate: 30, opacity: 0.22 },
    ],
  },
];

export const CREATION_TEMPLATES: CreationTemplate[] = [
  ...noteTemplates,
  ...letterInspiredTemplates,
];

export const DEFAULT_TEMPLATE_BY_TOOL: Record<CreationTool, CreationTemplateId> = {
  'love-letter': 'vintage-love',
  'love-poem': 'ocean-mist',
  'love-note': 'midnight-roses',
  'love-quote': 'celestial-embrace',
};

export function getCreationTemplate(id: CreationTemplateId): CreationTemplate {
  return CREATION_TEMPLATES.find((template) => template.id === id) ?? CREATION_TEMPLATES[0];
}

export function getTemplatesForTool(tool: string): CreationTemplate[] {
  const typedTool = tool as CreationTool;
  const templates = CREATION_TEMPLATES.filter((template) => template.tools.includes(typedTool));
  return templates.length > 0 ? templates : CREATION_TEMPLATES;
}

export function getDefaultTemplateForTool(tool: string): CreationTemplate {
  return getCreationTemplate(DEFAULT_TEMPLATE_BY_TOOL[tool as CreationTool] ?? 'midnight-roses');
}

export function buildViralCreationShareText(params: {
  type: string;
  content: string;
  toName?: string;
  templateName?: string;
}): string {
  const recipient = params.toName ? `For ${params.toName}\n\n` : '';
  return `${params.type}\n${recipient}${params.content}\n\nMade with Love Test AI${params.templateName ? ` - ${params.templateName}` : ''}`;
}
