import createParameterErrMsg from "../helpers/createParameterErrMsg";


const validateYearQuarter = (
    maybeYearQuarter: any,
    name: string,
) => {
    if (!/^([0-9]{4})\.[1-4]$/.test(maybeYearQuarter)) throw new Error(createParameterErrMsg(name, 'query'));
}

export default validateYearQuarter