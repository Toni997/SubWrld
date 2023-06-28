import Joi from 'joi'

const removeFromWatchlistValidator = Joi.object({
  tvShowIds: Joi.array().min(1).items(Joi.number().positive()).required(),
})

export { removeFromWatchlistValidator }
