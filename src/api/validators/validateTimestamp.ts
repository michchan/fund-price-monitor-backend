import isISOTimestamp from "simply-utils/dist/dateTime/isISOTimestamp";

import createParameterErrMsg from "../helpers/createParameterErrMsg";


const validateTimestamp = (
    maybeTimestamp: any,
    fieldName: string,
) => {
    if (!isISOTimestamp(maybeTimestamp)) throw new Error(createParameterErrMsg(fieldName, 'query'));
}

export default validateTimestamp