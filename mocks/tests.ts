export type CalculatorType = 'zodiac' | 'birthdate' | 'love-score' | 'numerology' | 'soulmate' | 'love-quiz';

// ─── Love Quiz (Compatibility Quiz) ───────────────────────────────────────────

export interface LQQuestion {
  id: number;
  text: string;
  type: 'frequency' | 'agreement' | 'importance' | 'comfort';
}

export const LQ_ANSWER_CHOICES: Record<LQQuestion['type'], string[]> = {
  frequency:  ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
  agreement:  ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  importance: ['Not Important', 'Slightly Important', 'Moderately Important', 'Very Important', 'Extremely Important'],
  comfort:    ['Very Uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very Comfortable'],
};

export const LOVE_QUIZ_QUESTIONS: LQQuestion[] = [
  { id: 1,  text: 'We express appreciation for each other...', type: 'frequency' },
  { id: 2,  text: 'I feel comfortable discussing my feelings with my partner.', type: 'agreement' },
  { id: 3,  text: 'Our ability to handle conflicts is...', type: 'importance' },
  { id: 4,  text: 'We plan date nights or special activities together...', type: 'frequency' },
  { id: 5,  text: 'Physical affection in our relationship is...', type: 'importance' },
  { id: 6,  text: 'My partner understands my needs and desires.', type: 'agreement' },
  { id: 7,  text: 'I surprise my partner with thoughtful gestures...', type: 'frequency' },
  { id: 8,  text: 'We support each other\'s personal goals and ambitions.', type: 'agreement' },
  { id: 9,  text: 'I\'m comfortable with my partner\'s friendships with others.', type: 'comfort' },
  { id: 10, text: 'We laugh together and share moments of joy...', type: 'frequency' },
  { id: 11, text: 'Our ability to handle financial decisions as a couple is...', type: 'importance' },
  { id: 12, text: 'We engage in shared hobbies or interests...', type: 'frequency' },
  { id: 13, text: 'We respect each other\'s personal space and independence.', type: 'agreement' },
  { id: 14, text: 'Discussing our future plans and goals together is...', type: 'importance' },
  { id: 15, text: 'We handle differences in opinion or beliefs well.', type: 'agreement' },
  { id: 16, text: 'Showing physical affection in public makes me feel...', type: 'comfort' },
  { id: 17, text: 'We balance time spent together and time apart effectively.', type: 'agreement' },
  { id: 18, text: 'I compliment my partner...', type: 'frequency' },
  { id: 19, text: 'We handle each other\'s stress or bad moods well.', type: 'agreement' },
  { id: 20, text: 'Expressing gratitude for the little things is...', type: 'importance' },
  { id: 21, text: 'Discussing sexual needs and desires makes me feel...', type: 'comfort' },
  { id: 22, text: 'We support each other during difficult times.', type: 'agreement' },
  { id: 23, text: 'We engage in deep, meaningful conversations...', type: 'frequency' },
  { id: 24, text: 'Jealousy or insecurity in our relationship is...', type: 'importance' },
  { id: 25, text: 'We make decisions together as a team.', type: 'agreement' },
  { id: 26, text: 'Respecting each other\'s privacy is...', type: 'importance' },
  { id: 27, text: 'I show interest in my partner\'s hobbies or passions...', type: 'frequency' },
  { id: 28, text: 'We handle differences in our social preferences well.', type: 'agreement' },
  { id: 29, text: 'Forgiving each other for minor mistakes or annoyances is...', type: 'importance' },
  { id: 30, text: 'Our communication during disagreements is effective.', type: 'agreement' },
  { id: 31, text: 'We express our love verbally...', type: 'frequency' },
  { id: 32, text: 'Differences in our family backgrounds or cultures affect our relationship...', type: 'importance' },
  { id: 33, text: 'We prioritize our relationship over other commitments.', type: 'agreement' },
  { id: 34, text: 'Supporting each other\'s career aspirations is...', type: 'importance' },
  { id: 35, text: 'Discussing our sexual satisfaction makes me feel...', type: 'comfort' },
  { id: 36, text: 'We handle differences in our communication styles effectively.', type: 'agreement' },
  { id: 37, text: 'Showing physical affection at home is...', type: 'importance' },
  { id: 38, text: 'We respect each other\'s boundaries.', type: 'agreement' },
  { id: 39, text: 'Trying new experiences together happens...', type: 'frequency' },
  { id: 40, text: 'Our spending habits align well.', type: 'agreement' },
  { id: 41, text: 'We check in with each other emotionally...', type: 'frequency' },
  { id: 42, text: 'Supporting each other\'s friendships outside the relationship is...', type: 'importance' },
  { id: 43, text: 'I express admiration for my partner\'s qualities...', type: 'frequency' },
  { id: 44, text: 'Our cleanliness or organization habits are compatible.', type: 'agreement' },
  { id: 45, text: 'Making an effort to get along with each other\'s families is...', type: 'importance' },
  { id: 46, text: 'We handle long-distance periods in our relationship well.', type: 'agreement' },
  { id: 47, text: 'Discussing our expectations for the relationship happens...', type: 'frequency' },
  { id: 48, text: 'Supporting each other\'s mental health and well-being is...', type: 'importance' },
  { id: 49, text: 'I engage in acts of service for my partner...', type: 'frequency' },
  { id: 50, text: 'Our sleep schedules or habits are compatible.', type: 'agreement' },
  { id: 51, text: 'We reminisce about positive memories together...', type: 'frequency' },
  { id: 52, text: 'Respecting each other\'s work-life balance is...', type: 'importance' },
  { id: 53, text: 'Our values and beliefs align well.', type: 'agreement' },
  { id: 54, text: 'We accommodate each other\'s dietary preferences or restrictions.', type: 'agreement' },
  { id: 55, text: 'Expressing physical affection non-sexually is...', type: 'importance' },
  { id: 56, text: 'We support each other\'s personal growth and self-improvement.', type: 'agreement' },
  { id: 57, text: 'Making sacrifices for the benefit of our relationship happens...', type: 'frequency' },
  { id: 58, text: 'Our social media usage or online presence is compatible.', type: 'agreement' },
  { id: 59, text: 'We engage in activities that promote emotional intimacy...', type: 'frequency' },
  { id: 60, text: 'Respecting each other\'s need for alone time is...', type: 'importance' },
  { id: 61, text: 'Discussing our long-term relationship goals happens...', type: 'frequency' },
  { id: 62, text: 'Our political views are compatible.', type: 'agreement' },
  { id: 63, text: 'I express appreciation for my partner\'s physical appearance...', type: 'frequency' },
  { id: 64, text: 'We support each other during health issues or medical concerns.', type: 'agreement' },
  { id: 65, text: 'Engaging in romantic gestures is...', type: 'importance' },
  { id: 66, text: 'Our religious or spiritual beliefs are compatible.', type: 'agreement' },
  { id: 67, text: 'Discussing our sexual fantasies or desires makes me feel...', type: 'comfort' },
  { id: 68, text: 'We respect each other\'s personal belongings and space.', type: 'agreement' },
  { id: 69, text: 'Engaging in activities that promote physical health together happens...', type: 'frequency' },
  { id: 70, text: 'Our parenting styles or views on children are compatible.', type: 'agreement' },
  { id: 71, text: 'Expressing trust in my partner is...', type: 'importance' },
  { id: 72, text: 'We support each other\'s relationships with friends and family.', type: 'agreement' },
  { id: 73, text: 'Discussing our individual and shared finances happens...', type: 'frequency' },
  { id: 74, text: 'Our entertainment preferences are compatible.', type: 'agreement' },
  { id: 75, text: 'Engaging in activities that challenge us as a couple is...', type: 'importance' },
  { id: 76, text: 'We respect each other\'s past relationships and experiences.', type: 'agreement' },
  { id: 77, text: 'Discussing our fears and insecurities with each other makes me feel...', type: 'comfort' },
  { id: 78, text: 'Our levels of ambition or drive are compatible.', type: 'agreement' },
  { id: 79, text: 'I express pride in my partner\'s accomplishments...', type: 'frequency' },
  { id: 80, text: 'Supporting each other\'s hobbies, even if we don\'t share them, is...', type: 'importance' },
  { id: 81, text: 'Discussing our sexual boundaries and comfort levels happens...', type: 'frequency' },
  { id: 82, text: 'Our pet preferences or attitudes towards animals are compatible.', type: 'agreement' },
  { id: 83, text: 'Engaging in acts of non-sexual physical intimacy is...', type: 'importance' },
  { id: 84, text: 'We respect each other\'s cultural traditions and customs.', type: 'agreement' },
  { id: 85, text: 'Discussing our individual and shared responsibilities in the relationship happens...', type: 'frequency' },
  { id: 86, text: 'Our approaches to health and wellness are compatible.', type: 'agreement' },
  { id: 87, text: 'Expressing excitement about our future together is...', type: 'importance' },
  { id: 88, text: 'We support each other during times of personal crisis.', type: 'agreement' },
  { id: 89, text: 'Engaging in activities that promote intellectual growth together happens...', type: 'frequency' },
  { id: 90, text: 'Our social media boundaries are compatible.', type: 'agreement' },
  { id: 91, text: 'Discussing our sexual satisfaction and desires makes me feel...', type: 'comfort' },
  { id: 92, text: 'We respect each other\'s professional boundaries and work commitments.', type: 'agreement' },
  { id: 93, text: 'Expressing gratitude for our relationship is...', type: 'importance' },
  { id: 94, text: 'Our risk-taking tendencies are compatible.', type: 'agreement' },
  { id: 95, text: 'Engaging in activities that strengthen our emotional bond happens...', type: 'frequency' },
  { id: 96, text: 'Supporting each other\'s dreams, even if they seem unrealistic, is...', type: 'importance' },
  { id: 97, text: 'Discussing our fears about the relationship makes me feel...', type: 'comfort' },
  { id: 98, text: 'Our approaches to conflict resolution are compatible.', type: 'agreement' },
  { id: 99, text: 'Expressing commitment to the relationship happens...', type: 'frequency' },
  { id: 100, text: 'Balancing our individual identities with our identity as a couple is...', type: 'importance' },
];

