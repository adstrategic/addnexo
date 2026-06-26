import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION ?? "us-east-1";
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Validate required environment variables
if (!bucketName) {
  throw new Error(
    "AWS_S3_BUCKET_NAME environment variable is required. Please set it in your .env file. See AWS_SETUP.md for instructions.",
  );
}

if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables are required. Please set them in your .env file. See AWS_SETUP.md for instructions.",
  );
}

// Create S3 client
export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const S3_BUCKET_NAME = bucketName;
export const AWS_REGION = region;
