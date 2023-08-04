import Joi from 'joi'

const announcementCreateValidator = Joi.object({
  tvShowId: Joi.number().positive().required(),
  text: Joi.string().min(10).max(500).trim().strict(true).required(),
})

const announcementUpdateValidator = Joi.object({
  text: Joi.string().min(10).max(500).trim().strict(true).required(),
})

export { announcementCreateValidator, announcementUpdateValidator }
