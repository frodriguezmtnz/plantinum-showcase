import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

interface StorageConfig {
  keyId: string;
  appKey: string;
  bucket: string;
  endpoint: string;
  region: string;
}

function getStorageConfig(): StorageConfig | null {
  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APP_KEY;
  const bucket = process.env.B2_BUCKET;
  const endpoint = process.env.B2_ENDPOINT;
  const region = process.env.B2_REGION;

  if (!keyId || !appKey || !bucket || !endpoint || !region) {
    return null;
  }

  return { keyId, appKey, bucket, endpoint, region };
}

export function isStorageConfigured(): boolean {
  return getStorageConfig() !== null;
}

const globalForStorage = globalThis as unknown as { b2Client?: S3Client };

function getClient(): { client: S3Client; bucket: string } {
  const config = getStorageConfig();
  if (!config) {
    throw new Error("B2 storage is not configured");
  }

  globalForStorage.b2Client ??= new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.keyId,
      secretAccessKey: config.appKey,
    },
    forcePathStyle: true,
  });

  return { client: globalForStorage.b2Client, bucket: config.bucket };
}

export function storageImageKey(hash: string): string {
  return `platinums/${hash}.avif`;
}

export async function putImage(key: string, body: Buffer): Promise<void> {
  const { client, bucket } = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "image/avif",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteImage(key: string): Promise<void> {
  const { client, bucket } = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export interface StorageImage {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: number;
}

export async function getImage(key: string): Promise<StorageImage | null> {
  const { client, bucket } = getClient();

  let result;
  try {
    result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
  } catch (error) {
    const errorName = (error as { name?: string }).name;
    if (errorName === "NoSuchKey" || errorName === "NotFound") {
      return null;
    }
    throw error;
  }

  if (!result.Body) {
    return null;
  }

  return {
    stream: result.Body.transformToWebStream(),
    contentType: result.ContentType ?? "application/octet-stream",
    contentLength: result.ContentLength ?? 0,
  };
}
