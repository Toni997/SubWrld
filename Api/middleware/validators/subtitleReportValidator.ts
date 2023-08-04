import Joi from 'joi'

const subtitleReportValidator = Joi.object({
  reason: Joi.string().min(10).max(300).trim().strict(true).required(),
})

export { subtitleReportValidator }
