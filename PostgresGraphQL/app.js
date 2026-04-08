require("dotenv").config();

const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const fs = require("fs");
const path = require("path");
const gql = require("graphql-tag");

const resolvers = require("./graphql/resolvers");

async function createApp() {
  const typeDefs = gql(
    fs.readFileSync(path.join(__dirname, "./graphql/schema/typeDefs.graphql"), "utf-8")
  );

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({ schema });

  const { url } = await startStandaloneServer(server, {
    listen: { port: process.env.PORT || 5000 },
    context: async ({ req, res }) => ({ req, res }),
  });

  console.log(`🚀 Server running at ${url}`);
}

module.exports = createApp;