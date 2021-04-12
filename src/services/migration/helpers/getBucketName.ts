import getEnvVars from 'src/helpers/getEnvVar'

const getBucketName = (): string => getEnvVars('BUCKET_NAME')
export default getBucketName