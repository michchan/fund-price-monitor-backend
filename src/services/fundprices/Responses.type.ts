import { AWSError } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

export interface ListResponse <T> {
  result: boolean;
  data?: T[];
  lastEvaluatedKey?: null | DocumentClient.QueryOutput['LastEvaluatedKey'];
  error?: Pick<AWSError, 'message' | 'code'>;
}