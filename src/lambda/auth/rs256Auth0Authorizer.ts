import "source-map-support/register";
import { CustomAuthorizerResult, APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { JwtToken } from "../../auth/JwtToken";
import { verify } from "jsonwebtoken";


const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJQWu09luNh11GMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi12bmQ3em9ncS51cy5hdXRoMC5jb20wHhcNMjIxMDE0MDM1ODI1WhcN
MzYwNjIyMDM1ODI1WjAkMSIwIAYDVQQDExlkZXYtdm5kN3pvZ3EudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnsN6sO3UbKKTDAam
+n2brCm79/BDSFkrhn1hIvmrklFwwb4nZegJf8poM0om8fjQ+W3PP6A901PgZN1Q
5VDWZO2MG4UaL6K22m9G0U3gIUEqkPMuQ8EEiHVURHAiUD1t9RtZNkVL6KS3uqJu
rEZmE8BjSxI9vPlESkcUIKq5ofQtIins8Qoep6GsmSP7e6aEK6WhQz9wZWH6DWvp
fM0DHi/P4CEC0Roj/TXmAHgXZkLov3P5hara8uu2N/jqOATBR9I89e15AbME8DVG
/rbL0DHUiDMDhj3caE6WFKpuupMekmTj3XzizHddQpOcDDijdngQp0xQj1uPmgY2
9icBOQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBSvPofUCaBw
y3//zBfoSVs+xXknQjAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AA/6KSMhQhAk7VqGV5EhpzsLxRBNIcB9tc6OqCPEgg6h4ZjE89NdO9ahioTHFhxU
Gn1Jio4hI2agI7o67gXxJOkN8xFh4/E+ZdPs/hNmbyDvQgWao2BOCdaF/a6WrUdc
i4BprBZF8AS+Hbm/PVdNhXBL9FuQ9jVlZJyGLfUtktjUPe1A8YZSzDmgsUUgRxRi
ELDjZZz3AhF3lCP5e20U9UW4S0jht8G8JX/saACtvwri431Qf3Enz9Q5Pp9UCwvm
FlE2PZnE4xA2ILTwztDqXoGX7kGJ0S8ZNBF6dmx0JwjZ7we/9vQPCznOuGmxv8qF
qR0EeJvqjTf3h+luxApzqKY=
-----END CERTIFICATE-----`;

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<CustomAuthorizerResult> => {
    try { const jwtToken = verifyToken(event.authorizationToken);
    console.log("User was authorized", jwtToken);

    return {
      principalId: jwtToken.sub,
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


  return verify(token, cert, {algorithms: ['RS256']}) as JwtToken;
}
