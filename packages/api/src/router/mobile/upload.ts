import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { Resend } from "resend";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { TRPCError } from '@trpc/server';
import { env } from "../../env";

export const uploadRouter = createTRPCRouter({
  create: publicProcedure.input(z.object({
    filename: z.string(),
    contentType: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const name = uuidv4()
    console.log("API ROUTE", input.filename, input.contentType)
    try {
      const client = new S3Client({ region: env.AWS_REGION })
      const { url, fields } = await createPresignedPost(client, {
        Bucket: env.AWS_BUCKET_NAME,
        Key: name,
        Conditions: [
          ['content-length-range', 0, 10485760], // up to 10 MB
          ['starts-with', '$Content-Type', input.contentType],
        ],
        Fields: {
          acl: 'public-read',
          'Content-Type': input.contentType,
        },
        Expires: 600, // Seconds before the presigned post expires. 3600 by default.
      })

      // return Response.json({ url: env.CLOUDFRONT_DISTRIBUTION_NAME + name, fields })
      return ({ url, fields })
    } catch (error: any) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
  }),

});
