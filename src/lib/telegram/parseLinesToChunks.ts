import { MAX_LENGTH } from './constants'

/**
 * Parse lines of text to chunks of messages according to the max length of a telegram message
 */
const parseLinesToChunks = (lines: string[]): string[] => lines.reduce((chunks: string[], line) => {
  const rest = [...chunks]
  const chunk = rest.pop() ?? ''
  const testChunk = [chunk, line].join('\n')

  if (testChunk.length > MAX_LENGTH) return [...rest, chunk, line]

  return [...rest, testChunk]
}, [])

export default parseLinesToChunks