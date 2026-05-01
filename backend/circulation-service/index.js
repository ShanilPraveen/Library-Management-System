const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { buildSubgraphSchema } = require("@apollo/subgraph");
const fs = require("fs");
const path = require("path");
const gql = require("graphql-tag");
const cron = require("node-cron");
const calculatePenalties = require("./src/cron/penaltyCalculator");
const generateNotifications = require("./src/cron/notificationGenerator");

const resolvers = require("../circulation-service/schema/resolvers");

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

// Start the Apollo Server
async function startServer() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs: schema, resolvers }),
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4003 },
  });

  console.log(`Circulation Service ready at ${url}`);

  // Schedule cron jobs for daily tasks : Notification generation at 3 AM and Penalty calculation at 10 PM

  cron.schedule("0 3 * * *", () => {
    console.log("Running daily notification generation task at 3 AM");
    generateNotifications();
  });

  cron.schedule("0 22 * * *", () => {
    console.log("Running daily penalty calculation task at 10 PM");
    calculatePenalties();
  });

  // for testing,
  await calculatePenalties();
  await generateNotifications();
}

startServer();
