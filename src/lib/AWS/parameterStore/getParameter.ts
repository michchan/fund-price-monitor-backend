import AWS from 'src/lib/AWS'

const ssm = new AWS.SSM()

const getParameter = (input: AWS.SSM.GetParameterRequest): Promise<AWS.SSM.GetParameterResult> => ssm.getParameter(input).promise()

export default getParameter