import zeroPadding from "simply-utils/dist/number/zeroPadding";
import getWeekOfYear from "simply-utils/dist/dateTime/getWeekOfYear";
import getQuarter, { Quarter } from "simply-utils/dist/dateTime/getQuarter";


export interface Result {
    /** YYYY */
    year: number;
    /** MM */
    month: string;
    /** Start from 1 */
    week: number;
    /** Start from 1 */
    quarter: Quarter;
}

const getDateTimeDictionary = (date: Date): Result => {
    // Get year
    const year = date.getFullYear();
    // Get month
    const month = zeroPadding(date.getMonth() + 1, 2);
    // Get week
    const week = getWeekOfYear(date);
    // Get quarter
    const quarter = getQuarter(date);

    return {
        year,
        month,
        week,
        quarter,
    }
}

export default getDateTimeDictionary