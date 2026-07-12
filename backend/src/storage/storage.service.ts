import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

const IMAGE_MAX_WIDTH = 2048;
const IMAGE_QUALITY = 85;
const SIGNED_URL_EXPIRY = 3600;
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export interface UploadedImage {
  fileUrl: string;
  cdnUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly endpoint: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('S3_BUCKET') ?? 'sitebank';
    this.endpoint = config.get<string>('S3_ENDPOINT');
    this.publicUrl =
      config.get<string>('S3_PUBLIC_URL') ??
      (this.endpoint ? `${this.endpoint.replace(/\/$/, '')}/${this.bucket}` : '');

    const accessKeyId = config.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = config.get<string>('S3_SECRET_KEY');

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        `S3 storage credentials are missing! accessKeyId: ${accessKeyId ? 'present' : 'missing'}, secretAccessKey: ${secretAccessKey ? 'present' : 'missing'}. File uploads will fail.`
      );
    }

    this.client = new S3Client({
      region: config.get<string>('S3_REGION') ?? 'auto',
      endpoint: this.endpoint,
      forcePathStyle: !!this.endpoint,
      credentials:
        accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  async uploadImage(buffer: Buffer, key: string, mimeType: string): Promise<UploadedImage> {
    if (!ALLOWED_IMAGE_MIME.includes(mimeType)) {
      throw new BadRequestException(`Unsupported image type: ${mimeType}`);
    }

    let processed;
    try {
      processed = await sharp(buffer)
        .rotate()
        .resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: IMAGE_QUALITY })
        .toBuffer({ resolveWithObject: true });
    } catch (err) {
      this.logger.error(`Sharp image processing failed: ${(err as Error).message}`, (err as Error).stack);
      throw new BadRequestException(
        `Failed to process image. The file may be corrupt or of an unsupported format. Details: ${(err as Error).message}`
      );
    }

    const webpKey = key.replace(/\.[^.]+$/, '.webp');

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: webpKey,
          Body: processed.data,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (err) {
      this.logger.error(
        `S3 image upload failed for key ${webpKey} in bucket ${this.bucket} with endpoint ${this.endpoint || 'AWS standard'}: ${(err as Error).message}`,
        (err as Error).stack
      );
      throw new InternalServerErrorException(
        `Failed to upload processed image to storage. Please verify S3/R2 credentials and bucket configuration on Render. Details: ${(err as Error).message}`
      );
    }

    const cdnUrl = `${this.publicUrl}/${webpKey}`;
    return {
      fileUrl: cdnUrl,
      cdnUrl,
      width: processed.info.width,
      height: processed.info.height,
      sizeBytes: processed.info.size,
    };
  }

  async uploadFile(buffer: Buffer, key: string, mimeType: string): Promise<{ fileUrl: string }> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );
      return { fileUrl: `${this.publicUrl}/${key}` };
    } catch (err) {
      this.logger.error(
        `S3 file upload failed for key ${key} in bucket ${this.bucket} with endpoint ${this.endpoint || 'AWS standard'}: ${(err as Error).message}`,
        (err as Error).stack
      );
      throw new InternalServerErrorException(
        `Failed to upload file to storage. Please verify S3/R2 credentials and bucket configuration on Render. Details: ${(err as Error).message}`
      );
    }
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = SIGNED_URL_EXPIRY): Promise<string> {
    const cleanKey = this.normalizeKey(key);
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: cleanKey }),
      { expiresIn: expiresInSeconds },
    );
  }

  async getPresignedUploadUrl(
    key: string,
    mimeType: string,
    maxSizeBytes: number,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
        ContentLength: maxSizeBytes,
      }),
      { expiresIn: 300 },
    );
    return { uploadUrl, fileUrl: `${this.publicUrl}/${key}` };
  }

  async deleteFile(key: string): Promise<void> {
    const cleanKey = this.normalizeKey(key);
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: cleanKey }));
    } catch (err) {
      this.logger.error(`Failed to delete file ${cleanKey}: ${(err as Error).message}`);
    }
  }

  generateKey(prefix: string, filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'bin';
    return `${prefix}/${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;
  }

  private normalizeKey(keyOrUrl: string): string {
    if (this.publicUrl && keyOrUrl.startsWith(this.publicUrl)) {
      return keyOrUrl.slice(this.publicUrl.length + 1);
    }
    return keyOrUrl;
  }
}
