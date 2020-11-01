import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'
import { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'

import getTableDetails from 'src/models/fundPriceRecord/io/getTableDetails'

export const DEFAULT_DELAY = 1000
export type Iteratee <T> = (company: CompanyType, i: number, arr: CompanyType[]) => Promise<T>
export type GetIteratee <T> = (input: T) => Iteratee<T>

const pipeByCompany = async <T = unknown> (
  getIteratee: GetIteratee<T>,
  initialInput: T,
  delay: number = DEFAULT_DELAY
): Promise<T> => {
  // Get list of companies from table-level "details" record
  const { companies } = await getTableDetails()
  // Manipulation for each company
  return pipeAsync<T>(...companies.map(
    (company, i, arr) => async (input: T = initialInput) => {
      const output = await getIteratee(input)(company, i, arr)
      if (delay > 0 && i < arr.length - 1) await wait(delay)
      return output
    }
  ))(initialInput)
}
export default pipeByCompany