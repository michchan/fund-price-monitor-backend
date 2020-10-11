import createParameterErrMsg from "../helpers/createParameterErrMsg"
import getDateTimeDictionary from "src/helpers/getDateTimeDictionary"


/**
 * startTime and endTime must be within a certain quarter
 * 
 * @param startTime 
 * @param endTime 
 */
const validateTimestampRange = (
    startTime: string,
    endTime: string,
) => {
    const start = getDateTimeDictionary(new Date(startTime))
    const end = getDateTimeDictionary(new Date(endTime))

    const startQuarterAbsolute = `${start.year}.${start.quarter}`
    const endQuarterAbsolute = `${end.year}.${end.quarter}`

    if (startQuarterAbsolute !== endQuarterAbsolute) {
        throw new Error(createParameterErrMsg(`startTime', 'endTime`, 'query', 'custom', `must be within a certain quarter`))
    }
}

export default validateTimestampRange