import "source-map-support/register";
import { SNSEvent, SNSHandler, S3Event, S3EventRecord } from "aws-lambda";
import * as AWS from "aws-sdk";
import Jimp from "jimp/es";

const s3 = new AWS.S3();
const imagesBucketName = process.env.IMAGES_S3_BUCKET;
const thumbnailsBucketName = process.env.THUMBNAILS_S3_BUCKET;

export const handler: SNSHandler = async (event: SNSEvent) => {
  console.log("Processing SNS Event", JSON.stringify(event));

  for (const snsRecord of event.Records) {
    const s3EventStr = snsRecord.Sns.Message;
    console.log("Processing S3 event", s3EventStr);

    const s3Event = JSON.parse(s3EventStr) as S3Event;

    for (const record of s3Event.Records) {
      console.log("Processing S3 record", JSON.stringify(record));
      
      await processImage(record);
    }
  }
};

async function processImage(record: S3EventRecord) {
  const key = record.s3.object.key;

  const response = await s3
    .getObject({
      Bucket: imagesBucketName,
      Key: key,
    })
    .promise();

  const body: Buffer = response.Body as Buffer;

  const image = await Jimp.read(body);
  image.resize(150, Jimp.AUTO);

  // Convertissez une image en un tampon que nous pouvons écrire dans un compartiment différent
  const convertedBuffer = await image.getBufferAsync(Jimp.AUTO);

  await s3
    .putObject({
      Bucket: thumbnailsBucketName,
      Key: `${key}.jpeg`,
      Body: convertedBuffer,
    })
    .promise();
}