// ─── Attachment Style ──────────────────────────────────────────────────────────

export interface AttachmentStyle {
  id: string;
  label: string;
  icon: string;
  summary: string;
}

export const ATTACHMENT_STYLES: Record<string, AttachmentStyle> = {
  secure: {
    id: 'secure',
    label: 'Securely Attached',
    icon: 'shield-checkmark-outline',
    summary: 'You are comfortable with both intimacy and independence. You seek genuine connection without fear of abandonment, and give space without fear of loss.',
  },
  anxious: {
    id: 'anxious',
    label: 'Anxiously Attached',
    icon: 'pulse-outline',
    summary: 'You crave deep connection and feel unsettled when reassurance is absent. When loved consistently, you are among the most devoted and emotionally generous partners.',
  },
  avoidant: {
    id: 'avoidant',
    label: 'Avoidantly Attached',
    icon: 'resize-outline',
    summary: 'You value independence and tend to process emotions privately. You express love through thoughtful actions and thrive when your need for space is respected.',
  },
  fearful: {
    id: 'fearful',
    label: 'Fearful-Avoidant',
    icon: 'help-circle-outline',
    summary: 'You crave deep connection yet feel vulnerable opening up. Awareness of this pull toward and away from intimacy is your greatest asset in building something lasting.',
  },
};

