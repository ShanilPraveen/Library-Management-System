const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const fs = require('fs');
const path = require('path');
const gql = require('graphql-tag');
require('dotenv').config();

const resolvers = require('./schema/resolvers');
const { applyAuthMiddleware } = require('./utils/authMiddleware');
const {getUserFromToken} = require('./utils/authContext');

// Read GraphQL schema files
const typeDefs = fs.readFileSync(path.join(__dirname, 'schema', 'typeDefs.graphql'), 'utf8');
const mutations = fs.readFileSync(path.join(__dirname, 'schema', 'mutations.graphql'), 'utf8');
const queries = fs.readFileSync(path.join(__dirname, 'schema', 'queries.graphql'), 'utf8');

// Combine all schema definitions
const schema = gql`
  ${typeDefs}
  ${queries}
  ${mutations}
`;

// Apply Auth Middleware to Resolvers
const securedResolvers = applyAuthMiddleware(resolvers);

// Start the Apollo Server
async function startServer() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs: schema, resolvers: securedResolvers })
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4002 },
    context: async ({ req }) => {
      // Get the token from headers
      const authHeader = req.headers.authorization || "";
      const token = authHeader.replace("Bearer ", "");
      // Verify it 
      const user = await getUserFromToken(token);
      return { user }; 
    }
  });

  console.log(`Catalog Service ready at ${url}`);
}

startServer();