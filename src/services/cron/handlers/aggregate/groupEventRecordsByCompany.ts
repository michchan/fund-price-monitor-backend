import { DynamoDBStreamEvent } from 'aws-lambda'
import omitBy from 'lodash/omitBy'
import isEmpty from 'lodash/isEmpty'

import { CompanyType, FundPriceRecord, FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import AWS from 'src/lib/AWS'
import attrs from 'src/models/fundPriceRecord/constants/attributeNames'
import parse from 'src/models/fundPriceRecord/utils/parse'

type T = FundPriceRecord<FundType, 'record'>
export type Groups = { [company in CompanyType]: T[] }
/**
 * Process event records
 */
const groupEventRecordsByCompany = (event: DynamoDBStreamEvent): [Groups, T[]] => {
  // Map and normalize items
  const records: T[] = event.Records
    // Filter inserted records and records with `NewImage` defined
    .filter(record => (
      // If it is an insert event
      record.eventName === 'INSERT'
      // And it is a "record"
      && /^record/i.test(
        AWS.DynamoDB.Converter.unmarshall(record.dynamodb?.NewImage || {})[attrs.TIME_SK] ?? ''
      )
    ))
    .map(record => parse(AWS.DynamoDB.Converter.unmarshall(
      record.dynamodb?.NewImage as unknown as AWS.DynamoDB.AttributeMap
    )))

  // Group items by company
  const groups = records
    .reduce((_acc, record) => {
      const acc = _acc as Groups
      const { company } = record
      return {
        ...acc,
        [company]: [
          ...acc[company] ?? [],
          record,
        ],
      }
    }, {}) as Groups
  const groupsWithoutEmpty = omitBy(groups, isEmpty) as Groups

  // Filter empty groups
  return [groupsWithoutEmpty, records]
}
export default groupEventRecordsByCompany