// Derived from primary love language — directionally meaningful, not clinically diagnostic
export const LL_TO_ATTACHMENT: Record<string, string> = {
  words:   'anxious',
  touch:   'secure',
  time:    'fearful',
  gifts:   'avoidant',
  service: 'secure',
};

// ─── Love Language Quiz ────────────────────────────────────────────────────────

export interface LLQuestion {
  id: string;
  text: string;
  answers: { id: string; text: string; category: string }[];
}

export interface LLResult {
  id: string;
  label: string;
  icon: string;
  summary: string;
  fullReport: string;
}

export const LOVE_LANGUAGE_QUESTIONS: LLQuestion[] = [
  {
    id: 'q1',
    text: 'When you feel most loved, it is usually because someone...',
    answers: [
      { id: 'a1', text: 'Tells you how much you mean to them', category: 'words' },
      { id: 'a2', text: 'Gives you a warm, lingering hug', category: 'touch' },
      { id: 'a3', text: 'Surprises you with a thoughtful gift', category: 'gifts' },
      { id: 'a4', text: 'Helps you with something without being asked', category: 'service' },
    ],
  },
  {
    id: 'q2',
    text: 'In a relationship, what matters most to you?',
    answers: [
      { id: 'a1', text: 'Spending uninterrupted time together', category: 'time' },
      { id: 'a2', text: 'Hearing genuine compliments and encouragement', category: 'words' },
      { id: 'a3', text: 'Receiving small tokens that show they were thinking of you', category: 'gifts' },
      { id: 'a4', text: 'Physical closeness and affection', category: 'touch' },
    ],
  },
  {
    id: 'q3',
    text: 'You feel most disconnected when your partner...',
    answers: [
      { id: 'a1', text: 'Seems distracted when you are together', category: 'time' },
      { id: 'a2', text: 'Rarely says anything affirming', category: 'words' },
      { id: 'a3', text: 'Never offers to help with daily tasks', category: 'service' },
      { id: 'a4', text: 'Avoids physical affection', category: 'touch' },
    ],
  },
  {
    id: 'q4',
    text: 'The most meaningful birthday gift would be...',
    answers: [
      { id: 'a1', text: 'A heartfelt letter expressing their feelings', category: 'words' },
      { id: 'a2', text: 'A full day planned just for the two of you', category: 'time' },
      { id: 'a3', text: 'Something they handpicked that shows they know you', category: 'gifts' },
      { id: 'a4', text: 'Taking care of all your responsibilities so you can relax', category: 'service' },
    ],
  },
  {
    id: 'q5',
    text: 'When you are stressed, you most want someone to...',
    answers: [
      { id: 'a1', text: 'Sit with you and listen without distraction', category: 'time' },
      { id: 'a2', text: 'Hold you close without saying a word', category: 'touch' },
      { id: 'a3', text: 'Tell you they believe in you', category: 'words' },
      { id: 'a4', text: 'Handle something on your to-do list', category: 'service' },
    ],
  },
  {
    id: 'q6',
    text: 'What makes you feel closest to your partner?',
    answers: [
      { id: 'a1', text: 'Deep, meaningful conversations', category: 'time' },
      { id: 'a2', text: 'Cuddling on the couch together', category: 'touch' },
      { id: 'a3', text: 'When they go out of their way to do something for you', category: 'service' },
      { id: 'a4', text: 'When they bring you something unexpected', category: 'gifts' },
    ],
  },
  {
    id: 'q7',
    text: 'In your ideal evening together, you would...',
    answers: [
      { id: 'a1', text: 'Cook dinner together and talk about life', category: 'time' },
      { id: 'a2', text: 'Exchange playful and heartfelt messages', category: 'words' },
      { id: 'a3', text: 'Give each other massages', category: 'touch' },
      { id: 'a4', text: 'Surprise each other with little treats', category: 'gifts' },
    ],
  },
  {
    id: 'q8',
    text: 'Which of these would mean the most to you?',
    answers: [
      { id: 'a1', text: 'A partner who always makes time for you', category: 'time' },
      { id: 'a2', text: 'A partner who consistently supports you with actions', category: 'service' },
      { id: 'a3', text: 'A partner who never lets you doubt their love through words', category: 'words' },
      { id: 'a4', text: 'A partner who is always physically affectionate', category: 'touch' },
    ],
  },
];

