import "source-map-support/register";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
const docClient = new AWS.DynamoDB.DocumentClient();
import * as middy from "middy";
import { cors } from "middy/middlewares";

const imagesTable = process.env.IMAGES_TABLE;
const groupsTable = process.env.GROUPS_TABLE;
const bucketName = process.env.IMAGES_S3_BUCKET;
const urlExpiration = process.env.SIGNED_URL_EXPIRATION;

const s3 = new AWS.S3({
  signatureVersion: 'v4',
});

export const handler = middy(async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Caller event ", event);

  const { groupId } = event.pathParameters;
  const { title } = JSON.parse(event.body);

  if (!(await groupExists(groupId))) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: "Group does not exist",
      }),
    };
  }

  const timestamp = new Date().toISOString();
  const imageId = uuidv4();

  const newImage = {
    groupId,
    timestamp,
    imageId,
    title,
    imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
  };

  const signedUrl = getUploadUrl(imageId);

  await docClient
    .put({
      TableName: imagesTable,
      Item: newImage,
    })
    .promise();

  return {
    statusCode: 201,
    body: JSON.stringify(
      {
        item: newImage,
        uploadUrl: signedUrl
      },
      null,
      2
    ),
  };
});

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: parseInt(urlExpiration),
  })
}

async function groupExists(groupId: string) {
  const result = await docClient
    .get({
      TableName: groupsTable,
      Key: {
        id: groupId,
      },
    })
    .promise();

  console.log("Get group: ", result);
  return !!result.Item;
}

handler.use(
  cors({
    credentials: true
  })
)
