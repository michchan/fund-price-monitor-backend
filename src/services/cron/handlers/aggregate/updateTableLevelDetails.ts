import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'
import uniq from 'lodash/uniq'

import { FundPriceRecord } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import { Groups } from './groupEventRecordsByCompany'
import updateTableDetails from 'src/models/fundPriceRecord/io/updateTableDetails'
import attrs from 'src/models/fundPriceRecord/constants/attributeNames'
import AWS from 'src/lib/AWS'

const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

const EXP_COMS = ':companies'
const EXP_FUND_TYPES = ':fundTYpes'

/**
 * Update table details with records
 */
const updateTableLevelDetails = async (
  groups: Groups,
  records: FundPriceRecord[],
  year: number | string,
  quarter: Quarter,
) => {
  // Get fund types
  const fundTypes = uniq(records.map(rec => rec.fundType))
  // Update table details with companies and fund types
  await updateTableDetails({
    // Append values to sets
    UpdateExpression: `ADD ${[
      `${attrs.COMPANIES} ${EXP_COMS}`,
      `${attrs.FUND_TYPES} ${EXP_FUND_TYPES}`,
    ].join(',')}`,
    ExpressionAttributeValues: {
      [EXP_COMS]: docClient.createSet(Object.keys(groups)),
      [EXP_FUND_TYPES]: docClient.createSet(fundTypes),
    },
  }, year, quarter)
}
export default updateTableLevelDetails