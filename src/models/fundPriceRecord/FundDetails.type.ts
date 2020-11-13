import { CompanyType } from './FundPriceRecord.type'

export type Languages = 'en' | 'zh_HK'

interface FundDetails {
  company: CompanyType;
  code: string;
  name: { [key in Languages]: string };
  initialPrice: number;
  launchedDate: string;
}
export default FundDetails