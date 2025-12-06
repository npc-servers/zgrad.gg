/**
 * Cloudflare R2 Storage Module
 * Uses AWS S3-compatible API to interact with R2
 */

import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

let s3Client = null;

/**
 * Initialize the R2 client
 */
function getClient() {
  if (s3Client) return s3Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn('R2 not configured - using local storage fallback');
    return null;
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3Client;
}

/**
 * Check if R2 is configured
 */
export function isR2Configured() {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

/**
 * Get the public URL for an R2 object
 */
export function getPublicUrl(key) {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }
  // Fallback to local path if no public URL configured
  return `/images/${key}`;
}

/**
 * Upload a file to R2
 * @param {string} key - Object key (path in bucket)
 * @param {Buffer} body - File content
 * @param {string} contentType - MIME type
 * @param {Object} metadata - Custom metadata
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadToR2(key, body, contentType, metadata = {}) {
  const client = getClient();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!client || !bucketName) {
    return { success: false, error: 'R2 not configured' };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    });

    await client.send(command);

    return {
      success: true,
      url: getPublicUrl(key),
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if an object exists in R2
 * @param {string} key - Object key
 * @returns {Promise<boolean>}
 */
export async function existsInR2(key) {
  const client = getClient();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!client || !bucketName) {
    return false;
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.error('R2 head error:', error);
    return false;
  }
}

/**
 * Get an object from R2
 * @param {string} key - Object key
 * @returns {Promise<{body: ReadableStream, contentType: string}|null>}
 */
export async function getFromR2(key) {
  const client = getClient();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!client || !bucketName) {
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await client.send(command);

    return {
      body: response.Body,
      contentType: response.ContentType,
      etag: response.ETag,
    };
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    console.error('R2 get error:', error);
    return null;
  }
}

