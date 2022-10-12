import "source-map-support/register";
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
const docClient = new AWS.DynamoDB.DocumentClient();

const imagesTable = process.env.IMAGES_TABLE;
const groupsTable = process.env.GROUPS_TABLE;
const bucketName = process.env.IMAGES_S3_BUCKET;
const urlExpiration = process.env.SIGNED_URL_EXPIRATION;

const s3 = new AWS.S3({
  signatureVersion: 'v4',
});

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Caller event ", event);

  const { groupId } = event.pathParameters;
  const { title } = JSON.parse(event.body);

  if (!(await groupExists(groupId))) {
    return {
      statusCode: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
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
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(
      {
        item: newImage,
        uploadUrl: signedUrl
      },
      null,
      2
    ),
  };
};

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
