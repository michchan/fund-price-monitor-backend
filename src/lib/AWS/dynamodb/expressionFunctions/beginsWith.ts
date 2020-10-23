const beginsWith = (
  attributeName: string,
  value: string
): string => `begins_with (${attributeName}, ${value})`
export default beginsWith