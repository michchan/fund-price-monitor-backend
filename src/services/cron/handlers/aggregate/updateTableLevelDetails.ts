import { Quarter } from 'simply-utils/dateTime/getQuarter'
import uniq from 'lodash/uniq'

import { FundPriceRecord } from '@michchan/fund-price-monitor-lib'
import { Groups } from './groupEventRecordsByCompany'
import updateTableDetails from 'src/models/fundPriceRecord/io/updateTableDetails'
import attrs from 'src/models/fundPriceRecord/constants/attributeNames'
import AWS from 'src/lib/AWS'
import logObj from 'src/helpers/logObj'

const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

const EXP_COMS = ':companies'
const EXP_FUND_TYPES = ':fundTypes'

/**
 * Update table details with records
 */
const updateTableLevelDetails = async (
  groups: Groups,
  records: FundPriceRecord[],
  year: number | string,
  quarter: Quarter,
  isTest: boolean
// eslint-disable-next-line max-params
): Promise<void> => {
  // Get fund types
  const fundTypes = uniq(records.map(rec => rec.fundType))

  const tableDetails = {
    // Append values to sets
    UpdateExpression: `ADD ${[
      `${attrs.COMPANIES} ${EXP_COMS}`,
      `${attrs.FUND_TYPES} ${EXP_FUND_TYPES}`,
    ].join(',')}`,
    ExpressionAttributeValues: {
      [EXP_COMS]: docClient.createSet(Object.keys(groups)),
      [EXP_FUND_TYPES]: docClient.createSet(fundTypes),
    },
  }
  // Update table details with companies and fund types
  if (isTest) {
    logObj('updateTableLevelDetails.tableDetails: ', tableDetails)
    return
  }
  await updateTableDetails(tableDetails, year, quarter)
}
export default updateTableLevelDetails