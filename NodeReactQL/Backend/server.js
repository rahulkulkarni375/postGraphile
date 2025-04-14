// const express = require('express');
// const http = require('http');
// const { ApolloServer } = require('apollo-server-express');
// const { makeExecutableSchema } = require('@graphql-tools/schema');
// const { PubSub } = require('graphql-subscriptions');
// const { execute, subscribe } = require('graphql');
// const { SubscriptionServer } = require('subscriptions-transport-ws');
// const pool = require('./db');

// const app = express();
// const httpServer = http.createServer(app);
// const pubsub = new PubSub();

// // Define GraphQL schema as string to avoid schema conflicts
// const typeDefs = `
//   type Student {
//     id: ID!
//     name: String!
//     phone_number: String!
//   }

//   type Query {
//     getStudents: [Student]
//   }

//   type Mutation {
//     addStudent(name: String!, phone_number: String!): Student
//   }

//   type Subscription {
//     studentAdded: Student
//   }
// `;

// // Define resolvers
// const resolvers = {
//   Query: {
//     getStudents: async () => {
//       const res = await pool.query('SELECT * FROM students');
//       return res.rows;
//     },
//   },
//   Mutation: {
//     addStudent: async (_, { name, phone_number }) => {
//       const res = await pool.query(
//         'INSERT INTO students(name, phone_number) VALUES($1, $2) RETURNING *',
//         [name, phone_number]
//       );
//       const newStudent = res.rows[0];
//       pubsub.publish('STUDENT_ADDED', { studentAdded: newStudent });
//       return newStudent;
//     },
//   },
//   Subscription: {
//     studentAdded: {
//       subscribe: () => pubsub.asyncIterator(['STUDENT_ADDED']),
//     },
//   },
// };

// // Create the schema
// const schema = makeExecutableSchema({ typeDefs, resolvers });

// // Start the server
// async function startServer() {
//   const subscriptionServer = SubscriptionServer.create(
//     {schema,execute,subscribe,  onConnect: () => ({ pubsub }),},
//     {server: httpServer, path: '/graphql',}
//   );

//   // Initialize Apollo Server
//   const apolloServer = new ApolloServer({
//     schema,
//     plugins: [
//       {
//         async serverWillStart() {
//           return {
//             async drainServer() {
//               subscriptionServer.close();
//             },
//           };
//         },
//       },
//     ],
//     context: () => ({ pubsub }),
//   });

//   // Start Apollo Server
//   await apolloServer.start();

//   // Apply middleware
//   apolloServer.applyMiddleware({ app });

//   // Start HTTP server
//   const PORT = 4000;
//   httpServer.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}${apolloServer.graphqlPath}`);
//     console.log(`Subscriptions available at ws://localhost:${PORT}${apolloServer.graphqlPath}`);
//   });
// }

// startServer().catch((err) => {
//   console.error('Error starting server:', err);
// });



const express = require('express');
const http = require('http');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const fs = require('fs');
const path = require('path');
const pool = require('./db');
const { resolvers, pubsub } = require('./resolvers');

// Read the GraphQL schema file
const typeDefs = fs.readFileSync(
  path.join(__dirname, 'typeDefs.graphql'),
  'utf8'
);

const app = express();
const httpServer = http.createServer(app);

// Create the schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Start the server
async function startServer() {
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect: () => ({ pubsub }),
    },
    { server: httpServer, path: '/graphql' }
  );

  // Initialize Apollo Server
  const apolloServer = new ApolloServer({
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
    context: () => ({ pubsub }),
  });

  // Start Apollo Server
  await apolloServer.start();

  // Apply middleware
  apolloServer.applyMiddleware({ app });

  // Start HTTP server
  const PORT = 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}${apolloServer.graphqlPath}`);
    console.log(`Subscriptions available at ws://localhost:${PORT}${apolloServer.graphqlPath}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});