import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance } from 'axios'

export class ApiEndpoints {
  static baseUrl = 'http://localhost:3000'
  static loginPath = '/users/login'
  static signupPath = '/users/signup'
  static getPopularTVShowsPath = '/tv-shows/popular'
  static searchTVShowsPath = '/tv-shows/search?keyword='
  static getTVShowDetailsPath = (tvShowId: string) => `/tv-shows/${tvShowId}`
  static getTVShowSeasonDetailsPath = (
    tvShowId: string | number,
    season: string | number
  ) => `/tv-shows/${tvShowId}/season/${season}`
  static checkWatchlistedByUser = (tvShowId: string) =>
    `/users/watchlisted/${tvShowId}`
  static addToWatchlist = (tvShowId: string | number) =>
    `/users/watchlist/${tvShowId}`
  static removeFromWatchlist = '/users/watchlist'
  static checkEpisodeMarkedAsWatched = (tvShowId: string | number) =>
    `/users/watched/${tvShowId}`
  static markEpisodeWatched = '/users/mark-watched'
  static removeEpisodeFromWatched = (episodeId: string | number) =>
    `/users/mark-unwatched/${episodeId}`
  static getWatchlistedTVShows = '/users/watchlist'
  static addSubtitleRequest = '/subtitles/requests'
  static getSubtitleRequests = (episodeId: string | number) =>
    `/subtitles/requests/${episodeId}`
  static deleteSubtitleRequest = (episodeId: string | number) =>
    `/subtitles/requests/${episodeId}`
  static setDarkMode = '/users/set-dark-mode'
  static addSubtitle = '/subtitles'
  static editSubtitle = (subtitleId: string | number) =>
    `/subtitles/${subtitleId}`
  static getSubtitles = (episodeId: string | number) =>
    `/subtitles/${episodeId}`
  static deleteSubtitle = (episodeId: string | number) =>
    `/subtitles/${episodeId}`
  static downloadSubtitle = (subtitleId: string | number) =>
    this.baseUrl + `/subtitles/download/${subtitleId}`
  static thankForSubtitle = (subtitleId: string | number) =>
    `/subtitles/thanks/${subtitleId}`
  static confirmSubtitle = (subtitleId: string | number) =>
    `/subtitles/confirm/${subtitleId}`
  static reportSubtitle = (subtitleId: string | number) =>
    `/subtitles/report/${subtitleId}`
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ baseURL: ApiEndpoints.baseUrl })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

export { api }
