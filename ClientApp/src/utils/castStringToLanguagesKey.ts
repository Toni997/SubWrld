import { languages } from 'countries-list'

export const castStringToLanguagesKey = (key: string) => {
  return key as keyof typeof languages
}
