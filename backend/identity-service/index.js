const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { buildSubgraphSchema } = require("@apollo/subgraph");
const fs = require("fs");
const path = require("path");
const gql = require("graphql-tag");
const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const axios = require("axios");

const resolvers = require("../identity-service/schema/resolvers");

// Read GraphQL schema files
const typeDefs = fs.readFileSync(
  path.join(__dirname, "schema", "typeDefs.graphql"),
  "utf8"
);
const mutations = fs.readFileSync(
  path.join(__dirname, "schema", "mutations.graphql"),
  "utf8"
);
const queries = fs.readFileSync(
  path.join(__dirname, "schema", "queries.graphql"),
  "utf8"
);

// Combine all schema definitions
const schema = gql`
  ${typeDefs}
  ${queries}
  ${mutations}
`;

// Cache JWKs for token verification
let pems = null;

// Fetch Cognito JWKs
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

// Decode & verify Cognito JWT
async function getUserFromToken(token) {
  if (!token) return null;

  try {
    const tokenSections = token.split(".");
    if (tokenSections.length < 2) throw new Error("Token is invalid");

    const headerJSON = Buffer.from(tokenSections[0], "base64").toString("utf8");
    const header = JSON.parse(headerJSON);
    const pems = await getPems();
    const pem = pems[header.kid];

    if (!pem) throw new Error("Invalid token");

    const decoded = jwt.verify(token, pem, { algorithms: ["RS256"] });

    // pass required fields to context
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

// Start Apollo Server
async function startServer() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs: schema, resolvers }),
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4001 },
    context: async ({ req }) => {
      // Get token from Authorization header
      const authHeader = req.headers.authorization || "";
      const token = authHeader.replace("Bearer ", "");

      const user = await getUserFromToken(token);
      return { user };
    },
  });

  console.log(`Identity Service ready at ${url}`);
}

startServer();
