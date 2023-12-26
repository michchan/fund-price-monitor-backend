import { Quarter } from 'simply-utils/dateTime/getQuarter'

interface TableRange {
  // YYYY
  year: string | number;
  quarter: Quarter;
}
export default TableRange