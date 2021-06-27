import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import composeParameterErrMsg from '../helpers/composeParameterErrMsg'
import forEach from 'lodash/forEach'

/**
 * Validate 'key' of dynamodb document client
 *
 * Reference: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html
 *
 * @param exclusiveStartKey
 */
const validateKey = (key: DocumentClient.Key, fieldName: string): void => {
  if (typeof key !== 'object') throw new Error(composeParameterErrMsg(fieldName, 'query', 'invalid'))

  forEach(key, value => {
    if (value && !/^[a-z0-9_\-\.]{3,255}$/i.test(`${value}`))
      throw new Error(composeParameterErrMsg(fieldName, 'query', 'invalidKeyFormat'))
  })
}

export default validateKey