export const LOVE_LANGUAGE_RESULTS: Record<string, LLResult> = {
  words: {
    id: 'words',
    label: 'Words of Affirmation',
    icon: 'chatbubble-outline',
    summary: 'You feel most loved through verbal acknowledgment. Compliments, encouragement, and heartfelt expressions of love resonate deeply with you.',
    fullReport: 'Your primary love language is Words of Affirmation. You thrive when your partner expresses their feelings verbally. Compliments are not just nice to hear — they are essential to your emotional wellbeing. You remember kind words long after they are spoken, and harsh words can wound you deeply.\n\nIn relationships, you may find yourself frequently expressing love through words and hoping to receive the same. You value hearing "I love you," being complimented on your efforts, and receiving notes or messages that show your partner is thinking of you.\n\nTo strengthen your relationships: Let your partner know that verbal affirmation is important to you. Not everyone naturally expresses love through words, but most partners are willing to learn when they understand its significance to you.',
  },
  touch: {
    id: 'touch',
    label: 'Physical Touch',
    icon: 'hand-left-outline',
    summary: 'Physical presence and touch are your primary way of feeling connected and loved. A hug, a hand on the shoulder, or sitting close together speaks volumes to you.',
    fullReport: 'Your primary love language is Physical Touch. For you, nothing communicates love more clearly than physical connection. This is not just about romance — it includes holding hands, a reassuring touch on the arm, or sitting close together on the couch.\n\nPhysical presence matters immensely to you. Long distance is particularly challenging, and you may feel deeply disconnected when physical affection is absent or withdrawn.\n\nTo strengthen your relationships: Communicate your need for physical closeness in a way that respects both your needs and your partner\'s comfort level. Small gestures throughout the day can make an enormous difference.',
  },
  time: {
    id: 'time',
    label: 'Quality Time',
    icon: 'time-outline',
    summary: 'Undivided attention is your love language. You feel most cherished when someone gives you their full presence without distractions.',
    fullReport: 'Your primary love language is Quality Time. You feel most loved when your partner is fully present with you. It is not just about being in the same room — it is about being truly engaged, making eye contact, putting away phones, and sharing meaningful experiences together.\n\nYou likely value shared activities, deep conversations, and moments of genuine connection. A cancelled plan or a distracted partner can feel like a personal rejection.\n\nTo strengthen your relationships: Be specific about what quality time looks like for you. For some it means adventurous dates, for others it means quiet evenings at home. Help your partner understand your preferences.',
  },
  gifts: {
    id: 'gifts',
    label: 'Receiving Gifts',
    icon: 'gift-outline',
    summary: 'Thoughtful gifts are your love language. It is not about materialism — it is about the thought, effort, and symbolism behind a meaningful gesture.',
    fullReport: 'Your primary love language is Receiving Gifts. This is not about materialism — it is about the thoughtfulness and effort behind a gift. A small, meaningful token that shows someone was thinking of you means more than an expensive item chosen without care.\n\nYou likely treasure keepsakes, remember gifts you have received, and put great thought into gifts you give others. A missed occasion or a careless gift can feel hurtful because it suggests a lack of thought.\n\nTo strengthen your relationships: Help your partner understand that it is the thought that counts. Share what kinds of gestures feel meaningful to you — sometimes the best gifts are ones that cost nothing at all.',
  },
  service: {
    id: 'service',
    label: 'Acts of Service',
    icon: 'construct-outline',
    summary: 'Actions speak louder than words for you. When someone eases your burden or helps without being asked, you feel deeply loved.',
    fullReport: 'Your primary love language is Acts of Service. For you, actions truly speak louder than words. When someone takes the initiative to make your life easier — whether it is doing the dishes, running an errand, or handling a task you have been dreading — you feel profoundly loved.\n\nYou likely show love the same way, noticing what needs to be done and doing it. Laziness, broken commitments, or having to constantly ask for help can feel like your partner does not care.\n\nTo strengthen your relationships: Be specific about which acts of service matter most to you. Your partner may show love in other ways without realizing how much these practical gestures mean to you.',
  },
};

