const between = (
  attributeName: string,
  a: string,
  b: string
): string => `${attributeName} BETWEEN ${a} AND ${b}`
export default between