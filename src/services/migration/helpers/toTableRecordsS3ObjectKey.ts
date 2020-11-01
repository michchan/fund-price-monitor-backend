const toTableRecordsS3ObjectKey = (
  tableName: string
): string => `${tableName}/${new Date().getTime()}`
export default toTableRecordsS3ObjectKey