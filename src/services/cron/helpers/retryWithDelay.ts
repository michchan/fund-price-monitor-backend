import retry from 'simply-utils/async/retry'
import logObj from 'src/helpers/logObj'

const DEFAULT_RETRY_TIME = 10
const DEFAULT_DELAY = 500

function retryWithDelay <T = unknown> (
  callback: () => Promise<T>,
  logScope: string,
): Promise<T | void> {
  return retry<T>(callback, DEFAULT_RETRY_TIME, DEFAULT_DELAY)
    .catch(err => {
      logObj(`ERROR at retryWithDelay (${logScope}): `, err)
    })
}
export default retryWithDelay