// ─── Calculator Tests (API-backed) ────────────────────────────────────────────

export interface CalculatorTest {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  calculatorType: CalculatorType;
}

export const ALL_TESTS: ({ kind: 'quiz' } | ({ kind: 'calculator' } & CalculatorTest))[] = [
  {
    kind: 'quiz',
    id: 'love-language',
    title: 'Love Language Quiz',
    description: 'Discover how you give and receive love',
    duration: '3 min',
    icon: 'heart-outline',
    calculatorType: undefined as any,
  } as any,
  {
    kind: 'calculator',
    id: 'zodiac-match',
    title: 'Zodiac Compatibility',
    description: 'Two signs, one cosmic reading',
    duration: '1 min',
    icon: 'planet-outline',
    calculatorType: 'zodiac',
  },
  {
    kind: 'calculator',
    id: 'birthday-match',
    title: 'Birthday Compatibility',
    description: 'What your birth dates reveal',
    duration: '1 min',
    icon: 'calendar-outline',
    calculatorType: 'birthdate',
  },
  {
    kind: 'calculator',
    id: 'numerology-match',
    title: 'Numerology Match',
    description: 'Names and numbers that align',
    duration: '2 min',
    icon: 'calculator-outline',
    calculatorType: 'numerology',
  },
  {
    kind: 'calculator',
    id: 'soulmate-finder',
    title: 'Soulmate Finder',
    description: 'Uncover your ideal match profile',
    duration: '2 min',
    icon: 'search-outline',
    calculatorType: 'soulmate',
  },
  {
    kind: 'calculator',
    id: 'love-score',
    title: 'Love Score',
    description: 'A reading of your connection',
    duration: '1 min',
    icon: 'pulse-outline',
    calculatorType: 'love-score',
  },
  {
    kind: 'calculator',
    id: 'love-quiz',
    title: 'Compatibility Quiz',
    description: '10 questions reveal your true compatibility',
    duration: '4 min',
    icon: 'heart-circle-outline',
    calculatorType: 'love-quiz',
  },
];

