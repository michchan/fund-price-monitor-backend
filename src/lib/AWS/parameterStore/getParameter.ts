import AWS from 'src/lib/AWS'

const ssm = new AWS.SSM()

function getParameter (input: AWS.SSM.GetParameterRequest): Promise<AWS.SSM.GetParameterResult> {
  return ssm.getParameter(input).promise()
}

export default getParameter