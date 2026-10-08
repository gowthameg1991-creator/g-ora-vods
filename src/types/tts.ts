export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  character: string;
  bestFor: string;
  sampleText: string;
  avatarColor: string;
  sampleAudioUrl: string;
  kannadaBadge?: string;
  kannadaSuitability?: string;
  languageSuitability?: Record<string, string>;
}

export const GEMINI_VOICES: VoiceOption[] = [
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    character: 'Upbeat, energetic & youthful • Top Kanglish Voice',
    bestFor: '🏆 #1 Male for Kannada / Kanglish Reels, YouTube Shorts, viral hooks & tech vlogs',
    sampleText: 'Hey friends! Ready to create high-retention Kannada & Kanglish reels that hook your audience?',
    avatarColor: 'from-amber-500 to-orange-600',
    sampleAudioUrl: '/samples/puck.wav',
    kannadaBadge: '🏆 #1 Best Male for Kanglish Reels',
    kannadaSuitability: 'Best energetic male voice for fast, engaging mixed Kannada-English reels & shorts.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    character: 'Indian Male Narrator • Warm, Friendly & Clear Explainer',
    bestFor: '🏆 Step-by-step tutorials, PAN/Aadhaar guides, YouTube videos & explainers',
    sampleText: "In this video, I'll show you how to apply for a PAN card online, step-by-step, including all required documents.",
    avatarColor: 'from-indigo-600 to-blue-800',
    sampleAudioUrl: '/samples/charon.wav',
    kannadaBadge: '🏆 #1 Indian Male Explainer',
    kannadaSuitability: 'Authentic Indian male voice for clear, natural conversational explainers and tutorials.',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    character: 'Firm, calm, clear & measured',
    bestFor: 'Professional narrations, SaaS walk-throughs, educational guides, audiobooks',
    sampleText: 'Hello, welcome to this guide. Here is the step-by-step breakdown of everything you need.',
    avatarColor: 'from-emerald-500 to-teal-700',
    sampleAudioUrl: '/samples/kore.wav',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    character: 'Authoritative, resonant & powerful',
    bestFor: 'Movie trailers, sports commentary, bold promos, dramatic announcements',
    sampleText: 'The ultimate showdown begins now. Get ready for an experience like never before.',
    avatarColor: 'from-rose-600 to-red-800',
    sampleAudioUrl: '/samples/fenrir.wav',
    kannadaBadge: 'Resonant & Dramatic Male',
    kannadaSuitability: 'Deep, booming male tone for dramatic Kannada movie trailers and bold promos.',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Female',
    character: 'Breezy, bright, conversational & warm',
    bestFor: 'Lifestyle, travel vlogs, wellness routines, food reels, personal stories',
    sampleText: 'Hi everyone! Welcome back. Today we are creating fresh and engaging content together.',
    avatarColor: 'from-fuchsia-500 to-purple-700',
    sampleAudioUrl: '/samples/aoede.wav',
  },
  {
    id: 'Vindemiatrix',
    name: 'Vindemiatrix',
    gender: 'Female',
    character: 'Gentle & enigmatic',
    bestFor: 'Best starting point for the overall mystery narrator',
    sampleText: 'The fog rolled over the quiet harbor, hiding secrets that had been buried in the shadows for decades.',
    avatarColor: 'from-violet-500 to-purple-800',
    sampleAudioUrl: '/samples/vindemiatrix.wav',
  },
  {
    id: 'Sulafat',
    name: 'Sulafat',
    gender: 'Female',
    character: 'Warm & grounded',
    bestFor: 'Use this if Vindemiatrix sounds too soft',
    sampleText: 'Every mystery begins with a single question, whispered in the dark where no one thought to look.',
    avatarColor: 'from-amber-600 to-yellow-800',
    sampleAudioUrl: '/samples/sulafat.wav',
  },
  {
    id: 'Algieba',
    name: 'Algieba',
    gender: 'Male',
    character: 'Smooth & polished',
    bestFor: 'Use this if you want a more cinematic, polished narrator',
    sampleText: 'In the heart of the ancient ruins, an untold story was waiting to be uncovered.',
    avatarColor: 'from-cyan-500 to-blue-700',
    sampleAudioUrl: '/samples/algieba.wav',
    kannadaBadge: 'Smooth Corporate Male',
    kannadaSuitability: 'Polished male presenter voice for formal Kannada announcements & tutorials.',
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'Female',
    character: 'Youthful & vibrant',
    bestFor: 'Use this if you want the channel to feel more like a young-adventure mystery',
    sampleText: 'We found the old map hidden beneath the floorboards, and that was the moment our adventure began.',
    avatarColor: 'from-teal-400 to-emerald-600',
    sampleAudioUrl: '/samples/leda.wav',
  },
  {
    id: 'Achird',
    name: 'Achird',
    gender: 'Male',
    character: 'Youthful, inquisitive & clear • E-learning & Guides',
    bestFor: 'E-learning courses, app walkthroughs, curiosity-driven explainers & educational guides',
    sampleText: 'Welcome to this learning journey. In this module, we will explore step-by-step how each concept connects.',
    avatarColor: 'from-sky-400 to-indigo-600',
    sampleAudioUrl: '/samples/achird.wav',
  },
  {
    id: 'Iapetus',
    name: 'Iapetus',
    gender: 'Male',
    character: 'Grounded, friendly & casual • Everyday Storyteller',
    bestFor: 'Conversational podcasts, casual vlogs, relatable explainers, daily stories & Kanglish chat',
    sampleText: 'Hey everyone, let me walk you through this real quick—nice, easy, and straight to the point.',
    avatarColor: 'from-amber-600 to-stone-700',
    sampleAudioUrl: '/samples/iapetus.wav',
    kannadaBadge: 'Casual & Friendly Male',
    kannadaSuitability: 'Natural, grounded conversational male tone for relatable Kannada/Kanglish vlogs and tips.',
  },
];

