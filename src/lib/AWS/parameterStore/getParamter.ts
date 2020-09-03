import AWS from 'src/lib/AWS'



const ssm = new AWS.SSM();


const getParamter = (input: AWS.SSM.GetParameterRequest): Promise<AWS.SSM.GetParameterResult> => {
    return ssm.getParameter(input).promise();
}

export default getParamter