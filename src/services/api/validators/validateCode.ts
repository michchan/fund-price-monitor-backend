import createParameterErrMsg from "../helpers/createParameterErrMsg"


const validateCode = (maybeCode: any) => {
    if (!/^[a-z0-9_\-\.]+$/i.test(maybeCode)) throw new Error(createParameterErrMsg('code', 'path'))
}

export default validateCode