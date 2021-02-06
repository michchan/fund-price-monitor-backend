import topLevelKeysValues from "../constants/topLevelKeysValues"

const createTableDetailsSK = (time?: string): string => [
  topLevelKeysValues.TABLE_DETAILS_SK,
  time || new Date().toISOString(),
].join('@')
export default createTableDetailsSK