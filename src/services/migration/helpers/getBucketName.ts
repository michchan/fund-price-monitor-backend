const getBucketName = (): string => {
  const bucketName = process.env.BUCKET_NAME
  if (!bucketName) throw new Error('Environment variable BUCKET_NAME undefined')
  return bucketName
}
export default getBucketName