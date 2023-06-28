import { languages } from 'countries-list'
import Joi from 'joi'

const subtitleRequestValidator = Joi.object({
  tvShowId: Joi.number().integer().positive().required(),
  season: Joi.number().integer().min(0).required(),
  episode: Joi.number().integer().positive().required(),
  preferredLanguage: Joi.string()
    .length(2)
    .custom((value, helpers) => {
      if (!languages.hasOwnProperty(value)) {
        return helpers.error('preferredLanguage.invalid')
      }
      return value
    }, 'validate language code')
    .message('preferredLanguage is not a valid language code')
    .required(),
  preferredFrameRate: Joi.number().precision(3).min(23.976).max(60).allow(null),
  preferForHearingImpaired: Joi.boolean().required(),
  comment: Joi.string().max(100).allow(null),
})

export { subtitleRequestValidator }
