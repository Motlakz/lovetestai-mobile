export interface TestDefinition {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  questionCount: number;
  questions: TestQuestion[];
  results: TestResult[];
}

export interface TestQuestion {
  id: string;
  text: string;
  answers: TestAnswer[];
}

export interface TestAnswer {
  id: string;
  text: string;
  category: string;
  score: number;
}

export interface TestResult {
  id: string;
  label: string;
  minScore: number;
  maxScore: number;
  icon: string;
  summary: string;
  fullReport: string;
}

export const TESTS: TestDefinition[] = [
  {
    id: 'love-language',
    title: 'Love Language Test',
    description: 'How you give and receive love',
    duration: '3 min',
    icon: 'heart-outline',
    questionCount: 8,
    questions: [
      {
        id: 'q1',
        text: 'When you feel most loved, it is usually because someone...',
        answers: [
          { id: 'a1', text: 'Tells you how much you mean to them', category: 'words', score: 1 },
          { id: 'a2', text: 'Gives you a warm, lingering hug', category: 'touch', score: 1 },
          { id: 'a3', text: 'Surprises you with a thoughtful gift', category: 'gifts', score: 1 },
          { id: 'a4', text: 'Helps you with something without being asked', category: 'service', score: 1 },
        ],
      },
      {
        id: 'q2',
        text: 'In a relationship, what matters most to you?',
        answers: [
          { id: 'a1', text: 'Spending uninterrupted time together', category: 'time', score: 1 },
          { id: 'a2', text: 'Hearing genuine compliments and encouragement', category: 'words', score: 1 },
          { id: 'a3', text: 'Receiving small tokens that show they were thinking of you', category: 'gifts', score: 1 },
          { id: 'a4', text: 'Physical closeness and affection', category: 'touch', score: 1 },
        ],
      },
      {
        id: 'q3',
        text: 'You feel most disconnected when your partner...',
        answers: [
          { id: 'a1', text: 'Seems distracted when you are together', category: 'time', score: 1 },
          { id: 'a2', text: 'Rarely says anything affirming', category: 'words', score: 1 },
          { id: 'a3', text: 'Never offers to help with daily tasks', category: 'service', score: 1 },
          { id: 'a4', text: 'Avoids physical affection', category: 'touch', score: 1 },
        ],
      },
      {
        id: 'q4',
        text: 'The most meaningful birthday gift would be...',
        answers: [
          { id: 'a1', text: 'A heartfelt letter expressing their feelings', category: 'words', score: 1 },
          { id: 'a2', text: 'A full day planned just for the two of you', category: 'time', score: 1 },
          { id: 'a3', text: 'Something they handpicked that shows they know you', category: 'gifts', score: 1 },
          { id: 'a4', text: 'Taking care of all your responsibilities so you can relax', category: 'service', score: 1 },
        ],
      },
      {
        id: 'q5',
        text: 'When you are stressed, you most want someone to...',
        answers: [
          { id: 'a1', text: 'Sit with you and listen without distraction', category: 'time', score: 1 },
          { id: 'a2', text: 'Hold you close without saying a word', category: 'touch', score: 1 },
          { id: 'a3', text: 'Tell you they believe in you', category: 'words', score: 1 },
          { id: 'a4', text: 'Handle something on your to-do list', category: 'service', score: 1 },
        ],
      },
      {
        id: 'q6',
        text: 'What makes you feel closest to your partner?',
        answers: [
          { id: 'a1', text: 'Deep, meaningful conversations', category: 'time', score: 1 },
          { id: 'a2', text: 'Cuddling on the couch together', category: 'touch', score: 1 },
          { id: 'a3', text: 'When they go out of their way to do something for you', category: 'service', score: 1 },
          { id: 'a4', text: 'When they bring you something unexpected', category: 'gifts', score: 1 },
        ],
      },
      {
        id: 'q7',
        text: 'In your ideal evening together, you would...',
        answers: [
          { id: 'a1', text: 'Cook dinner together and talk about life', category: 'time', score: 1 },
          { id: 'a2', text: 'Exchange playful and heartfelt messages', category: 'words', score: 1 },
          { id: 'a3', text: 'Give each other massages', category: 'touch', score: 1 },
          { id: 'a4', text: 'Surprise each other with little treats', category: 'gifts', score: 1 },
        ],
      },
      {
        id: 'q8',
        text: 'Which of these would mean the most to you?',
        answers: [
          { id: 'a1', text: 'A partner who always makes time for you', category: 'time', score: 1 },
          { id: 'a2', text: 'A partner who consistently supports you with actions', category: 'service', score: 1 },
          { id: 'a3', text: 'A partner who never lets you doubt their love through words', category: 'words', score: 1 },
          { id: 'a4', text: 'A partner who is always physically affectionate', category: 'touch', score: 1 },
        ],
      },
    ],
    results: [
      {
        id: 'words',
        label: 'Words of Affirmation',
        minScore: 0,
        maxScore: 100,
        icon: 'chatbubble-outline',
        summary: 'You feel most loved through verbal acknowledgment. Compliments, encouragement, and heartfelt expressions of love resonate deeply with you.',
        fullReport: 'Your primary love language is Words of Affirmation. You thrive when your partner expresses their feelings verbally. Compliments are not just nice to hear - they are essential to your emotional wellbeing. You remember kind words long after they are spoken, and harsh words can wound you deeply.\n\nIn relationships, you may find yourself frequently expressing love through words and hoping to receive the same. You value hearing "I love you," being complimented on your efforts, and receiving notes or messages that show your partner is thinking of you.\n\nTo strengthen your relationships: Let your partner know that verbal affirmation is important to you. Not everyone naturally expresses love through words, but most partners are willing to learn when they understand its significance to you.',
      },
      {
        id: 'touch',
        label: 'Physical Touch',
        minScore: 0,
        maxScore: 100,
        icon: 'hand-left-outline',
        summary: 'Physical presence and touch are your primary way of feeling connected and loved. A hug, a hand on the shoulder, or sitting close together speaks volumes to you.',
        fullReport: 'Your primary love language is Physical Touch. For you, nothing communicates love more clearly than physical connection. This is not just about romance - it includes holding hands, a reassuring touch on the arm, or sitting close together on the couch.\n\nPhysical presence matters immensely to you. Long distance is particularly challenging, and you may feel deeply disconnected when physical affection is absent or withdrawn.\n\nTo strengthen your relationships: Communicate your need for physical closeness in a way that respects both your needs and your partner\'s comfort level. Small gestures throughout the day can make an enormous difference.',
      },
      {
        id: 'time',
        label: 'Quality Time',
        minScore: 0,
        maxScore: 100,
        icon: 'time-outline',
        summary: 'Undivided attention is your love language. You feel most cherished when someone gives you their full presence without distractions.',
        fullReport: 'Your primary love language is Quality Time. You feel most loved when your partner is fully present with you. It is not just about being in the same room - it is about being truly engaged, making eye contact, putting away phones, and sharing meaningful experiences together.\n\nYou likely value shared activities, deep conversations, and moments of genuine connection. A cancelled plan or a distracted partner can feel like a personal rejection.\n\nTo strengthen your relationships: Be specific about what quality time looks like for you. For some it means adventurous dates, for others it means quiet evenings at home. Help your partner understand your preferences.',
      },
      {
        id: 'gifts',
        label: 'Receiving Gifts',
        minScore: 0,
        maxScore: 100,
        icon: 'gift-outline',
        summary: 'Thoughtful gifts are your love language. It is not about materialism - it is about the thought, effort, and symbolism behind a meaningful gesture.',
        fullReport: 'Your primary love language is Receiving Gifts. This is not about materialism - it is about the thoughtfulness and effort behind a gift. A small, meaningful token that shows someone was thinking of you means more than an expensive item chosen without care.\n\nYou likely treasure keepsakes, remember gifts you have received, and put great thought into gifts you give others. A missed occasion or a careless gift can feel hurtful because it suggests a lack of thought.\n\nTo strengthen your relationships: Help your partner understand that it is the thought that counts. Share what kinds of gestures feel meaningful to you - sometimes the best gifts are ones that cost nothing at all.',
      },
      {
        id: 'service',
        label: 'Acts of Service',
        minScore: 0,
        maxScore: 100,
        icon: 'construct-outline',
        summary: 'Actions speak louder than words for you. When someone eases your burden or helps without being asked, you feel deeply loved.',
        fullReport: 'Your primary love language is Acts of Service. For you, actions truly speak louder than words. When someone takes the initiative to make your life easier - whether it is doing the dishes, running an errand, or handling a task you have been dreading - you feel profoundly loved.\n\nYou likely show love the same way, noticing what needs to be done and doing it. Laziness, broken commitments, or having to constantly ask for help can feel like your partner does not care.\n\nTo strengthen your relationships: Be specific about which acts of service matter most to you. Your partner may show love in other ways without realizing how much these practical gestures mean to you.',
      },
    ],
  },
  {
    id: 'zodiac',
    title: 'Zodiac Compatibility',
    description: 'Your cosmic romantic match',
    duration: '4 min',
    icon: 'planet-outline',
    questionCount: 6,
    questions: [
      {
        id: 'q1',
        text: 'In social situations, you tend to...',
        answers: [
          { id: 'a1', text: 'Take charge and lead the conversation', category: 'fire', score: 1 },
          { id: 'a2', text: 'Observe quietly before engaging', category: 'earth', score: 1 },
          { id: 'a3', text: 'Float between groups, adapting to each one', category: 'air', score: 1 },
          { id: 'a4', text: 'Connect deeply with one or two people', category: 'water', score: 1 },
        ],
      },
      {
        id: 'q2',
        text: 'When faced with a difficult decision, you rely on...',
        answers: [
          { id: 'a1', text: 'Your gut instinct and courage', category: 'fire', score: 1 },
          { id: 'a2', text: 'Careful analysis and practical thinking', category: 'earth', score: 1 },
          { id: 'a3', text: 'Logic and weighing all perspectives', category: 'air', score: 1 },
          { id: 'a4', text: 'Your intuition and emotional compass', category: 'water', score: 1 },
        ],
      },
      {
        id: 'q3',
        text: 'Your ideal way to spend a free day would be...',
        answers: [
          { id: 'a1', text: 'An adventurous outing or spontaneous trip', category: 'fire', score: 1 },
          { id: 'a2', text: 'A productive day at home or in nature', category: 'earth', score: 1 },
          { id: 'a3', text: 'Exploring a museum, reading, or interesting conversations', category: 'air', score: 1 },
          { id: 'a4', text: 'A creative or spiritual pursuit by water', category: 'water', score: 1 },
        ],
      },
      {
        id: 'q4',
        text: 'In love, you value most...',
        answers: [
          { id: 'a1', text: 'Passion, excitement, and spontaneity', category: 'fire', score: 1 },
          { id: 'a2', text: 'Stability, loyalty, and commitment', category: 'earth', score: 1 },
          { id: 'a3', text: 'Intellectual connection and freedom', category: 'air', score: 1 },
          { id: 'a4', text: 'Emotional depth and spiritual bonding', category: 'water', score: 1 },
        ],
      },
      {
        id: 'q5',
        text: 'When you are upset, you tend to...',
        answers: [
          { id: 'a1', text: 'Express it immediately and directly', category: 'fire', score: 1 },
          { id: 'a2', text: 'Withdraw and process it alone', category: 'earth', score: 1 },
          { id: 'a3', text: 'Talk it through rationally', category: 'air', score: 1 },
          { id: 'a4', text: 'Feel it deeply and need emotional support', category: 'water', score: 1 },
        ],
      },
      {
        id: 'q6',
        text: 'Your greatest strength in relationships is...',
        answers: [
          { id: 'a1', text: 'Your energy, enthusiasm, and boldness', category: 'fire', score: 1 },
          { id: 'a2', text: 'Your dependability and grounded nature', category: 'earth', score: 1 },
          { id: 'a3', text: 'Your communication and open-mindedness', category: 'air', score: 1 },
          { id: 'a4', text: 'Your empathy and emotional intelligence', category: 'water', score: 1 },
        ],
      },
    ],
    results: [
      {
        id: 'fire',
        label: 'Fire Element',
        minScore: 0,
        maxScore: 100,
        icon: 'flame-outline',
        summary: 'You are aligned with the Fire signs. Passionate, bold, and full of life. Your romantic matches burn brightest with those who match your intensity.',
        fullReport: 'As a Fire-dominant personality, you share qualities with Aries, Leo, and Sagittarius. You bring warmth, passion, and an infectious energy to your relationships. You love deeply and expressively.\n\nBest matches: Fellow Fire signs for excitement, Air signs for stimulation and growth. Earth signs can ground you, while Water signs can deepen your emotional world.\n\nRelationship advice: Channel your passionate nature constructively. Learn to pause before reacting, and remember that vulnerability is a form of courage.',
      },
      {
        id: 'earth',
        label: 'Earth Element',
        minScore: 0,
        maxScore: 100,
        icon: 'leaf-outline',
        summary: 'You are aligned with the Earth signs. Grounded, loyal, and steady. You build relationships that stand the test of time.',
        fullReport: 'As an Earth-dominant personality, you share qualities with Taurus, Virgo, and Capricorn. You are the rock in your relationships - dependable, patient, and deeply committed once you decide someone is worth your heart.\n\nBest matches: Fellow Earth signs for stability, Water signs for emotional depth. Fire signs can ignite your passion, while Air signs can broaden your perspective.\n\nRelationship advice: Allow yourself to be spontaneous sometimes. Your strength is your steadfastness, but flexibility can bring new dimensions to your love life.',
      },
      {
        id: 'air',
        label: 'Air Element',
        minScore: 0,
        maxScore: 100,
        icon: 'cloudy-outline',
        summary: 'You are aligned with the Air signs. Intellectual, communicative, and free-spirited. You connect through ideas, conversation, and shared curiosity.',
        fullReport: 'As an Air-dominant personality, you share qualities with Gemini, Libra, and Aquarius. You approach love with your mind first - you need intellectual stimulation and meaningful conversation to feel truly connected.\n\nBest matches: Fellow Air signs for stimulating dialogue, Fire signs for passion and adventure. Earth signs can ground your ideas into reality, while Water signs can teach you emotional depth.\n\nRelationship advice: Remember that feelings are as important as thoughts. Practice being present in your body and emotions, not just your mind.',
      },
      {
        id: 'water',
        label: 'Water Element',
        minScore: 0,
        maxScore: 100,
        icon: 'water-outline',
        summary: 'You are aligned with the Water signs. Intuitive, empathetic, and deeply feeling. You experience love on a profound, almost spiritual level.',
        fullReport: 'As a Water-dominant personality, you share qualities with Cancer, Scorpio, and Pisces. You feel everything deeply and bring an extraordinary emotional richness to your relationships. Your intuition about others is remarkably accurate.\n\nBest matches: Fellow Water signs for deep emotional understanding, Earth signs for stability and grounding. Fire signs can warm your soul, while Air signs can help you articulate your feelings.\n\nRelationship advice: Protect your emotional energy by setting healthy boundaries. Your sensitivity is a gift, but it requires care and intention to maintain.',
      },
    ],
  },
  {
    id: 'numerology',
    title: 'Numerology Love',
    description: 'What your numbers reveal',
    duration: '3 min',
    icon: 'calculator-outline',
    questionCount: 6,
    questions: [
      {
        id: 'q1',
        text: 'Which number feels most like "you"?',
        answers: [
          { id: 'a1', text: '1 - Independent and pioneering', category: 'leader', score: 1 },
          { id: 'a2', text: '2 - Harmonious and diplomatic', category: 'partner', score: 1 },
          { id: 'a3', text: '7 - Introspective and wise', category: 'seeker', score: 1 },
          { id: 'a4', text: '9 - Compassionate and giving', category: 'healer', score: 1 },
        ],
      },
      {
        id: 'q2',
        text: 'In love, your natural role tends to be...',
        answers: [
          { id: 'a1', text: 'The initiator who takes the lead', category: 'leader', score: 1 },
          { id: 'a2', text: 'The peacemaker who creates harmony', category: 'partner', score: 1 },
          { id: 'a3', text: 'The deep thinker who brings meaning', category: 'seeker', score: 1 },
          { id: 'a4', text: 'The nurturer who gives endlessly', category: 'healer', score: 1 },
        ],
      },
      {
        id: 'q3',
        text: 'Your biggest relationship challenge is...',
        answers: [
          { id: 'a1', text: 'Letting someone else have control', category: 'leader', score: 1 },
          { id: 'a2', text: 'Standing up for your own needs', category: 'partner', score: 1 },
          { id: 'a3', text: 'Opening up emotionally', category: 'seeker', score: 1 },
          { id: 'a4', text: 'Not losing yourself in others', category: 'healer', score: 1 },
        ],
      },
      {
        id: 'q4',
        text: 'What draws you to someone initially?',
        answers: [
          { id: 'a1', text: 'Confidence and ambition', category: 'leader', score: 1 },
          { id: 'a2', text: 'Kindness and emotional availability', category: 'partner', score: 1 },
          { id: 'a3', text: 'Depth and mystery', category: 'seeker', score: 1 },
          { id: 'a4', text: 'Warmth and generosity', category: 'healer', score: 1 },
        ],
      },
      {
        id: 'q5',
        text: 'How do you handle conflict in relationships?',
        answers: [
          { id: 'a1', text: 'Address it head-on and move forward', category: 'leader', score: 1 },
          { id: 'a2', text: 'Seek compromise and understanding', category: 'partner', score: 1 },
          { id: 'a3', text: 'Need space to process before discussing', category: 'seeker', score: 1 },
          { id: 'a4', text: 'Absorb and try to heal the situation', category: 'healer', score: 1 },
        ],
      },
      {
        id: 'q6',
        text: 'Your love life motto would be...',
        answers: [
          { id: 'a1', text: 'Love should be an adventure', category: 'leader', score: 1 },
          { id: 'a2', text: 'Love is about two becoming one', category: 'partner', score: 1 },
          { id: 'a3', text: 'Love is a journey of understanding', category: 'seeker', score: 1 },
          { id: 'a4', text: 'Love is about giving more than receiving', category: 'healer', score: 1 },
        ],
      },
    ],
    results: [
      { id: 'leader', label: 'The Leader (1)', minScore: 0, maxScore: 100, icon: 'arrow-up-outline', summary: 'Your numerological love profile is The Leader. Bold, independent, and passionate in love.', fullReport: 'As a Number 1 love personality, you are a natural initiator in relationships. You are attracted to partners who respect your independence while matching your drive. Your ideal relationship is one where both partners maintain their individuality while building something extraordinary together.' },
      { id: 'partner', label: 'The Partner (2)', minScore: 0, maxScore: 100, icon: 'people-outline', summary: 'Your numerological love profile is The Partner. Harmonious, empathetic, and deeply devoted.', fullReport: 'As a Number 2 love personality, you are the ultimate partner. You have an innate ability to sense what your loved one needs, often before they know it themselves. Your challenge is ensuring your own needs are met equally in the relationship.' },
      { id: 'seeker', label: 'The Seeker (7)', minScore: 0, maxScore: 100, icon: 'search-outline', summary: 'Your numerological love profile is The Seeker. Introspective, deep, and drawn to meaningful connections.', fullReport: 'As a Number 7 love personality, you approach love with depth and thoughtfulness. Surface-level connections leave you cold - you need a partner who can match your intellectual and spiritual depth. Your challenge is balancing your need for solitude with intimacy.' },
      { id: 'healer', label: 'The Healer (9)', minScore: 0, maxScore: 100, icon: 'heart-circle-outline', summary: 'Your numerological love profile is The Healer. Compassionate, selfless, and profoundly loving.', fullReport: 'As a Number 9 love personality, you love with your whole being. You are drawn to partners who need nurturing, and you give generously of yourself. Your challenge is learning to receive love as freely as you give it.' },
    ],
  },
  {
    id: 'couple-compat',
    title: 'Couple Compatibility',
    description: 'How aligned are you both',
    duration: '5 min',
    icon: 'people-outline',
    questionCount: 6,
    questions: [
      {
        id: 'q1', text: 'How do you and your partner typically spend weekends?',
        answers: [
          { id: 'a1', text: 'Always together, doing shared activities', category: 'high', score: 3 },
          { id: 'a2', text: 'A mix of together time and solo time', category: 'high', score: 2 },
          { id: 'a3', text: 'Mostly separate activities', category: 'low', score: 1 },
          { id: 'a4', text: 'We rarely plan our weekends together', category: 'low', score: 0 },
        ],
      },
      {
        id: 'q2', text: 'When it comes to future goals, you and your partner...',
        answers: [
          { id: 'a1', text: 'Share the same vision completely', category: 'high', score: 3 },
          { id: 'a2', text: 'Agree on the big things, differ on details', category: 'high', score: 2 },
          { id: 'a3', text: 'Have somewhat different priorities', category: 'low', score: 1 },
          { id: 'a4', text: 'Have not discussed this much', category: 'low', score: 0 },
        ],
      },
      {
        id: 'q3', text: 'How would you describe your communication?',
        answers: [
          { id: 'a1', text: 'Open and honest about everything', category: 'high', score: 3 },
          { id: 'a2', text: 'Good overall with occasional struggles', category: 'high', score: 2 },
          { id: 'a3', text: 'Could be better, some topics are avoided', category: 'low', score: 1 },
          { id: 'a4', text: 'We often misunderstand each other', category: 'low', score: 0 },
        ],
      },
      {
        id: 'q4', text: 'How do you resolve disagreements?',
        answers: [
          { id: 'a1', text: 'We talk it through calmly and find middle ground', category: 'high', score: 3 },
          { id: 'a2', text: 'It takes time, but we eventually work it out', category: 'high', score: 2 },
          { id: 'a3', text: 'One person usually gives in', category: 'low', score: 1 },
          { id: 'a4', text: 'Arguments tend to escalate or go unresolved', category: 'low', score: 0 },
        ],
      },
      {
        id: 'q5', text: 'How well does your partner know your emotional needs?',
        answers: [
          { id: 'a1', text: 'They know me better than anyone', category: 'high', score: 3 },
          { id: 'a2', text: 'Pretty well, most of the time', category: 'high', score: 2 },
          { id: 'a3', text: 'Sometimes, but they miss things', category: 'low', score: 1 },
          { id: 'a4', text: 'Not as well as I would like', category: 'low', score: 0 },
        ],
      },
      {
        id: 'q6', text: 'When you think about your future together, you feel...',
        answers: [
          { id: 'a1', text: 'Excited and secure', category: 'high', score: 3 },
          { id: 'a2', text: 'Mostly positive with some questions', category: 'high', score: 2 },
          { id: 'a3', text: 'Uncertain but hopeful', category: 'low', score: 1 },
          { id: 'a4', text: 'Anxious or unsure', category: 'low', score: 0 },
        ],
      },
    ],
    results: [
      { id: 'high', label: 'Deeply Connected', minScore: 12, maxScore: 18, icon: 'heart', summary: 'You and your partner share a strong, deeply aligned connection. Your communication and shared values create a solid foundation.', fullReport: 'Your compatibility score suggests a deeply connected partnership. You and your partner have built strong communication patterns, share aligned values, and handle conflict in healthy ways. Continue nurturing these strengths by maintaining open dialogue and making time for shared experiences.' },
      { id: 'medium', label: 'Growing Together', minScore: 6, maxScore: 11, icon: 'trending-up-outline', summary: 'Your relationship has a solid foundation with room for growth. With intention and effort, your connection can deepen significantly.', fullReport: 'Your compatibility score suggests a relationship with solid potential and areas for growth. You have a good foundation, but there may be areas where better communication or more intentional effort could strengthen your bond. Consider having open conversations about your expectations and needs.' },
      { id: 'low', label: 'Worth Exploring', minScore: 0, maxScore: 5, icon: 'compass-outline', summary: 'Your relationship may benefit from deeper exploration and more intentional connection. Every partnership can grow with the right effort.', fullReport: 'Your compatibility score suggests areas where your relationship could benefit from more intentional connection. This does not mean your relationship cannot work - it means there are opportunities for meaningful growth. Consider exploring couples communication exercises or speaking with a relationship counsellor together.' },
    ],
  },
  {
    id: 'attachment',
    title: 'Attachment Style',
    description: 'Anxious, avoidant, or secure',
    duration: '6 min',
    icon: 'ribbon-outline',
    questionCount: 8,
    questions: [
      {
        id: 'q1', text: 'When your partner does not respond to a message quickly, you...',
        answers: [
          { id: 'a1', text: 'Assume they are busy and carry on', category: 'secure', score: 1 },
          { id: 'a2', text: 'Feel a twinge of worry but manage it', category: 'secure', score: 1 },
          { id: 'a3', text: 'Start overthinking what it means', category: 'anxious', score: 1 },
          { id: 'a4', text: 'Feel relieved for the space', category: 'avoidant', score: 1 },
        ],
      },
      {
        id: 'q2', text: 'When someone gets emotionally close to you, you...',
        answers: [
          { id: 'a1', text: 'Welcome it and feel safe', category: 'secure', score: 1 },
          { id: 'a2', text: 'Want it but feel vulnerable', category: 'anxious', score: 1 },
          { id: 'a3', text: 'Feel slightly uncomfortable', category: 'avoidant', score: 1 },
          { id: 'a4', text: 'Instinctively pull back', category: 'avoidant', score: 1 },
        ],
      },
      {
        id: 'q3', text: 'Your biggest fear in relationships is...',
        answers: [
          { id: 'a1', text: 'Being abandoned or not enough', category: 'anxious', score: 1 },
          { id: 'a2', text: 'Losing your independence', category: 'avoidant', score: 1 },
          { id: 'a3', text: 'Growing apart naturally', category: 'secure', score: 1 },
          { id: 'a4', text: 'Being suffocated or controlled', category: 'avoidant', score: 1 },
        ],
      },
      {
        id: 'q4', text: 'After an argument with your partner, you...',
        answers: [
          { id: 'a1', text: 'Want to resolve it quickly and reconnect', category: 'anxious', score: 1 },
          { id: 'a2', text: 'Need significant space before discussing it', category: 'avoidant', score: 1 },
          { id: 'a3', text: 'Can step back, then approach calmly', category: 'secure', score: 1 },
          { id: 'a4', text: 'Replay it anxiously until it is resolved', category: 'anxious', score: 1 },
        ],
      },
      {
        id: 'q5', text: 'How comfortable are you depending on others?',
        answers: [
          { id: 'a1', text: 'Very comfortable, it feels natural', category: 'secure', score: 1 },
          { id: 'a2', text: 'I want to but fear being let down', category: 'anxious', score: 1 },
          { id: 'a3', text: 'I prefer to rely on myself', category: 'avoidant', score: 1 },
          { id: 'a4', text: 'It makes me deeply uncomfortable', category: 'avoidant', score: 1 },
        ],
      },
      {
        id: 'q6', text: 'When your partner seems distant, you...',
        answers: [
          { id: 'a1', text: 'Calmly check in when the time feels right', category: 'secure', score: 1 },
          { id: 'a2', text: 'Feel anxious and try harder to connect', category: 'anxious', score: 1 },
          { id: 'a3', text: 'Match their distance or pull away more', category: 'avoidant', score: 1 },
          { id: 'a4', text: 'Feel relieved by the breathing room', category: 'avoidant', score: 1 },
        ],
      },
      {
        id: 'q7', text: 'Your relationship history could best be described as...',
        answers: [
          { id: 'a1', text: 'Stable with healthy communication', category: 'secure', score: 1 },
          { id: 'a2', text: 'Intense with emotional highs and lows', category: 'anxious', score: 1 },
          { id: 'a3', text: 'Short-lived or emotionally guarded', category: 'avoidant', score: 1 },
          { id: 'a4', text: 'A pattern of wanting closeness then pulling away', category: 'anxious', score: 1 },
        ],
      },
      {
        id: 'q8', text: 'In an ideal relationship, your partner would...',
        answers: [
          { id: 'a1', text: 'Be a consistent, reliable presence', category: 'secure', score: 1 },
          { id: 'a2', text: 'Constantly reassure you of their feelings', category: 'anxious', score: 1 },
          { id: 'a3', text: 'Give you plenty of space and independence', category: 'avoidant', score: 1 },
          { id: 'a4', text: 'Be patient with your emotional waves', category: 'anxious', score: 1 },
        ],
      },
    ],
    results: [
      { id: 'secure', label: 'Secure Attachment', minScore: 0, maxScore: 100, icon: 'shield-checkmark-outline', summary: 'You have a secure attachment style. You feel comfortable with intimacy and interdependence, and navigate relationships with confidence and trust.', fullReport: 'Secure attachment is the foundation of healthy relationships. You are comfortable with closeness, can communicate your needs effectively, and trust that your partner will be there for you. You handle conflict constructively and do not take temporary distance personally.\n\nYour strength: You create a safe space for both yourself and your partner. Continue building on this by staying emotionally available and maintaining healthy boundaries.' },
      { id: 'anxious', label: 'Anxious Attachment', minScore: 0, maxScore: 100, icon: 'pulse-outline', summary: 'You tend toward anxious attachment. You crave closeness and connection deeply, but may worry about whether your partner feels the same way.', fullReport: 'Anxious attachment often develops from inconsistent early caregiving. You love deeply and intensely, but may experience heightened anxiety about your relationship security. You might over-analyze your partner\'s behavior or need frequent reassurance.\n\nGrowth path: Practice self-soothing when anxiety rises. Communicate your needs directly rather than through hints. Building self-worth independent of your relationship will strengthen your connections.' },
      { id: 'avoidant', label: 'Avoidant Attachment', minScore: 0, maxScore: 100, icon: 'exit-outline', summary: 'You tend toward avoidant attachment. You value independence highly and may find deep emotional intimacy challenging or uncomfortable.', fullReport: 'Avoidant attachment often develops as a protective mechanism. You may have learned early that depending on others leads to disappointment. You value self-sufficiency and may unconsciously create distance when someone gets too close.\n\nGrowth path: Practice small acts of vulnerability. Allow yourself to need others. Recognize that independence and intimacy are not mutually exclusive. Consider journaling about your feelings to build emotional awareness.' },
    ],
  },
  {
    id: 'soulmate',
    title: 'Soulmate Calculator',
    description: 'Uncover your ideal match',
    duration: '4 min',
    icon: 'search-outline',
    questionCount: 6,
    questions: [
      {
        id: 'q1', text: 'The quality you value most in a partner is...',
        answers: [
          { id: 'a1', text: 'Emotional depth and sensitivity', category: 'empath', score: 1 },
          { id: 'a2', text: 'Intelligence and curiosity', category: 'intellectual', score: 1 },
          { id: 'a3', text: 'Ambition and drive', category: 'achiever', score: 1 },
          { id: 'a4', text: 'Creativity and spontaneity', category: 'creative', score: 1 },
        ],
      },
      {
        id: 'q2', text: 'Your ideal first date would be...',
        answers: [
          { id: 'a1', text: 'A long walk with deep conversation', category: 'empath', score: 1 },
          { id: 'a2', text: 'A thought-provoking exhibition or lecture', category: 'intellectual', score: 1 },
          { id: 'a3', text: 'An impressive dinner at a notable restaurant', category: 'achiever', score: 1 },
          { id: 'a4', text: 'Something unexpected and adventurous', category: 'creative', score: 1 },
        ],
      },
      {
        id: 'q3', text: 'In your dream relationship, evenings look like...',
        answers: [
          { id: 'a1', text: 'Sharing feelings and processing the day together', category: 'empath', score: 1 },
          { id: 'a2', text: 'Reading together or discussing ideas', category: 'intellectual', score: 1 },
          { id: 'a3', text: 'Planning goals and celebrating wins', category: 'achiever', score: 1 },
          { id: 'a4', text: 'Making music, art, or trying something new', category: 'creative', score: 1 },
        ],
      },
      {
        id: 'q4', text: 'The relationship dealbreaker for you is...',
        answers: [
          { id: 'a1', text: 'Emotional unavailability', category: 'empath', score: 1 },
          { id: 'a2', text: 'Closed-mindedness', category: 'intellectual', score: 1 },
          { id: 'a3', text: 'Lack of ambition', category: 'achiever', score: 1 },
          { id: 'a4', text: 'Routine and predictability', category: 'creative', score: 1 },
        ],
      },
      {
        id: 'q5', text: 'How do you show love?',
        answers: [
          { id: 'a1', text: 'Through emotional support and deep listening', category: 'empath', score: 1 },
          { id: 'a2', text: 'Through meaningful conversations and shared learning', category: 'intellectual', score: 1 },
          { id: 'a3', text: 'Through building a life together and achieving goals', category: 'achiever', score: 1 },
          { id: 'a4', text: 'Through surprises, adventures, and spontaneous gestures', category: 'creative', score: 1 },
        ],
      },
      {
        id: 'q6', text: 'When you picture your soulmate, they...',
        answers: [
          { id: 'a1', text: 'Feel like coming home', category: 'empath', score: 1 },
          { id: 'a2', text: 'Challenge you to think differently', category: 'intellectual', score: 1 },
          { id: 'a3', text: 'Inspire you to be your best self', category: 'achiever', score: 1 },
          { id: 'a4', text: 'Make every day feel like a new adventure', category: 'creative', score: 1 },
        ],
      },
    ],
    results: [
      { id: 'empath', label: 'The Empathic Soulmate', minScore: 0, maxScore: 100, icon: 'heart-half-outline', summary: 'Your ideal match is an empathic soul. Someone who feels deeply, listens intently, and creates a sanctuary of emotional safety.', fullReport: 'Your soulmate profile reveals that you are drawn to deep emotional connections. Your ideal partner is someone who values vulnerability, empathy, and emotional authenticity. They are the type who remembers the small things, checks in on you genuinely, and creates a space where you feel truly seen.' },
      { id: 'intellectual', label: 'The Intellectual Soulmate', minScore: 0, maxScore: 100, icon: 'bulb-outline', summary: 'Your ideal match is an intellectual companion. Someone who stimulates your mind, questions the world, and grows alongside you.', fullReport: 'Your soulmate profile reveals that you are drawn to mental connection. Your ideal partner is someone who values ideas, curiosity, and growth. They challenge you to think deeper, share fascinating perspectives, and see learning as a lifelong pursuit.' },
      { id: 'achiever', label: 'The Ambitious Soulmate', minScore: 0, maxScore: 100, icon: 'trophy-outline', summary: 'Your ideal match is a driven achiever. Someone who shares your ambition, builds alongside you, and celebrates your wins.', fullReport: 'Your soulmate profile reveals that you are drawn to ambition and shared purpose. Your ideal partner is someone who has goals, works hard, and wants to build something meaningful together. They inspire you to level up while being your biggest supporter.' },
      { id: 'creative', label: 'The Creative Soulmate', minScore: 0, maxScore: 100, icon: 'color-palette-outline', summary: 'Your ideal match is a creative spirit. Someone who sees the world differently, embraces spontaneity, and fills life with wonder.', fullReport: 'Your soulmate profile reveals that you are drawn to creativity and spontaneity. Your ideal partner is someone who approaches life with imagination, breaks routines joyfully, and finds magic in the everyday. They keep your relationship vibrant and surprising.' },
    ],
  },
];

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
