
export interface Character {
  id: string;
  name: string;
  gender: 'Laki-laki' | 'Perempuan';
  age: string;
  role: string;
  description: string;
  // New per-character setting fields
  settingEnvironment: string;
  settingLocation: string;
  settingAtmosphere: string;
  settingVisuals: string;
}

export interface StoryParams {
  mainTitle: string;
  chapterNumber: string;
  chapterTitle: string;
  characters: Character[];
  // Global setting removed in favor of per-character settings
  genre: string[]; 
  theme: string;
  language: 'id' | 'en';
  parallelScene: string; // New field for events happening elsewhere
}

export interface GeneratedStory {
  title: string;
  content: string;
  moral: string;
}

export interface StoryState {
  data: GeneratedStory | null;
  imageUrl: string | null;
  audioData: AudioBuffer | null;
  isLoading: boolean;
  loadingStep: 'idle' | 'writing' | 'drawing' | 'narrating';
  error: string | null;
}

// Comprehensive Genre List
export enum Genre {
  ACTION = 'Aksi',
  MARTIAL_ART = 'Martial Art',
  XIANXIA = 'Xianxia',
  XIANHUAN = 'Xianhuan',
  ROMANCE = 'Romansa',
  FANTASY = 'Fantasi',
  COMEDY = 'Komedi',
  HORROR = 'Horor',
  MYSTERY = 'Misteri',
  SUPERNATURAL = 'Supernatural',
  SCI_FI = 'Sci-Fi',
  THRILLER = 'Thriller',
  HISTORY = 'Sejarah',
  DRAMA = 'Drama',
  ADVENTURE = 'Petualangan',
  ISEKAI = 'Isekai',
  SLICE_OF_LIFE = 'Slice of Life',
  CYBERPUNK = 'Cyberpunk',
  STEAMPUNK = 'Steampunk',
  DYSTOPIAN = 'Dystopian'
}