export interface EmotionOption {
  id: string;
  name: string;
  bestUse: string;
  category: 'General' | 'Mystery & Suspense' | 'High Energy' | 'Calm & Warm' | 'Dramatic' | 'Professional';
  recommendedVoice: string;
  suggestedPace: number;
}

export const EMOTIONS: EmotionOption[] = [
  {
    id: 'default',
    name: 'Default / Neutral',
    bestUse: 'General narration, explainers, training videos',
    category: 'General',
    recommendedVoice: 'Kore',
    suggestedPace: 1.0,
  },
  {
    id: 'mysterious',
    name: 'Mysterious',
    bestUse: 'Enigmatic intros, unsolved secrets, dark lore & suspenseful hooks',
    category: 'Mystery & Suspense',
    recommendedVoice: 'Vindemiatrix',
    suggestedPace: 0.9,
  },
  {
    id: 'curious',
    name: 'Curious',
    bestUse: 'Inquisitive questions, science puzzles, discovery & wonder',
    category: 'Mystery & Suspense',
    recommendedVoice: 'Leda',
    suggestedPace: 1.05,
  },
  {
    id: 'playful',
    name: 'Playful',
    bestUse: 'Banter, cheeky humor, witty punchlines & fun storytelling',
    category: 'High Energy',
    recommendedVoice: 'Puck',
    suggestedPace: 1.15,
  },
  {
    id: 'suspicious',
    name: 'Suspicious',
    bestUse: 'Distrustful whispers, conspiracy theories & psychological tension',
    category: 'Mystery & Suspense',
    recommendedVoice: 'Algieba',
    suggestedPace: 0.95,
  },
  {
    id: 'uneasy',
    name: 'Uneasy',
    bestUse: 'Creeping dread, uncanny atmosphere & unsettling premonitions',
    category: 'Mystery & Suspense',
    recommendedVoice: 'Sulafat',
    suggestedPace: 0.9,
  },
  {
    id: 'tense',
    name: 'Tense',
    bestUse: 'High-stakes countdowns, thriller cliffhangers & urgent suspense',
    category: 'Dramatic',
    recommendedVoice: 'Fenrir',
    suggestedPace: 1.15,
  },
  {
    id: 'cheerful',
    name: 'Cheerful',
    bestUse: 'Upbeat intros, good news, friendly social content',
    category: 'High Energy',
    recommendedVoice: 'Puck',
    suggestedPace: 1.1,
  },
  {
    id: 'excited',
    name: 'Excited',
    bestUse: 'Launches, promotions, energetic announcements',
    category: 'High Energy',
    recommendedVoice: 'Puck',
    suggestedPace: 1.15,
  },
  {
    id: 'friendly',
    name: 'Friendly',
    bestUse: 'Conversational tutorials and informal explainers',
    category: 'Calm & Warm',
    recommendedVoice: 'Aoede',
    suggestedPace: 1.0,
  },
  {
    id: 'hopeful',
    name: 'Hopeful',
    bestUse: 'Inspirational or future-focused content',
    category: 'Calm & Warm',
    recommendedVoice: 'Aoede',
    suggestedPace: 0.95,
  },
  {
    id: 'empathetic',
    name: 'Empathetic',
    bestUse: 'Sensitive messages, support-oriented videos',
    category: 'Calm & Warm',
    recommendedVoice: 'Aoede',
    suggestedPace: 0.9,
  },
  {
    id: 'calm',
    name: 'Calm',
    bestUse: 'Meditation, reassurance, slow educational narration',
    category: 'Calm & Warm',
    recommendedVoice: 'Charon',
    suggestedPace: 0.85,
  },
  {
    id: 'serious',
    name: 'Serious',
    bestUse: 'Important announcements and formal topics',
    category: 'Dramatic',
    recommendedVoice: 'Charon',
    suggestedPace: 0.95,
  },
  {
    id: 'sad',
    name: 'Sad',
    bestUse: 'Somber stories or reflective content',
    category: 'Dramatic',
    recommendedVoice: 'Charon',
    suggestedPace: 0.85,
  },
  {
    id: 'angry',
    name: 'Angry',
    bestUse: 'Dramatic dialogue or strong warnings',
    category: 'Dramatic',
    recommendedVoice: 'Fenrir',
    suggestedPace: 1.1,
  },
  {
    id: 'fearful',
    name: 'Fearful',
    bestUse: 'Suspense, horror, urgent scenes',
    category: 'Dramatic',
    recommendedVoice: 'Aoede',
    suggestedPace: 1.15,
  },
  {
    id: 'disgruntled',
    name: 'Disgruntled',
    bestUse: 'Complaint-like or frustrated dialogue',
    category: 'Dramatic',
    recommendedVoice: 'Fenrir',
    suggestedPace: 1.05,
  },
  {
    id: 'shouting',
    name: 'Shouting',
    bestUse: 'High-intensity dramatic delivery',
    category: 'High Energy',
    recommendedVoice: 'Fenrir',
    suggestedPace: 1.2,
  },
  {
    id: 'whispering',
    name: 'Whispering',
    bestUse: 'Secretive, intimate, or suspenseful delivery',
    category: 'Dramatic',
    recommendedVoice: 'Charon',
    suggestedPace: 0.85,
  },
  {
    id: 'terrified',
    name: 'Terrified',
    bestUse: 'Horror and intense dramatic scenes',
    category: 'Dramatic',
    recommendedVoice: 'Aoede',
    suggestedPace: 1.2,
  },
  {
    id: 'unfriendly',
    name: 'Unfriendly',
    bestUse: 'Cold or confrontational dialogue',
    category: 'Dramatic',
    recommendedVoice: 'Fenrir',
    suggestedPace: 0.95,
  },
  {
    id: 'customer_service',
    name: 'Customer service',
    bestUse: 'Support and help-center type scripts',
    category: 'Professional',
    recommendedVoice: 'Kore',
    suggestedPace: 1.0,
  },
  {
    id: 'assistant',
    name: 'Assistant',
    bestUse: 'Digital-assistant / neutral helpful delivery',
    category: 'Professional',
    recommendedVoice: 'Kore',
    suggestedPace: 1.0,
  },
  {
    id: 'newscast',
    name: 'Newscast',
    bestUse: 'News-reader style narration',
    category: 'Professional',
    recommendedVoice: 'Kore',
    suggestedPace: 1.05,
  },
  {
    id: 'narration_professional',
    name: 'Narration professional',
    bestUse: 'Documentaries, business and polished explainers',
    category: 'Professional',
    recommendedVoice: 'Charon',
    suggestedPace: 1.0,
  },
  {
    id: 'sports_commentary',
    name: 'Sports commentary',
    bestUse: 'Match highlights and sports-style videos',
    category: 'High Energy',
    recommendedVoice: 'Fenrir',
    suggestedPace: 1.3,
  },
  {
    id: 'advertisement_promotional',
    name: 'Advertisement / Promotional',
    bestUse: 'Commercials, product promos, calls to action',
    category: 'High Energy',
    recommendedVoice: 'Puck',
    suggestedPace: 1.15,
  },
  {
    id: 'poetry_reading',
    name: 'Poetry reading',
    bestUse: 'Poems and expressive literary scripts',
    category: 'Calm & Warm',
    recommendedVoice: 'Charon',
    suggestedPace: 0.85,
  },
];

