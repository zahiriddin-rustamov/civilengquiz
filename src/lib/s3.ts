import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME as string;

// Generate a random filename with a given extension
export const generateFileName = (fileExtension: string): string => {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${randomBytes}.${fileExtension}`;
};

// Get file extension from filename or content type
export const getFileExtension = (fileName: string, contentType?: string): string => {
  if (fileName.includes('.')) {
    return fileName.split('.').pop() as string;
  }
  
  // If no extension in filename, try to get it from content type
  if (contentType) {
    const mapping: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
      'video/mp4': 'mp4',
      'audio/mpeg': 'mp3',
    };
    
    return mapping[contentType] || 'bin';
  }
  
  return 'bin';
};

// Create a presigned URL for uploading a file
export const createPresignedUploadUrl = async (
  fileName: string,
  contentType: string,
  folder = 'uploads'
): Promise<{ url: string; key: string }> => {
  const extension = getFileExtension(fileName, contentType);
  const key = `${folder}/${generateFileName(extension)}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  return { url, key };
};

// Create a presigned URL for downloading/viewing a file
export const createPresignedDownloadUrl = async (key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}; 