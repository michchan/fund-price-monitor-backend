import fundPriceRecord from "src/models/fundPriceRecord";
import { CompanyType } from "src/models/fundPriceRecord/FundPriceRecord.type";
import getDateTimeDictionary from "src/helpers/getDateTimeDictionary";



export type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'quarterly'

const notifyCompanyRecordsByTelegram = async (
    chatId: string,
    apiKey: string,
    company: CompanyType,
    scheduleType: ScheduleType,
) => {
    // Create date of latest item
    const date = new Date();
    
    /** -------- Query records  -------- */
    
    // query records to be sent in notification
    const queryOutput = await ((scheduleType: ScheduleType) => {
        switch (scheduleType) {
            case 'quarterly':
                return fundPriceRecord.queryPeriodPriceChangeRate(company, 'quarter', fundPriceRecord.getPeriodByRecordType('quarter', date));
            case 'monthly':
                return fundPriceRecord.queryPeriodPriceChangeRate(company, 'month', fundPriceRecord.getPeriodByRecordType('month', date));
            case 'weekly':
                return fundPriceRecord.queryPeriodPriceChangeRate(company, 'week', fundPriceRecord.getPeriodByRecordType('week', date));
            case 'daily':
            default:
                return fundPriceRecord.queryLatestItemsByCompany(company);
        }
    })(scheduleType);

    // Parse items
    const items = (queryOutput.Items || []).map(item => {
        switch (scheduleType) {
            case 'quarterly':
            case 'monthly':
            case 'weekly':
                return fundPriceRecord.parseChangeRate(item);
            case 'daily':
            default:
                return fundPriceRecord.parse(item);
        }
    });
    
    // Abort if no items found
    if (items.length === 0) {
        console.log('No items found');
        return 
    }
    
    console.log(`CREDENTIALS: ${JSON.stringify({ chatId, apiKey }, null, 2)}`);
    console.log(JSON.stringify(queryOutput, null, 2));
       
}

export default notifyCompanyRecordsByTelegram