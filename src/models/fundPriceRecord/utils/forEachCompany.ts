import pipeByCompany, {
  DEFAULT_DELAY,
  Iteratee,
} from './pipeByCompany'

const forEachCompany = async <T = unknown> (
  iteratee: Iteratee<T>,
  delay: number = DEFAULT_DELAY
): Promise<void> => {
  await pipeByCompany(() => iteratee, undefined, delay)
}
export default forEachCompany