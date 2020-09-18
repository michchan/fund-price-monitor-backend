import { AWSError } from "aws-sdk";


export interface ListResponse <T> {
    result: boolean;
    data?: T[];
    error?: AWSError;
}
