const trueStringified = 'true'

export const convertStringifiedBoolean = (val: string) =>
  val.toLowerCase() === trueStringified