export type PitchLevel = 'Default' | 'Extra low' | 'Low' | 'Medium' | 'High' | 'Extra High';

export interface PitchConfig {
  id: PitchLevel;
  label: string;
  semitones: number;
  register: string;
  description: string;
  recommendedFor: string;
  tagColor: string;
}

export const PITCH_CONFIGS: PitchConfig[] = [
  {
    id: 'Extra low',
    label: 'Extra low',
    semitones: -4,
    register: 'Deep Bass Register',
    description: 'Heavy, cinematic resonance with deep undertones',
    recommendedFor: 'Movie trailers, horror, dark mysteries & intense drama',
    tagColor: 'from-blue-600 to-indigo-800',
  },
  {
    id: 'Low',
    label: 'Low',
    semitones: -2,
    register: 'Warm Baritone / Alto',
    description: 'Grounded, warm chest tone with serious gravitas',
    recommendedFor: 'Documentaries, news commentary & reflective essays',
    tagColor: 'from-indigo-500 to-purple-700',
  },
  {
    id: 'Medium',
    label: 'Medium',
    semitones: 0,
    register: 'Balanced Speaking Register',
    description: 'Balanced frequency calibrated for conversational clarity',
    recommendedFor: 'Tutorials, educational guides & casual podcasts',
    tagColor: 'from-emerald-500 to-teal-700',
  },
  {
    id: 'Default',
    label: 'Default',
    semitones: 0,
    register: 'Original Baseline Pitch',
    description: 'Native timbre and frequency balance of the selected Gemini voice',
    recommendedFor: 'Standard narrations & natural speaking style',
    tagColor: 'from-indigo-600 to-blue-600',
  },
  {
    id: 'High',
    label: 'High',
    semitones: 2,
    register: 'Bright Melodic Register',
    description: 'Elevated, airy frequency with vibrant clarity',
    recommendedFor: 'YouTube Shorts, lively product reels & upbeat intros',
    tagColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'Extra High',
    label: 'Extra High',
    semitones: 4,
    register: 'Sharp Animated Register',
    description: 'High-energy, animated vocal frequency with fast cut emphasis',
    recommendedFor: 'Viral TikTok hooks, cartoons & high-intensity promotions',
    tagColor: 'from-rose-500 to-pink-600',
  },
];

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  badge: string;
  description?: string;
  recommendedVoices: string[];
  voiceSuitability?: Record<string, string>;
  sampleScripts: {
    title: string;
    description: string;
    text: string;
  }[];
}

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'kanglish',
    name: 'Kanglish',
    nativeName: 'ಕನ್ನಡ + English',
    flag: '🇮🇳',
    badge: 'ಕಂಗ್ಲಿಷ್ (Bengaluru Tech & Reels)',
    description: 'Natural, relatable blend of Kannada and English for tech reels, startup banter, finance tips & vlogs',
    recommendedVoices: ['Puck', 'Iapetus', 'Charon', 'Kore', 'Leda'],
    voiceSuitability: {
      Puck: '🔥 #1 Top Pick — High-energy Kanglish reels, tech reviews & viral banter',
      Iapetus: '⭐ #1 Top Pick — Grounded, friendly daily vlogs, student tips & chats',
      Charon: '🎙️ Top Pick — Deep mystery stories, history & serious Kannada documentary',
      Kore: '✨ Top Pick — Clean, balanced female explainer & SaaS tutorials',
      Leda: '🌟 Top Pick — Upbeat youthful female lifestyle, food & travel reels',
      Achird: '💡 Inquisitive, clear educational walkthroughs',
      Algieba: '🛡️ Resonant, thoughtful storytelling',
      Fenrir: '⚡ High-intensity dramatic Kannada hooks',
      Aoede: '🎵 Melodic, elegant cultural narration',
      Sulafat: '🌿 Warm, reflective stories & life advice',
      Zephyr: '🍃 Soft, gentle casual commentary',
      Vindemiatrix: '🔮 Dark suspense, horror & uncanny mystery',
    },
    sampleScripts: [
      {
        title: '🔥 ಕಂಗ್ಲಿಷ್ ಸ್ಮಾರ್ಟ್‌ಫೋನ್ ರೀಲ್ (Kanglish Tech Hook)',
        description: 'ಮಿಶ್ರ ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ ವೈರಲ್ ರೀಲ್ ಹುಕ್ (Puck ಧ್ವನಿಗೆ ಸೂಕ್ತ)',
        text: `Hey friends! ನೀವೇನಾದ್ರೂ ಹೊಸ smartphone buy ಮಾಡ್ಬೇಕು ಅಂತ plan ಮಾಡ್ತಿದೀರಾ?\n\n[PAUSE 1.5]\n\nWait! ಈ 3 important features ಚೆಕ್ ಮಾಡ್ದೆ purchase ಮಾಡ್ಬೇಡಿ.\n\nFirst, minimum 5000 mAh battery life ಇರ್ಬೇಕು. Second, 120Hz AMOLED display, and third, 5G processor support!\n\nEe video ಇಷ್ಟ ಆದ್ರೆ like ಮಾಡಿ, ನಿಮ್ಮ friends ಜೊತೆ share ಮಾಡಿ, follow ಮಾಡೋದು ಮರೀಬೇಡಿ!`,
      },
      {
        title: '🚀 ಕಂಗ್ಲಿಷ್ ಯೂಟ್ಯೂಬ್ ಶಾರ್ಟ್ಸ್ (Kanglish AI Tools)',
        description: 'ಯೂಟ್ಯೂಬ್ ಶಾರ್ಟ್ಸ್‌ಗಾಗಿ ಕಂಗ್ಲಿಷ್ ಟೆಕ್ ವಿವರಣೆ (Iapetus ಧ್ವನಿಗೆ ಸೂಕ್ತ)',
        text: `Namaskara friends! ಇವತ್ತಿನ video ದಲ್ಲಿ, YouTube Shorts create ಮಾಡೋಕೆ top 3 AI tools ಬಗ್ಗೆ ಹೇಳ್ತೀನಿ.\n\n[PAUSE 1.5]\n\nNumber one: G-ORA-VODS for realistic voice-overs. Script paste ಮಾಡಿ, instant studio audio download ಮಾಡ್ಕೊಳ್ಳಿ!\n\nEe reel save ಮಾಡ्ಕೊಳ್ಳಿ ಮತ್ತು ನಿಮ್ಮ content creator friends ಜೊತೆ share ಮಾಡಿ!`,
      },
      {
        title: '💰 ಕಂಗ್ಲಿಷ್ ಮನಿ & ಫೈನಾನ್ಸ್ ಟಿಪ್ಸ್ (Kanglish Finance)',
        description: 'ಸೇವಿಂಗ್ಸ್ ಮತ್ತು ಇನ್ವೆಸ್ಟ್‌ಮೆಂಟ್ ಸಲಹೆಗಳು (Kore ಧ್ವನಿಗೆ ಸೂಕ್ತ)',
        text: `Hello guys! ನಿಮ್ಮ monthly salary ಯಿಂದ ಹಣ save ಮಾಡೋಕೆ ಕಷ್ಟ ಆಗ್ತಿದ್ಯಾ?\n\n[PAUSE 1.5]\n\nSimple formula: 50-30-20 rule follow ಮಾಡಿ. 50% needs ಗೆ, 30% wants ಗೆ, and 20% compulsory investment ಗೆ ಇಡಿ.\n\nStart your SIP today! More finance tips ಗಾಗಿ ಈ page follow ಮಾಡಿ.`,
      },
      {
        title: '🎙️ ಕನ್ನಡ ರಹಸ್ಯ ಕಥೆ - ಚಾರೋನ್ ವಾಯ್ಸ್ (Deep Kannada Mystery)',
        description: 'ಆಳವಾದ ಗಂಭೀರ ನಿರೂಪಣೆ (Charon ಗಂಡು ಧ್ವನಿಗೆ ಸೂಕ್ತ)',
        text: `ಕರ್ನಾಟಕದ ಇತಿಹಾಸದಲ್ಲಿ ಈ ಒಂದು ಕೋಟೆ ಇಂದಿಗೂ ರಹಸ್ಯವಾಗಿ ಉಳಿದಿದೆ...\n\n[PAUSE 2]\n\nಯಾರೂ ಪ್ರವೇಶಿಸದ ಆ ಕತ್ತಲೆಯ ಸುರಂಗದೊಳಗೆ ಏನು ಅಡಗಿದೆ? ಇಂದಿನ ಸಂಚಿಕೆಯಲ್ಲಿ ತಿಳಿಯೋಣ.`,
      },
    ],
  },
  {
    code: 'hinglish',
    name: 'Hinglish',
    nativeName: 'हिंदी + English',
    flag: '🇮🇳',
    badge: 'हिंग्लिश (Viral Reels & Podcasts)',
    description: 'Urban Hindi-English mix for viral reels, startup podcasts, comedy banter & infotainment',
    recommendedVoices: ['Puck', 'Iapetus', 'Kore', 'Charon', 'Fenrir', 'Achird'],
    voiceSuitability: {
      Puck: '🔥 #1 Top Pick — Fast-paced viral YouTube hooks, meme banter & tech reels',
      Iapetus: '⭐ #1 Top Pick — Relatable podcast host, friendly chat & everyday storyteller',
      Kore: '✨ Top Pick — Polished female corporate host, EdTech & finance explainers',
      Charon: '🎙️ Top Pick — Deep crime thriller, horror lore & cinematic documentary',
      Fenrir: '⚡ Top Pick — Intense gym motivation, trailer voice & powerful punchlines',
      Achird: '💡 Top Pick — Crisp e-learning courses, software tutorials & clear guides',
      Aoede: '🎵 Smooth, melodic storytelling & lifestyle reels',
      Leda: '🌟 Lively female lifestyle, beauty & food vlogs',
      Sulafat: '🌿 Calming, thoughtful reflective essays',
      Algieba: '🛡️ Wary, investigative commentary',
      Zephyr: '🍃 Breezy, relaxed casual chatter',
      Vindemiatrix: '🔮 Atmospheric psychological mystery',
    },
    sampleScripts: [
      {
        title: '🔥 Hinglish Tech Hook (Viral Reel)',
        description: 'Fast-paced phone battery advice (Puck / Iapetus voice)',
        text: `Bhai, agar tum bhi apna smartphone raat bhar charge pe chhod dete ho...\n\n[PAUSE 1.5]\n\nStop right now! Battery cycle damage hone se phone slow ho jata hai.\n\nYeh 2 simple settings abhi turn off karo aur battery life 40% increase karo. Follow for more tech hacks!`,
      },
      {
        title: '🎙️ Hinglish Crime & Mystery (Charon Voice)',
        description: 'Deep suspenseful story hook (Charon deep baritone voice)',
        text: `Saal 1998... Shimla ke ek sunsaan bungalow mein aadhi raat ko ek phone call aati hai...\n\n[PAUSE 2]\n\nInspector ne receiver uthaya, lekin dusri taraf sirf ek ajeeb sa saans lene ka sound tha.\n\nKya tha us bungalow ka raaz? Chaliye jaante hain.`,
      },
      {
        title: '💰 Hinglish Personal Finance & SIP (Kore Voice)',
        description: 'Clean financial literacy explainer for 20-somethings',
        text: `Agar tumhari age 20 se 30 ke beech hai, toh yeh financial advice miss mat karna.\n\n[PAUSE 1.5]\n\nHar mahine salary ka 20% index funds mein invest karo. 10 saal baad compounding magic dekh kar hairan reh jaoge!`,
      },
      {
        title: '⚡ Hinglish Gym & Hustle Motivation (Fenrir Voice)',
        description: 'High-intensity workout and discipline booster',
        text: `Kal se start karunga? Yeh bolte bolte kitne mahine nikal gaye?\n\n[PAUSE 1.5]\n\nExcuses se body nahi banti, discipline se banti hai. Utho, shoes pehno aur hit the gym!`,
      },
    ],
  },
  {
    code: 'tamil_en',
    name: 'Tamil + English',
    nativeName: 'தமிழ் + English (Tanglish)',
    flag: '🇮🇳',
    badge: 'டாங்லிஷ் (Cinema & Tech Reviews)',
    description: 'Expressive Tanglish code-mixing for cinema reviews, gadget unboxings & comedy reels',
    recommendedVoices: ['Puck', 'Iapetus', 'Kore', 'Aoede', 'Charon'],
    voiceSuitability: {
      Puck: '🔥 #1 Top Pick — Rapid Tanglish banter, gadget unboxings & witty youth reels',
      Iapetus: '⭐ #1 Top Pick — Down-to-earth Chennai conversationalist, cinema reviews & vlogs',
      Kore: '✨ Top Pick — Professional female host, clean pronunciation & lifestyle guides',
      Aoede: '🎵 Top Pick — Melodic, soothing cultural narration & heritage stories',
      Charon: '🎙️ Top Pick — Mass cinematic movie trailers, historical epics & deep gravitas',
      Fenrir: '⚡ High-impact punch dialogues & mass cinema reviews',
      Achird: '💡 Clear e-learning & coding tutorials',
      Leda: '🌟 Vibrant lifestyle & food vlog narration',
      Sulafat: '🌿 Grounded, emotional storytelling',
      Algieba: '🛡️ Resonant, serious commentary',
      Zephyr: '🍃 Soft, calm conversational tone',
      Vindemiatrix: '🔮 Mystery & thriller lore',
    },
    sampleScripts: [
      {
        title: '🎬 Tanglish Movie Review (Iapetus Voice)',
        description: 'Authentic cinema review and theatre verdict hook',
        text: `Vanakkam makkale! Innaiku release aana blockbuster movie pathi oru honest review.\n\n[PAUSE 1.5]\n\nFirst half full-on fire screenplay, BGM vera level! Aana second half twist nenga expect-ey pannirukka maatinga.\n\nThியேட்டர் poi paakkalaama venama? Let's break it down!`,
      },
      {
        title: '📱 Tanglish Smartphone Unboxing (Puck Voice)',
        description: 'Snappy gadget reel for tech channels',
        text: `Intha budget-la 200MP camera phone-ah?! Namba mudiyala!\n\n[PAUSE 1.5]\n\nCamera samples paatha ungaluke theriyum—low light shots vera level clarity.\n\nFull specs and pricing video-kku bio link click pannunga!`,
      },
      {
        title: '🏛️ Tanglish History & Temple Mystery (Charon Voice)',
        description: 'Chola architecture mystery narration',
        text: `Thanjavur Periya Kovil gopuram mela irukkira antha 80-ton kal... epdi avlo uyaram kondu ponaanga?\n\n[PAUSE 2]\n\nAayiram varusham aagiyum, indraikkum aaraaychiyalar-galukku oru periya mystery-ah irukku.`,
      },
    ],
  },
  {
    code: 'telugu_en',
    name: 'Telugu + English',
    nativeName: 'తెలుగు + English (Tenglish)',
    flag: '🇮🇳',
    badge: 'తెంగ్లిష్ (Mass Reels & Career Tips)',
    description: 'Punchy Telugu-English blend for mass movie teasers, career tips & viral reels',
    recommendedVoices: ['Puck', 'Iapetus', 'Fenrir', 'Kore', 'Charon'],
    voiceSuitability: {
      Puck: '🔥 #1 Top Pick — High-energy reels, funny movie reactions & snappy tech tips',
      Iapetus: '⭐ #1 Top Pick — Friendly, relatable daily vlogs & student advice',
      Fenrir: '⚡ Top Pick — Mass punch dialogues, powerful action teasers & gym energy',
      Kore: '✨ Top Pick — Smooth instructional narration, career tips & brand explainers',
      Charon: '🎙️ Top Pick — Deep mythological lore, historical mysteries & documentary',
      Aoede: '🎵 Expressive, warm narration',
      Achird: '💡 Crisp software & learning walkthroughs',
      Leda: '🌟 Energetic travel & lifestyle shorts',
      Sulafat: '🌿 Reflective, heartfelt life stories',
      Algieba: '🛡️ Serious investigative tone',
      Zephyr: '🍃 Breezy, relaxed casual chat',
      Vindemiatrix: '🔮 Thrilling suspense & horror',
    },
    sampleScripts: [
      {
        title: '🚀 Tenglish Tech & Coding Roadmap (Puck Voice)',
        description: 'High-retention reel for software engineering aspirants',
        text: `Hello friends! Meelo evaraina coding start cheyali anukuntunnara?\n\n[PAUSE 1.5]\n\nPython vs Java—2025 lo ye language nerchukunte high paying jobs vastayi?\n\nEe video lo complete roadmap clear ga explain chesta. Save this reel right now!`,
      },
      {
        title: '🎬 Tenglish Mass Teaser Review (Fenrir / Charon Voice)',
        description: 'Mass cinema elevation review for Telugu movie lovers',
        text: `Box office record-lu baddalayye time vachindi!\n\n[PAUSE 2]\n\nTeaser lo hero elevation shots choosara? Background music next level goosebumps!\n\nIppude release date announce chesaru—theatre lo mass jathara pakka!`,
      },
      {
        title: '💡 Tenglish Personal Savings (Iapetus Voice)',
        description: 'Relatable money management tips for freshers',
        text: `Mee salary account lo dabbulu ela save cheyalo theleeda?\n\n[PAUSE 1.5]\n\nEmergency fund create cheyadam first priority. At least 6 months expenses save chesi pettukondi.\n\nMore money tips kosam page ni follow cheyandi!`,
      },
    ],
  },
  {
    code: 'malayalam_en',
    name: 'Malayalam + English',
    nativeName: 'മലയാളം + English (Manglish)',
    flag: '🇮🇳',
    badge: 'മാംഗ്ലിഷ് (Kerala Vlogs & Podcasts)',
    description: 'Subtle, natural Malayalam-English flow for travel stories, cinema analysis & podcasts',
    recommendedVoices: ['Iapetus', 'Kore', 'Charon', 'Sulafat', 'Achird'],
    voiceSuitability: {
      Iapetus: '⭐ #1 Top Pick — Grounded, realistic Kerala vlogger with natural conversational flow',
      Kore: '✨ Top Pick — Calm, articulate female presenter & informative tutorials',
      Charon: '🎙️ Top Pick — Slow, contemplative thrillers, literary narration & deep mystery',
      Sulafat: '🌿 Top Pick — Warm, reflective, grounded storytelling & nature/travel essays',
      Achird: '💡 Top Pick — Precise academic explainers, tech courses & study guides',
      Puck: '🔥 Fast-paced tech updates & youth reels',
      Fenrir: '⚡ Dramatic movie retrospectives',
      Aoede: '🎵 Poetic, cultural storytelling',
      Leda: '🌟 Bright food & travel vlogs',
      Algieba: '🛡️ Thoughtful commentary',
      Zephyr: '🍃 Gentle, peaceful voiceover',
      Vindemiatrix: '🔮 Atmospheric mystery & folklore',
    },
    sampleScripts: [
      {
        title: '🌴 Manglish Travel & Food Vlog (Iapetus Voice)',
        description: 'Charming Kerala travel reel script',
        text: `Namaskaram friends! Munnar-ile ee secret off-road location ninnalkk ariyamo?\n\n[PAUSE 1.5]\n\nTourist crowds onnum illaatha oru kidilan viewpoints and fresh tea plantations!\n\nKochi-yil ninnu 4 hours drive maathram. Ee weekend trip plan cheyyunnundengil save this reel!`,
      },
      {
        title: '🎙️ Manglish Cinema Analysis (Charon Voice)',
        description: 'Thoughtful movie breakdown script',
        text: `Malayalam cinema-yile oru timeless psychological thriller...\n\n[PAUSE 2]\n\nClimax scene-il director hide cheytha subtle clues ninnalkk notice cheyyaan pattiyaarno?\n\nInnathe video-yil detailed breakdown kaanaam.`,
      },
      {
        title: '📱 Manglish Productivity Tip (Kore Voice)',
        description: 'Clean time-management explainer',
        text: `Focus kittaan madi thonunno? Try the 25-minute Pomodoro technique.\n\n[PAUSE 1.5]\n\nMobile phone silent aakki oru dedicated task-il concentrate cheyyoo. Daily productivity double aakum!`,
      },
    ],
  },
  {
    code: 'en-in',
    name: 'Indian English',
    nativeName: 'English (Indian Accent & Cadence)',
    flag: '🇮🇳',
    badge: 'Indian English (Tutorials & Explainers)',
    description: 'Authentic Indian English pronunciation and natural conversational cadence for guides, explainers & tech reviews',
    recommendedVoices: ['Charon', 'Iapetus', 'Puck', 'Kore', 'Achird'],
    voiceSuitability: {
      Charon: '🏆 #1 Top Pick — Authoritative, clear Indian explainer & step-by-step tutorial narrator',
      Iapetus: '⭐ #1 Top Pick — Warm, friendly Indian conversational cadence for podcasts & daily vlogs',
      Puck: '🔥 Upbeat Pick — Fast, energetic tech reels & viral shorts with Indian cadence',
      Kore: '✨ Top Pick — Polished corporate & EdTech training voice',
      Achird: '💡 Top Pick — Youthful, articulate male voice for software walkthroughs & courses',
      Fenrir: '⚡ Powerful, deep male voice for intense announcements',
      Aoede: '🎵 Warm, expressive female voice for lifestyle and culture',
      Leda: '🌟 Upbeat lifestyle & travel vlogs',
      Sulafat: '🌿 Reflective, thoughtful stories',
      Algieba: '🛡️ Polished corporate presenter',
      Zephyr: '🍃 Soft, calm narration',
      Vindemiatrix: '🔮 Mystery and thriller storytelling',
    },
    sampleScripts: [
      {
        title: '🇮🇳 Step-by-Step Indian Explainer (Charon Voice)',
        description: 'Authentic Indian English tutorial delivery for PAN/Aadhaar/Tech guides',
        text: `In this video, I will show you how to link your Aadhaar card with your bank account online, step-by-step.\n\n[PAUSE 1.5]\n\nPlease keep your registered mobile number handy for OTP verification. Let's get started!`,
      },
      {
        title: '🎙️ Tech Review & Vlog (Iapetus Voice)',
        description: 'Friendly Indian English conversational review for YouTube & reels',
        text: `Hey guys, welcome back to the channel! Today we are testing this brand new wireless mic.\n\n[PAUSE 1.5]\n\nThe sound clarity is surprisingly clean, especially for outdoor shooting. Let me show you a quick sound test right now!`,
      },
    ],
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US / Global)',
    flag: '🇺🇸',
    badge: 'Global / YouTube & Insta',
    description: 'Universal international English for YouTube shorts, global documentaries & reels',
    recommendedVoices: [
      'Puck',
      'Charon',
      'Kore',
      'Fenrir',
      'Aoede',
      'Zephyr',
      'Vindemiatrix',
      'Leda',
      'Sulafat',
      'Algieba',
      'Achird',
      'Iapetus',
    ],
    sampleScripts: [
      {
        title: 'Suspense Mystery (with [PAUSE])',
        description: 'Timed silence pauses [PAUSE 2] & [PAUSE 3] for video cuts & suspense',
        text: `Quinn found a note...\n\nwritten in her own handwriting.\n\n[PAUSE 2]\n\nIt said:\n\n"Do NOT look under the table."\n\n[PAUSE 3]`,
      },
      {
        title: 'YouTube Short Hook (15s)',
        description: 'High-retention viral opening hook for shorts',
        text: 'Did you know 90% of people make this huge mistake when charging their phones? If you plug it in overnight, listen closely. Here is what actually happens inside your battery.',
      },
      {
        title: 'Instagram Reel Promo (25s)',
        description: 'Snappy lifestyle & product launch script',
        text: 'Stop overthinking your morning routine. This 3-minute habit will genuinely double your daily focus. Tap the link in bio to grab the free template before it’s gone!',
      },
      {
        title: 'Cinematic Documentary (35s)',
        description: 'Atmospheric storytelling with dramatic cadence',
        text: 'Centuries before the dawn of modern industry, ancient navigators crossed turbulent oceans guided only by constellations. Their journey was not merely survival—it was the pursuit of the unknown.',
      },
    ],
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಶುದ್ಧ ಕನ್ನಡ (Pure Kannada)',
    flag: '🇮🇳',
    badge: 'ಶುದ್ಧ ಕನ್ನಡ ನಿರೂಪಣೆ',
    description: 'Authentic pure Kannada pronunciation for literature, news, history and formal explainers',
    recommendedVoices: ['Charon', 'Puck', 'Iapetus', 'Kore', 'Sulafat'],
    sampleScripts: [
      {
        title: '🎙️ ಕನ್ನಡ ರಹಸ್ಯ ಕಥೆ - ಚಾರೋನ್ ವಾಯ್ಸ್ (Deep Kannada Mystery)',
        description: 'ಆಳವಾದ ಗಂಭೀರ ನಿರೂಪಣೆ (Charon ಗಂಡು ಧ್ವನಿಗೆ ಸೂಕ್ತ)',
        text: `ಕರ್ನಾಟಕದ ಇತಿಹಾಸದಲ್ಲಿ ಈ ಒಂದು ಕೋಟೆ ಇಂದಿಗೂ ರಹಸ್ಯವಾಗಿ ಉಳಿದಿದೆ...\n\n[PAUSE 2]\n\nಯಾರೂ ಪ್ರವೇಶಿಸದ ಆ ಕತ್ತಲೆಯ ಸುರಂಗದೊಳಗೆ ಏನು ಅಡಗಿದೆ? ಇಂದಿನ ಸಂಚಿಕೆಯಲ್ಲಿ ತಿಳಿಯೋಣ.`,
      },
      {
        title: '✨ ಕನ್ನಡ ಪ್ರೇರಣಾದಾಯಕ ಮಾತುಗಳು (Motivational Narration)',
        description: 'ಆಳವಾದ ಮತ್ತು ಸ್ಪೂರ್ತಿದಾಯಕ ಸಂದೇಶ',
        text: 'ಗೆಲುವು ಎಂಬುದು ರಾತ್ರೋರಾತ್ರಿ ಸಿಗುವ ಅದೃಷ್ಟವಲ್ಲ. ಅದು ಪ್ರತಿದಿನದ ಕಠಿಣ ಪರಿಶ್ರಮ, ಛಲ ಮತ್ತು ನಿಮ್ಮ ಮೇಲಿರುವ ದೃಢ ನಂಬಿಕೆಯ ಫಲಿತಾಂಶ.',
      },
    ],
  },
];

