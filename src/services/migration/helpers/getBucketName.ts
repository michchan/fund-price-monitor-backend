import getEnvVar from 'simply-utils/dist/utils/getEnvVar'

const getBucketName = (): string => getEnvVar('BUCKET_NAME')
export default getBucketName