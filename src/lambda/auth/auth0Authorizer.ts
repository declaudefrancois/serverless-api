import { CustomAuthorizerResult, APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { verify } from 'jsonwebtoken';
import { JwtToken } from "../../auth/JwtToken";
import * as middy from 'middy';
import { secretsManager } from 'middy/middlewares';

const secretId = process.env.AUTH_0_SECRET_ID
const secretField = process.env.AUTH_0_SECRET_FIELD


export const handler = middy(async (event: APIGatewayTokenAuthorizerEvent, context): Promise<CustomAuthorizerResult> => {
  try {
    const decodedToken = verifyToken(
      event.authorizationToken, 
      context.AUTH0_SECRET[secretField]
    );

    console.log("User was authorized", decodedToken);

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
})

function verifyToken(authHeader:string, secret: string): JwtToken{
  if (!authHeader) {
    throw new Error("No authorization header");
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')){
    throw new Error("Invalide authorization header");
  }

  const token = authHeader.split(' ')[1];

  return verify(token, secret);
}

handler.use(
  secretsManager({
    awsSdkOptions: { region: 'us-east-1' },
    cache: true,
    cacheExpiryInMillis: 60000,
    // Throw an error if can't read the secret
    throwOnFailedCall: true,
    secrets: {
      AUTH0_SECRET: secretId
    }
  })
);