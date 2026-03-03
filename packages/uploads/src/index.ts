import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@easypos/env/server";

// ── R2 Client ─────────────────────────────────────────────────────

function createR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// ── Key generation ─────────────────────────────────────────────────

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

export function generateKey(folder: string, contentType: string): string {
  const ext = MIME_TO_EXT[contentType] ?? "bin";
  return `${folder}/${crypto.randomUUID()}.${ext}`;
}

// ── Presigned upload URL ───────────────────────────────────────────

export interface PresignResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export async function getPresignedUploadUrl(options: {
  key: string;
  contentType: string;
  /** Seconds until the presigned URL expires. Default: 300 (5 min). */
  expiresIn?: number;
}): Promise<PresignResult> {
  const client = createR2Client();

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: options.key,
    ContentType: options.contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: options.expiresIn ?? 300,
  });

  const publicUrl = `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${options.key}`;

  return { uploadUrl, publicUrl, key: options.key };
}

// ── Delete file ────────────────────────────────────────────────────

export async function deleteFile(key: string): Promise<void> {
  const client = createR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    }),
  );
}
