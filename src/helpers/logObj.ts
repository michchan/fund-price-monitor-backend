import stringify from './stringify'

function logObj <T extends { [key: string]: any }> (
  title: string,
  payload: T,
): void {
  console.log(title, stringify(payload))
}
export default logObj