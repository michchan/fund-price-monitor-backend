const REGEX = /^\d{4}-((0[1-9])|(1[0-2]))-((0[1-9])|([1-2][0-9])|(3[0-1]))$/i

const isValidDate = (maybeDate: string): boolean => REGEX.test(maybeDate)
export default isValidDate