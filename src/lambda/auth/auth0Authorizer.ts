import { CustomAuthorizerResult, APIGatewayAuthorizerHandler, APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { verify } from 'jsonwebtoken';
import { JwtToken } from "../../auth/JwtToken";

const auth0Secret = process.env.AUTH_0_SECRET;

export const handler: APIGatewayAuthorizerHandler = async (event: APIGatewayTokenAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  try {
    const decodedToken = verifyToken(event.authorizationToken);
    console.log("User was authorized");

    return {
      principalId: decodedToken.sub,
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

function verifyToken(authHeader:string): JwtToken{
  if (!authHeader) {
    throw new Error("No authorization header");
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')){
    throw new Error("Invalide authorization header");
  }

  const token = authHeader.split(' ')[1];

  // Mock test.
  return verify(token, auth0Secret);
}