// ─── Daily Prompts ─────────────────────────────────────────────────────────────

export interface DailyPrompt {
  text: string;
  category: string;
}

export const DAILY_PROMPTS: DailyPrompt[] = [
  { text: 'What is something you have never told anyone that changed the way you love?', category: 'Deep' },
  { text: 'If you could relive one moment with your partner, which would it be and why?', category: 'Relationships' },
  { text: 'What does feeling truly safe with someone mean to you?', category: 'Reflection' },
  { text: 'Write about a time when someone showed you love in an unexpected way.', category: 'Relationships' },
  { text: 'What is one thing you wish you had said to someone you loved?', category: 'Deep' },
  { text: 'Describe your ideal morning with the person you love most.', category: 'Playful' },
  { text: 'What quality in yourself makes you proudest as a partner?', category: 'Growth' },
  { text: 'If love had a sound, what would yours be?', category: 'Playful' },
  { text: 'What is the bravest thing you have ever done for love?', category: 'Deep' },
  { text: 'Write a letter to your future self about what you want love to look like.', category: 'Growth' },
  { text: 'What lesson about love did you learn the hard way?', category: 'Growth' },
  { text: 'Describe a moment when you felt completely understood by someone.', category: 'Reflection' },
  { text: 'What does home feel like to you, and who makes it feel that way?', category: 'Reflection' },
  { text: 'If you could ask your partner one question and get a completely honest answer, what would it be?', category: 'Relationships' },
  { text: 'What is one small act of love you can do today?', category: 'Playful' },
  { text: 'Write about the moment you knew you were in love.', category: 'Relationships' },
  { text: 'What does vulnerability in love look like for you?', category: 'Deep' },
  { text: 'How has your definition of love changed over the years?', category: 'Growth' },
  { text: 'What is the most romantic thing that has ever happened to you?', category: 'Playful' },
  { text: 'If you had to describe your love story in three words, what would they be?', category: 'Playful' },
  { text: 'What is something your partner does that they probably do not realize means the world to you?', category: 'Relationships' },
  { text: 'Write about a relationship that taught you something important about yourself.', category: 'Growth' },
  { text: 'What does forgiveness look like in your relationships?', category: 'Deep' },
  { text: 'How do you want to be remembered by the people who love you?', category: 'Reflection' },
  { text: 'What is one thing you are grateful for in your relationship right now?', category: 'Reflection' },
  { text: 'Describe the kind of old couple you want to be someday.', category: 'Playful' },
  { text: 'What is the kindest thing someone has ever said to you?', category: 'Reflection' },
  { text: 'How do you recharge your emotional energy in a relationship?', category: 'Growth' },
  { text: 'What would you do differently if you could start your love story over?', category: 'Deep' },
  { text: 'Write about a moment of pure joy you shared with someone you love.', category: 'Relationships' },
];

export const PROMPT_CATEGORIES = ['All', 'Reflection', 'Relationships', 'Growth', 'Deep', 'Playful'];
