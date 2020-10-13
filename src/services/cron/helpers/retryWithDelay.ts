import retry from 'simply-utils/dist/async/retry'


const DEFAULT_RETRY_TIME = 10
const DEFAULT_DELAY = 500

function retryWithDelay <T = unknown> (
    callback: () => Promise<T>,
    logScope: string,
): Promise<T | void> {
    return retry<T>(callback, DEFAULT_RETRY_TIME, DEFAULT_DELAY)
        .catch(err => {
            console.log(`ERROR at retryWithDelay (${logScope}): `, JSON.stringify(err, null, 2))
        })
}
export default retryWithDelay