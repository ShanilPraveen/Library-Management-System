const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const axios = require("axios");

let pems = null;

async function getPems() {
  if (!pems) {
    const url = process.env.COGNITO_ISSUER; 
    const { data } = await axios.get(url);
    pems = {};
    data.keys.forEach((key) => {
      pems[key.kid] = jwkToPem(key);
    });
  }
  return pems;
}

async function getUserFromToken(token) {
  if (!token) return null;

  try {
    const tokenSections = token.split(".");
    if (tokenSections.length < 2) return null;

    const headerJSON = Buffer.from(tokenSections[0], "base64").toString("utf8");
    const header = JSON.parse(headerJSON);
    const pems = await getPems();
    const pem = pems[header.kid];

    if (!pem) return null;

    const decoded = jwt.verify(token, pem, { algorithms: ["RS256"] });

    return {
      userId: decoded["custom:userId"],
      username: decoded["cognito:username"] || decoded["username"],
      role: decoded["custom:role"],
    };
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return null;
  }
}

module.exports = { getUserFromToken };