export interface GeneratedVoiceRecord {
  id: string;
  timestamp: number;
  script: string;
  voice: string;
  language: string;
  emotion: string;
  pace: number; // e.g. 1.15
  pitch: PitchLevel;
  audioUrl: string; // Object URL for playback
  wavBlob: Blob;
  mp3Blob?: Blob;
  durationSec: number;
  sampleRate: number;
  fileSizeBytes: number;
  fileName: string;
  source?: 'gemini' | 'studio-engine';
}

export interface StudioPreset {
  id: string;
  name: string;
  description?: string;
  voiceId: string;
  emotionId: string;
  pace: number;
  pitch: PitchLevel;
  languageCode?: string;
  isSystem?: boolean;
  createdAt: number;
}

export const DEFAULT_PRESETS: StudioPreset[] = [
  {
    id: 'preset_charon_friendly_98',
    name: 'Charon Friendly (98% Pace)',
    description: 'Charon deep baritone with warm, friendly conversational delivery at 98% pace',
    voiceId: 'Charon',
    emotionId: 'friendly',
    pace: 0.98,
    pitch: 'Default',
    languageCode: 'en',
    isSystem: true,
    createdAt: 1,
  },
  {
    id: 'preset_puck_energetic_reels',
    name: 'Puck Energetic Reels (1.15x)',
    description: 'Puck upbeat viral delivery for high-retention shorts and reels',
    voiceId: 'Puck',
    emotionId: 'excited',
    pace: 1.15,
    pitch: 'Default',
    languageCode: 'en',
    isSystem: true,
    createdAt: 2,
  },
  {
    id: 'preset_charon_cinematic_documentary',
    name: 'Charon Deep Documentary (0.95x)',
    description: 'Charon serious baritone gravitas for historical essays & mystery stories',
    voiceId: 'Charon',
    emotionId: 'serious',
    pace: 0.95,
    pitch: 'Low',
    languageCode: 'en',
    isSystem: true,
    createdAt: 3,
  },
  {
    id: 'preset_kore_saas_explainer',
    name: 'Kore SaaS & Tutorial (1.00x)',
    description: 'Clear, balanced, calm professional guide narration',
    voiceId: 'Kore',
    emotionId: 'default',
    pace: 1.0,
    pitch: 'Default',
    languageCode: 'en',
    isSystem: true,
    createdAt: 4,
  },
  {
    id: 'preset_achird_elearning',
    name: 'Achird E-Learning & Guide (1.00x)',
    description: 'Youthful, inquisitive and clear male articulation for tutorials & explainers',
    voiceId: 'Achird',
    emotionId: 'curious',
    pace: 1.0,
    pitch: 'Default',
    languageCode: 'en',
    isSystem: true,
    createdAt: 5,
  },
  {
    id: 'preset_iapetus_casual_vlog',
    name: 'Iapetus Casual Storyteller (1.05x)',
    description: 'Grounded, friendly everyman cadence for conversational vlogs and podcasts',
    voiceId: 'Iapetus',
    emotionId: 'friendly',
    pace: 1.05,
    pitch: 'Default',
    languageCode: 'en',
    isSystem: true,
    createdAt: 6,
  },
  {
    id: 'preset_puck_kanglish_tech',
    name: 'Puck Kanglish Tech Reel (1.10x)',
    description: 'High-energy Kannada + English viral hook for reels and shorts',
    voiceId: 'Puck',
    emotionId: 'excited',
    pace: 1.1,
    pitch: 'Default',
    languageCode: 'kanglish',
    isSystem: true,
    createdAt: 7,
  },
  {
    id: 'preset_iapetus_hinglish_podcast',
    name: 'Iapetus Hinglish Storyteller (1.00x)',
    description: 'Relatable Hindi + English casual podcast host & lifestyle vlogs',
    voiceId: 'Iapetus',
    emotionId: 'friendly',
    pace: 1.0,
    pitch: 'Default',
    languageCode: 'hinglish',
    isSystem: true,
    createdAt: 8,
  },
  {
    id: 'preset_charon_hinglish_crime',
    name: 'Charon Hinglish Crime & Mystery (0.95x)',
    description: 'Signature deep baritone gravitas for Hindi-English crime & thriller storytelling',
    voiceId: 'Charon',
    emotionId: 'mysterious',
    pace: 0.95,
    pitch: 'Low',
    languageCode: 'hinglish',
    isSystem: true,
    createdAt: 9,
  },
  {
    id: 'preset_puck_tanglish_cinema',
    name: 'Puck Tanglish Cinema & Review (1.12x)',
    description: 'Rapid, witty Tamil + English film breakdown and meme commentary',
    voiceId: 'Puck',
    emotionId: 'playful',
    pace: 1.12,
    pitch: 'Default',
    languageCode: 'tamil_en',
    isSystem: true,
    createdAt: 10,
  },
  {
    id: 'preset_fenrir_tenglish_mass',
    name: 'Fenrir Tenglish Mass Punch (1.08x)',
    description: 'Powerful Telugu + English mass punch dialogues & movie teasers',
    voiceId: 'Fenrir',
    emotionId: 'excited',
    pace: 1.08,
    pitch: 'Low',
    languageCode: 'telugu_en',
    isSystem: true,
    createdAt: 11,
  },
  {
    id: 'preset_iapetus_manglish_travel',
    name: 'Iapetus Manglish Travel Vlog (1.02x)',
    description: 'Natural Malayalam + English conversational flow for Kerala travel & food vlogs',
    voiceId: 'Iapetus',
    emotionId: 'friendly',
    pace: 1.02,
    pitch: 'Default',
    languageCode: 'malayalam_en',
    isSystem: true,
    createdAt: 12,
  },
  {
    id: 'preset_charon_indian_explainer',
    name: 'Charon Indian Explainer (0.98x)',
    description: 'Charon authoritative, warm Indian English voice for step-by-step guides & tutorials',
    voiceId: 'Charon',
    emotionId: 'friendly',
    pace: 0.98,
    pitch: 'Default',
    languageCode: 'en-in',
    isSystem: true,
    createdAt: 13,
  },
  {
    id: 'preset_iapetus_indian_storyteller',
    name: 'Iapetus Indian Storyteller (1.00x)',
    description: 'Iapetus grounded, friendly Indian conversational cadence for podcasts & vlogs',
    voiceId: 'Iapetus',
    emotionId: 'friendly',
    pace: 1.0,
    pitch: 'Default',
    languageCode: 'en-in',
    isSystem: true,
    createdAt: 14,
  },
];


