import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'
import { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'

import getTableDetails from 'src/models/fundPriceRecord/io/getTableDetails'

const DEFAULT_DELAY = 1000
export type Iteratee <T> = (company: CompanyType, i: number, arr: CompanyType[]) => Promise<T>

const forEachCompany = async <T = unknown> (
  iteratee: Iteratee<T>,
  delay: number = DEFAULT_DELAY
): Promise<void> => {
  // Get list of companies from table-level "details" record
  const { companies } = await getTableDetails()
  // Manipulation for each company
  await pipeAsync(...companies.map(
    (company, i, arr) => async () => {
      await iteratee(company, i, arr)
      if (delay > 0 && i < arr.length - 1) await wait(delay)
    }
  ))()
}
export default forEachCompany