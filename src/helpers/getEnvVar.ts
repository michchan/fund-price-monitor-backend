const getEnvVars = (
  name: string,
  isMandatory: boolean = true
): string => {
  const value = process.env[name]
  if (isMandatory && value === undefined)
    throw new Error(`${name} is required in environment but got undefined.`)
  return value as string
}
export default getEnvVars