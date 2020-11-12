export type Locales = 'en' | 'zh_HK'

interface FundDetails {
  name: { [key in Locales]: string };
  initialPrice: number;
  launchedDate: string;
}
export default FundDetails