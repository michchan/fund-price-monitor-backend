import getQuarter, { Quarter } from "simply-utils/dist/dateTime/getQuarter"


const getCurrentYearAndQuarter = (): [number, Quarter] => {
  const date = new Date()
  const currentYear = date.getFullYear()
  const currentQuarter = getQuarter(date)
  return [currentYear, currentQuarter]
}
export default getCurrentYearAndQuarter