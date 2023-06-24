import Joi from 'joi'

const markWatchedValidator = Joi.object({
  tvShowId: Joi.number().positive().required(),
  watched: Joi.array().min(1).required(),
})

const markWatchedEpisodesValidator = Joi.object({
  season: Joi.number().integer().min(0).required(),
  episodes: Joi.alternatives()
    .try(
      Joi.number().integer().positive().allow(null),
      Joi.array()
        .length(2)
        .ordered(
          Joi.number().integer().positive(),
          Joi.number()
            .integer()
            .positive()
            .greater(Joi.ref('0'))
            .message(
              'Second value should be greater than first in episodes range'
            )
        )
    )
    .required(),
})

export { markWatchedValidator, markWatchedEpisodesValidator }
