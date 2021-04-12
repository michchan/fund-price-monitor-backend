import getParameter from 'src/lib/AWS/parameterStore/getParameter'
import getEnvVars from './getEnvVar'

/* Get the telegram notification channel chat ID passed from
  the environment variables defined in CDK construct of cron,
  To map as dynamodb stream target function */
const chatId = getEnvVars('TELEGRAM_CHAT_ID')
// Get the parameter name (in AWS parameter store) of telegram bot API key
const apiKeyParamName = getEnvVars('TELEGRAM_BOT_API_KEY_PARAMETER_NAME')

export interface Output {
  chatId: string;
  apiKey: string;
}

const getTelegramApiCredentials = async (): Promise<Output> => {
  // Get telegram bot API key (secure string) from the SSM parameter store in runtime
  const parameterOutput = await getParameter({
    Name: apiKeyParamName,
    WithDecryption: true,
  })
  // The API Key retrieved
  const apiKey = parameterOutput.Parameter?.Value
  if (!apiKey) throw new Error(`apiKey is undefined: ${apiKey}`)

  return {
    chatId,
    apiKey,
  }
}

export default getTelegramApiCredentials