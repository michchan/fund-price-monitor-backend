const DEFAULT_TAB_SIZE = 2

function stringify <T extends { [key: string]: any }> (
  payload: T,
  tabSize: number = DEFAULT_TAB_SIZE,
): string {
  return JSON.stringify(payload, null, tabSize)
}
export default stringify