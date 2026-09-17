import { aws, cloudflare } from "@better-upload/server/clients";

// STORAGE_PROVIDER=s3 selects AWS S3 for self-hosted instances; R2 stays the default.
export const s3Client =
  process.env.STORAGE_PROVIDER === "s3"
    ? aws({
        region: process.env.STORAGE_REGION!,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      })
    : cloudflare({
        accountId: process.env.R2_ACCOUNT_ID!,
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      });
