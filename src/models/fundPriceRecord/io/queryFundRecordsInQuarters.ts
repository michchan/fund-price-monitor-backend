/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CompanyType, FundPriceRecord, ListSingleFundRecordsTenor } from '@michchan/fund-price-monitor-lib'
import dayjs from 'dayjs'
import getQuarter from 'simply-utils/dateTime/getQuarter'
import { listQuarters } from './listQuarters'
import querySingleFundRecords, { TVariants, Output } from './querySingleFundRecords'

type TenorWithDateDiff = Exclude<ListSingleFundRecordsTenor,
ListSingleFundRecordsTenor.all |
ListSingleFundRecordsTenor.latest
>

const tenorDateDiffMap: Record<TenorWithDateDiff, [number, dayjs.ManipulateType]> = {
  '1m': [-1, 'months'],
  '6m': [-6, 'months'],
  '1y': [-1, 'year'],
  '3y': [-3, 'years'],
  '5y': [-5, 'years'],
}

const getStartDateByTenor = (tenor: TenorWithDateDiff): Date => {
  const dayDiffArgs = tenorDateDiffMap[tenor]
  return dayjs().add(...dayDiffArgs)
    .toDate()
}

export const queryFundRecordsInQuarters = async <T extends TVariants = FundPriceRecord> (
  company: CompanyType,
  code: FundPriceRecord['code'],
  tenor: ListSingleFundRecordsTenor
): Promise<Output<T>> => {
  if (tenor === ListSingleFundRecordsTenor.latest)
    return querySingleFundRecords(company, code, { shouldQueryLatest: true })

  // Assume it is sorted chronologically in ascending order
  const quarters = await listQuarters()

  let selectedQuarters = quarters
  let inclusiveStartDate: Date | undefined

  if (tenor !== ListSingleFundRecordsTenor.all) {
    inclusiveStartDate = getStartDateByTenor(tenor)
    const startYear = inclusiveStartDate.getFullYear()
    const startQuarter = getQuarter(inclusiveStartDate)

    selectedQuarters = quarters.filter(eachQuarter => {
      const [year, quarter] = eachQuarter.split('.')
      return (
        Number(year) > startYear
        || (Number(year) === startYear && Number(quarter) >= startQuarter)
      )
    })
  }

  const startTime = inclusiveStartDate?.toISOString()

  const result = await Promise.all(selectedQuarters.map(quarter => querySingleFundRecords(
    company,
    code,
    {
      shouldQueryAll: true,
      startTime,
      quarter,
    }
  )))
  return result.reduce((acc, eachResult) => {
    const parsedItems = [...acc.parsedItems, ...eachResult.parsedItems]
    return { ...acc,
      parsedItems,
      Count: (acc.Count ?? 0) + (eachResult.Count ?? 0),
      LastEvaluatedKey: eachResult.LastEvaluatedKey } as Output<T>
  }, {
    parsedItems: [],
    Count: 0,
    LastEvaluatedKey: undefined,
  } as Output<T>) as Output<T>
}