import getParameter from "src/lib/AWS/parameterStore/getParameter"



export interface Result {
  chatId: string
  apiKey: string
}

const getTelegramApiCredentials = async (): Promise<Result> => {
  // Get the telegram notification channel chat ID passed from the environment variables defined in CDK construct of cron,
  // to map as dynamodb stream target function
  const chatId = process.env.TELEGRAM_CHAT_ID as string
  // Get the parameter name (in AWS parameter store) of telegram bot API key
  const apiKeyParamName = process.env.TELEGRAM_BOT_API_KEY_PARAMETER_NAME as string

  // Validate environment
  if (!chatId) throw new Error(`TELEGRAM_CHAT_ID is required in environment but got undefined.`)
  if (!apiKeyParamName) throw new Error(`TELEGRAM_BOT_API_KEY_PARAMETER_NAME is required in environment but got undefined.`)

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
