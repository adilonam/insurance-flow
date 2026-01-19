import { S3Client } from "@aws-sdk/client-s3";

// S3 client configuration that works with both MinIO (dev) and AWS S3 (prod)
export function getS3Client() {
  const isMinIO = process.env.S3_ENDPOINT && !process.env.S3_ENDPOINT.includes("amazonaws.com");

  const clientConfig: any = {
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
    },
  };

  // For MinIO, we need to set the endpoint and disable SSL verification
  if (isMinIO) {
    clientConfig.endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
    clientConfig.forcePathStyle = true; // Required for MinIO
    clientConfig.tls = false;
  }

  return new S3Client(clientConfig);
}

export function getS3Bucket(): string {
  return process.env.S3_BUCKET_NAME || "insurance";
}
