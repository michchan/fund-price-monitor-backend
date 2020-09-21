import createParameterErrMsg from "../helpers/createParameterErrMsg";



export type PeriodType = 'week' | 'month' | 'quarter'

const validatePeriod = (
    maybePeriod: any,
    type: PeriodType
) => {
    const throwErr = () => { throw new Error(createParameterErrMsg('period', 'path')) }

    switch (type) {
        case 'week':
            if (!/^[0-9]{4}-((0[0-9])|(1[1-2]))\.[0-9]+$/.test(maybePeriod)) throwErr()
            break;
        case 'month': 
            if (!/^[0-9]{4}-((0[0-9])|(1[1-2]))$/.test(maybePeriod)) throwErr()
            break;
        case 'quarter':
            if (!/^[0-9]{4}\.[1-4]$/.test(maybePeriod)) throwErr()
            break;
        default:
            break;
    }
}

export default validatePeriod