import "source-map-support/register";
import { S3Handler, S3Event } from "aws-lambda";
import * as AWS from "aws-sdk";

const docClient = new AWS.DynamoDB.DocumentClient();

const connectionsTable = process.env.CONNECTIONS_TABLE;
const stage = process.env.STAGE;
const apiId = process.env.API_ID;

const connectionParams = {
  apiVersion: "2018-11-29",
  endpoint: `${apiId}.execute-api.us-east-1.amazonaws.com/${stage}`
};

const apiGateway = new AWS.ApiGatewayManagementApi(connectionParams);

export const handler: S3Handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const key = record.s3.object.key;
    console.log("Processing S3 item with key :", key);

    const connections = await docClient
      .scan({
        TableName: connectionsTable,
      })
      .promise();

    // Notification content to send.
    const payload = {
      imageId: key,
    };

    await Promise.all(
      connections.Items.map((connection) => {
        const connectionId = connection.id;
        return sendMessageToClient(connectionId, payload);
      })
    );
  }
};

async function sendMessageToClient(connectionId, payload) {
  try {
    console.log("Sending message to a connection", connectionId);

    await apiGateway
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(payload),
      })
      .promise();
  } catch (e) {
    console.log("Failed to send message", JSON.stringify(e));
    if (e.statusCode === 410) {
      // Not deleted closed connection.
      console.log("Stale connection");

      await docClient
        .delete({
          TableName: connectionsTable,
          Key: {
            id: connectionId,
          },
        })
        .promise();
    }
  }
}
