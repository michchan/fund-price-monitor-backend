const toTableRecordsS3ObjectKey = (
  tableName: string
): string => `${tableName}*${new Date().getTime()}.json`
export default toTableRecordsS3ObjectKey