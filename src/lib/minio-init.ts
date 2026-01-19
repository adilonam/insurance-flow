// Utility to initialize MinIO bucket if it doesn't exist
// This can be called on app startup in development

import { getS3Client, getS3Bucket } from "./s3";
import { CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

export async function ensureBucketExists() {
  try {
    const s3Client = getS3Client();
    const bucket = getS3Bucket();

    // Check if bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log(`Bucket "${bucket}" already exists`);
      return;
    } catch (error: any) {
      // Bucket doesn't exist, create it
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        await s3Client.send(
          new CreateBucketCommand({
            Bucket: bucket,
          }),
        );
        console.log(`Bucket "${bucket}" created successfully`);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Error ensuring bucket exists:", error);
    // Don't throw - app can still run, bucket might be created manually
  }
}
