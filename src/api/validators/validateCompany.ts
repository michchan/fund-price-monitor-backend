import isValidCompany from "src/models/fundPriceRecord/utils/isValidCompany";

import createParameterErrMsg from "../helpers/createParameterErrMsg";


const validateCompany = (maybeCompany: any) => {
    if (!isValidCompany(maybeCompany)) throw new Error(createParameterErrMsg('company', 'path'));
}

export default validateCompany