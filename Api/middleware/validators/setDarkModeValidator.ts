import Joi from 'joi'

const setDarkModeValidator = Joi.object({
  darkMode: Joi.boolean().required(),
})

export { setDarkModeValidator }
