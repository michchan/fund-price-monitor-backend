const MAX_PERCENT = 100
/**
 *
 * @param basedPrice
 * @param updatedPrice
 *
 * @returns A number in between 1-100 as percentage
 */
const calculatePriceChangeRate = (basedPrice: number, updatedPrice: number): number => {
  if (basedPrice === 0) return 0

  return ((updatedPrice - basedPrice) / basedPrice) * MAX_PERCENT
}

export default calculatePriceChangeRate