import { languages } from 'countries-list'
import Joi from '@hapi/joi'

const subtitleValidator = Joi.object({
  tvShowId: Joi.number().integer().positive().required(),
  season: Joi.number().integer().min(0).required(),
  episode: Joi.number().integer().positive().required(),
  language: Joi.string()
    .length(2)
    .custom((value, helpers) => {
      if (!languages.hasOwnProperty(value)) {
        return helpers.error('language.invalid')
      }
      return value
    }, 'validate language code')
    .message('language is not a valid language code')
    .required(),
  frameRate: Joi.number().precision(3).min(23.976).max(60).required(),
  forHearingImpaired: Joi.boolean().required(),
  release: Joi.string()
    .max(50)
    .trim()
    .strict()
    .min(3)
    .regex(/^(?![-.])(?!.*--)(?!.*\.\.)(?!.*[-.]$)[a-zA-Z0-9.-]+$/)
    .message(
      'release can only contain letters, numbers, - and . (no consecutive - or . nor at the beginning or end)'
    )
    .required(),
  subtitleRequestId: Joi.string().allow(null),
  isWorkInProgress: Joi.boolean().required(),
  onlyForeignLanguage: Joi.boolean().required(),
  uploaderIsAuthor: Joi.boolean().required(),
})

export { subtitleValidator }
