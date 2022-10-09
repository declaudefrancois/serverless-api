import "source-map-support/register";
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import * as AWS from "aws-sdk";

const docClient = new AWS.DynamoDB.DocumentClient();
const imagesTable = process.env.IMAGES_TABLE;
const imagesIdIndex = process.env.IMAGES_ID_INDEX;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Caller event ", event);

  const { imageId } = event.pathParameters;

  const result = await docClient
    .query({
      TableName: imagesTable,
      IndexName: imagesIdIndex,
      KeyConditionExpression: "imageId = :imageId",
      ExpressionAttributeValues: {
        ":imageId": imageId,
      },
    })
    .promise();

  if (result.Count > 0) {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result.Items[0], null, 2),
    };
  }

  return {
    statusCode: 404,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: ''
  };
};
