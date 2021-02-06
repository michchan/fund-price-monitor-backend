import { AWSError } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

export interface ListSuccessResponse <T> {
  result: true;
  data: T[];
  lastEvaluatedKey: null | DocumentClient.QueryOutput['LastEvaluatedKey'];
}

export interface ListErrorResponse {
  result: false;
  error: Pick<AWSError, 'message' | 'code'>;
}

export type ListResponse <T> = ListSuccessResponse<T> | ListErrorResponse