import dotenv from 'dotenv'
dotenv.config()

const baseUrl = 'https://api.themoviedb.org/3'
const TMBD_API_KEY = process.env.TMDB_API
console.log(TMBD_API_KEY)
export const getSearchTVShowUrl = (keyword: string) =>
  `${baseUrl}/search/tv?api_key=${TMBD_API_KEY}&language=en-US&page=1&include_adult=false&query=${keyword}`

export const genresUrl = `${baseUrl}/genre/tv/list?api_key=${TMBD_API_KEY}&language=en-US`
export const popularTVShowsUrl = `${baseUrl}/tv/popular?api_key=${TMBD_API_KEY}&language=en-US`
