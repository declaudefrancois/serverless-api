import { CustomAuthorizerResult, APIGatewayAuthorizerHandler, APIGatewayTokenAuthorizerEvent } from "aws-lambda";


export const handler: APIGatewayAuthorizerHandler = async (event: APIGatewayTokenAuthorizerEvent): Promise<CustomAuthorizerResult> => {

  try {
    verifyToken(event.authorizationToken);
    console.log("User was authorized");

    return {
      principalId: 'user',
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
    
  } catch (error) {
    console.log("Uer was not authorized", error.message);
    
    return {
      principalId: 'user',
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }  
}

function verifyToken(authHeader:string) {
  if (!authHeader) {
    throw new Error("No authorization header");
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')){
    throw new Error("Invalide authorization header");
  }

  const token = authHeader.split(' ')[1];

  // Mock test.
  if (token !== '123') {
    throw new Error("Invalid token");
  }
}