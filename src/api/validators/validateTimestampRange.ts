import getQuarter from "simply-utils/dist/dateTime/getQuarter"
import createParameterErrMsg from "../helpers/createParameterErrMsg"


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
    const startQuarter = getQuarter(new Date(startTime))
    const endQuarter = getQuarter(new Date(endTime))

    if (startQuarter !== endQuarter) {
        throw new Error(createParameterErrMsg(`startTime', 'endTime`, 'query', 'custom', `must be within a certain quarter`))
    }
}

export default validateTimestampRange