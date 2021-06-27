import statusCodes from 'http-status-codes'
import AWS from 'src/lib/AWS'

const createParameterError = (
  message: string,
  statusCode: number = statusCodes.BAD_REQUEST
): AWS.AWSError => {
  const err = new Error(message) as AWS.AWSError
  err.statusCode = statusCode
  return err
}

export default createParameterError