const AWS = require("aws-sdk");

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION,
});

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

module.exports = { cognito, userPoolId, clientId };
