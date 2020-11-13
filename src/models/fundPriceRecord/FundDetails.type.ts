import { CompanyType } from './FundPriceRecord.type'

export type Locales = 'en' | 'zh_HK'

interface FundDetails {
  company: CompanyType;
  code: string;
  name: { [key in Locales]: string };
  initialPrice: number;
  launchedDate: string;
}
export default FundDetails