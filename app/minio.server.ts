import * as Minio from "minio";

const minio_url: string = process.env.MINIO_URL!;
const accessKey: string = process.env.MINIO_ACCESS_KEY!;
const secretKey: string = process.env.MINIO_SECRET_KEY!;
const bucket = "notepia";

const minioClient = new Minio.Client({
  endPoint: minio_url,
  port: 9000,
  useSSL: false,
  accessKey: accessKey,
  secretKey: secretKey,
});

//ファイルアップロード関数
export async function uploadFile(
  sourceFile: File,
  destinationObject: string
): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket);
    }
    const fileBuffer = Buffer.from(await sourceFile.arrayBuffer());
    await minioClient.putObject(bucket, destinationObject, fileBuffer);
    console.log(
      `File uploaded as object ${destinationObject} in bucket ${bucket}`
    );
  } catch (err) {
    console.error("Error uploading file:", err);
  }
}

//ファイル削除関数
export async function deleteFile(sourceObject: string): Promise<void> {
  try {
    await minioClient.removeObject(bucket, sourceObject);
    console.log(`File "${sourceObject}" was deleted`);
  } catch (err) {
    console.error("Error delete file:", err);
  }
}

//ファイル取得関数
export async function getFile(sourceObject: string): Promise<Buffer> {
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      throw new Error(`Bucket "${bucket}" does not exist.`);
    }

    const dataStream = await minioClient.getObject(bucket, sourceObject);

    const result = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      dataStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      dataStream.on("end", () => {
        console.log(`File ${sourceObject} retrieved from bucket ${bucket}`);
        resolve(Buffer.concat(chunks)); // ファイルの内容を Buffer にまとめて返す
      });

      dataStream.on("error", (err) => {
        reject(err);
      });
    });

    return result;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}
