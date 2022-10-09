import 'source-map-support/register';
import {APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient();
const groupsTable = process.env.GROUPS_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // debug purpose
  console.log("Processing event ", event);
  
  const { name, description } = JSON.parse(event.body);
  const newGroupId = uuidv4();

  const newGroup = {
    id: newGroupId,
    name,
    description,
  }

  await docClient.put({
    TableName: groupsTable,
    Item: newGroup,
  }).promise();

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      item: newGroup,
    }, null, 2)
  }
}