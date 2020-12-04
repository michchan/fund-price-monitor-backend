import stringify from './stringify'

function logObj <T extends { [key: string]: any }> (
  title: string,
  payload: T,
): void {
  // Auto append number of items suffix for array
  const sfx = Array.isArray(payload) ? ` (${payload.length})` : ''
  console.log(`${title}${sfx}`, stringify(payload))
}
export default logObj