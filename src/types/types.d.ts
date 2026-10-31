export interface PresenceData {
  userData: UserData;
  animeData: AnimeData;
  currentEpisode: string;
  dubbingStudio: string;
  videoState?: VideoState;
}

export interface AnimeData {
  id: number;
  mal_id: number;
  anilist_id: number;
  slug: string;
  title_ukrainian: string;
  title_original: string;
  title_english: string;
  status: string;
  type: string;
  year: number;
  season_name: string;
  season_name_ukrainian: string;
  has_ukrainian_dub: boolean;
  poster_url: string;
  banner_url: string;
  episodes_count: number;
  imdb_id: string;
  a: string;
  description: string;
  genres: string[];
  dubbing_studios: DubbingStudio[];
  screenshots: [{ id: number; image_url: string; description: string }];
  youtube_trailer: string;
  rating: number;
}

export interface DubbingStudio {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
}

export interface UserData {
  username: string;
  avatar: string | null;
}

export interface VideoState {
  isPaused: boolean;
  currentTime: number;
  duration: number;
}
