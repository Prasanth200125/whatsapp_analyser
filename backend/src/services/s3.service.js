// ============================================================
// s3.service.js — AWS S3 File Operations
// ============================================================
// Provides three simple operations:
//   uploadToS3(key, buffer, mimeType)  — upload a file
//   deleteFromS3(key)                  — delete a file
//   getS3SignedUrl(key, expiresInSec)  — generate a temporary download URL
// ============================================================
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Upload a file buffer to S3.
 *
 * @param {string} key         - S3 object key (e.g., "sessions/userId/sessionId.txt")
 * @param {Buffer} buffer      - File content as a Buffer
 * @param {string} contentType - MIME type (e.g., "text/plain")
 */
export async function uploadToS3(key, buffer, contentType = 'application/octet-stream') {
  if (!BUCKET) throw new Error('AWS_S3_BUCKET environment variable is not set.');

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // Private by default — only accessible via signed URLs or IAM role
    ServerSideEncryption: 'AES256',
  });

  await s3.send(command);
  console.log(`☁️  S3 upload: s3://${BUCKET}/${key}`);
}

/**
 * Delete a file from S3.
 *
 * @param {string} key - S3 object key to delete
 */
export async function deleteFromS3(key) {
  if (!BUCKET) throw new Error('AWS_S3_BUCKET environment variable is not set.');
  if (!key) return; // Nothing to delete

  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await s3.send(command);
  console.log(`🗑️  S3 delete: s3://${BUCKET}/${key}`);
}

/**
 * Generate a pre-signed URL for temporary file download.
 * Useful for debugging — never expose this in production UI.
 *
 * @param {string} key           - S3 object key
 * @param {number} expiresInSec  - URL expiry in seconds (default: 1 hour)
 * @returns {string}             - Pre-signed URL
 */
export async function getS3SignedUrl(key, expiresInSec = 3600) {
  if (!BUCKET) throw new Error('AWS_S3_BUCKET environment variable is not set.');

  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSec });
}
