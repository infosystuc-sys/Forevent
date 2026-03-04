import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

export async function upload(file: File): Promise<string> {
    console.log("upload file", file)
    const client = new S3Client({
        region: process.env.NEXT_PUBLIC_AWS_S3_REGION as string,
        credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY as string
        }
    })
    const ab = await file.arrayBuffer()
    const bf = Buffer.from(ab)
    return new Promise(async (resolve, reject) => {
        // const optimized = await sharp(bf).jpeg({ quality: 75, }).toBuffer()
        const upload = await client.send(new PutObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
            Key: file.name.replace(/\s/g, ''),
            Body: bf,
        }))
        if (upload) {
            console.log("uploaded!", upload)
            resolve(new URL("https://d7b5vnrkht15.cloudfront.net/" + file.name.replace(/\s/g, '')).toString())
        } else {
            reject('upload error')
        }
    })
}

export async function uploadMultiple(files: File[]) {
    console.log('Upload files', files)
    return Promise.all(files.map(upload));
}
