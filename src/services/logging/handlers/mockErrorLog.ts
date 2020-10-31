import { Handler } from 'aws-lambda'

export interface Event {
  level: 'info' | 'warn' | 'error' | 'fatal';
}

/**
 * Mock errors logs created by any lambda
 *
 * Reference: https://aws.amazon.com/blogs/mt/get-notified-specific-lambda-function-error-patterns-using-cloudwatch/
 */
export const handler: Handler<Event> = event => {
  switch (event.level) {
    case 'info': console.log('Test info'); break
    case 'warn': console.warn('Test warning'); break
    case 'error': console.error('Test error'); break
    case 'fatal':
    default:
      throw new Error('Test fatal error')
  }
}