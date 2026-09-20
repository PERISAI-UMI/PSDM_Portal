import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface StorageConfig {
  keyId: string;
  applicationKey: string;
  bucketName: string;
  endpoint?: string;
  region?: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

/**
 * Membuat presigned URL S3 untuk upload langsung dari browser ke Backblaze B2
 * Compatible dengan Edge Runtime (AWS SDK v3 client modular)
 */
export async function createPresignedUploadUrl(
  config: StorageConfig,
  fileName: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<PresignedUrlResult> {
  const region = config.region || 'us-east-005';
  const endpoint = config.endpoint || `https://s3.${region}.backblazeb2.com`;

  const s3 = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: config.keyId,
      secretAccessKey: config.applicationKey,
    },
    forcePathStyle: true,
  });

  const fileExtension = fileName.split('.').pop() || 'dat';
  const randomKey = crypto.randomUUID();
  const fileKey = `evidence/${Date.now()}-${randomKey}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: expiresInSeconds,
  });

  // URL publik file setelah terunggah di Backblaze B2
  const publicUrl = `${endpoint}/${config.bucketName}/${fileKey}`;

  return {
    uploadUrl,
    fileKey,
    publicUrl,
  };
}
