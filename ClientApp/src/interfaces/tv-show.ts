export interface ITVShowBase {
  id: number
  name: string
  original_name: string
  poster_path: string
  genres: number[]
  genre_names: string[]
  overview: string
  first_air_date: string
  vote_average: number
  vote_count: number
}

export interface ITVShowDetails extends Omit<ITVShowBase, 'genres'> {
  created_by: ITVShowCreator[]
  episode_run_time: number[]
  last_air_date: string
  networks: ITVShowNetwork[]
  number_of_episodes: number
  number_of_seasons: number
  original_language: string
  production_companies: ITVShowProductionCompany[]
  seasons: ITVShowSeason[]
  spoken_languages: ITVShowSpokenLanguage[]
  status: string
  backdrop_path: string
  genres: ITVShowGenre[]
  origin_country: string[]
  is_watchlisted_by_user: boolean
  next_episode_to_air: ITVShowEpisode
}

export interface ITVShowGenre {
  id: number
  name: string
}

export interface ITVShowCreator {
  id: number
  name: string
  profile_path: string
}

export interface ITVShowNetwork {
  id: number
  name: string
  logo_path: string
  origin_country: string
}

export interface ITVShowProductionCompany extends ITVShowNetwork {}

export interface ITVShowSeason {
  air_date: string
  episode_count: string
  id: number
  name: string
  overview: string
  poster_path: string
  season_number: number
  episodes: ITVShowEpisode[]
}

export interface ITVShowEpisode {
  id: number
  air_date: string
  season_number: number
  episode_number: number
  name: string
  overview: string
  runtime: number
  still_path: string
  vote_average: number
  vote_count: number
  marked_as_watched: boolean
  is_loading: boolean
}

export interface ITVShowSpokenLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

export interface IWatchlistWithTVShowDetails {
  tvShowId: string
  createdAt: string
  title: string
  status: string
  next_episode_to_air: ITVShowEpisode
}

export interface IMarkWatched {
  tvShowId: number
  watched: IUpdateWatchedEpisodes[]
}

export interface IUpdateWatchedEpisodes {
  season: number
  episodes: number[] | number | null
}

export interface ITVShowEpisodeForDialog {
  details: ITVShowEpisode | null
  tvShowId: number | null
  justAddedSubtitleRequestId: string | null
  justAddedSubtitleId: string | null
}
