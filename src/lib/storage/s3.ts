import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHash } from "crypto";
import { env } from "@/lib/env";

// =============================================================================
// Types
// =============================================================================

export interface UploadResult {
  key: string;
  bucket: string;
  sha256: string;
  size: number;
  encrypted: true;
}

export interface DownloadUrlResult {
  url: string;
  expiresAt: Date;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  kmsKeyId?: string;
}

// =============================================================================
// S3 Client Factory
// =============================================================================

function createS3Client(): S3Client {
  return new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
    forcePathStyle: true, // Required for MinIO / non-AWS S3
  });
}

// =============================================================================
// SkillStorageService
// =============================================================================

export class SkillStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly kmsKeyId: string | undefined;

  constructor(kmsKeyId?: string) {
    this.client = createS3Client();
    this.bucket = env.S3_BUCKET;
    this.kmsKeyId = kmsKeyId;
  }

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  async uploadSkillPackage(
    skillId: string,
    version: string,
    data: Buffer | Uint8Array,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const key = this.buildKey(skillId, version);
    const sha256 = this.computeHash(data);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: options.contentType ?? "application/octet-stream",
      Metadata: {
        "x-skill-id": skillId,
        "x-skill-version": version,
        "x-content-hash": sha256,
        ...options.metadata,
      },
      // Server-side encryption with KMS
      ServerSideEncryption: "aws:kms",
      SSEKMSKeyId: options.kmsKeyId ?? this.kmsKeyId,
      ChecksumSHA256: this.toBase64Hash(data),
    });

    await this.client.send(command);

    return {
      key,
      bucket: this.bucket,
      sha256,
      size: data.byteLength,
      encrypted: true,
    };
  }

  // ---------------------------------------------------------------------------
  // Download URL (presigned)
  // ---------------------------------------------------------------------------

  async generateDownloadUrl(
    skillId: string,
    version: string,
    expiresInSeconds: number = 3600
  ): Promise<DownloadUrlResult> {
    const key = this.buildKey(skillId, version);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      url,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async deleteSkillPackage(skillId: string, version: string): Promise<void> {
    const key = this.buildKey(skillId, version);

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  // ---------------------------------------------------------------------------
  // Integrity Verification
  // ---------------------------------------------------------------------------

  async verifyIntegrity(skillId: string, version: string, expectedHash: string): Promise<boolean> {
    const key = this.buildKey(skillId, version);

    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    const storedHash = response.Metadata?.["x-content-hash"];

    return storedHash === expectedHash;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private buildKey(skillId: string, version: string): string {
    return `skills/${skillId}/${version}/package.tar.gz`;
  }

  private computeHash(data: Buffer | Uint8Array): string {
    return createHash("sha256").update(data).digest("hex");
  }

  private toBase64Hash(data: Buffer | Uint8Array): string {
    return createHash("sha256").update(data).digest("base64");
  }
}
