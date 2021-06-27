import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import composeParameterErrMsg from '../helpers/composeParameterErrMsg'
import forEach from 'lodash/forEach'
import createParameterError from '../helpers/createParameterError'

/**
 * Validate 'key' of dynamodb document client
 *
 * Reference: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html
 *
 * @param exclusiveStartKey
 */
const validateKey = (key: DocumentClient.Key, fieldName: string): void => {
  if (typeof key !== 'object')
    throw createParameterError(composeParameterErrMsg(fieldName, 'query', 'invalid'))

  forEach(key, value => {
    if (value && !/^[a-z0-9_\-\.]{3,255}$/i.test(`${value}`))
      throw createParameterError(composeParameterErrMsg(fieldName, 'query', 'invalidKeyFormat'))
  })
}

export default validateKey