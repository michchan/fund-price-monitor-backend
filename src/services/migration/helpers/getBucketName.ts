import getEnvVar from 'simply-utils/utils/getEnvVar'

const getBucketName = (): string => getEnvVar('BUCKET_NAME')
export default getBucketName