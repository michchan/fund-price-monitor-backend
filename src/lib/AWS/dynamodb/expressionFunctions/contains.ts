const contains = (
  attributeName: string,
  value: string
): string => `contains (${attributeName}, ${value})`
export default contains