const fromTableRecordsS3ObjectKey = (objectKey: string): string => objectKey.split('*').shift() ?? ''
export default fromTableRecordsS3ObjectKey