## Introduction    
A GraphQL API is a flexible, efficient, and powerful way to interact with data over the web. It's a query language for APIs and a runtime for executing those queries by interacting with your existing data. GraphQL allows clients to request exactly the data they need, making it more efficient than traditional REST APIs.


## Core Concepts of a GraphQL API
- Query Language : GraphQL's query language allows clients to request specific data by defining a structure for their queries
- Single Endpoint : A GraphQL API exposes a single endpoint (e.g., /graphql), regardless of the types of data or resources you are fetching
- Types and Schema : The schema defines the structure of the API, including the types of data available, the queries and mutations that can be performed, and the relationships between data.
- Resolvers : Resolvers are functions that implement the actual logic behind each field in the schema. When a query or mutation is made, the corresponding resolver is invoked to fetch or modify the data.


## Key Concepts of in types and schema
- Types : Represent the shape of the data (e.g., User, Post, Comment).

- Queries : Define read operations, like fetching data from the server

- Mutations : Define write operations, like creating, updating, or deleting data.

- Subscriptions : Enable real-time data updates


Examples for types and schema
 
- Schema
```javascript
# Define a User type
type User {
  id: ID!
  name: String!
  email: String!
}

# Define Queries
type Query {
  getUser(id: ID!): User
  listUsers: [User]
}

# Define Mutations
type Mutation {
  createUser(name: String!, email: String!): User
}

# Define Subscriptions
type Subscription {
  userCreated: User
}
 ```

- Resolvers 
```javascript 
const resolvers = {
  Query: {
    getUser: (parent, args, context, info) => {
      return users.find(user => user.id === args.id);
    },
    listUsers: () => users,  
  },
  Mutation: {
    createUser: (parent, args, context, info) => {
      const newUser = { id: generateId(), name: args.name, email: args.email };
      users.push(newUser);
      return newUser;  
    },
  },
  Subscription: {
    userCreated: {
      subscribe: () => pubsub.asyncIterator('USER_CREATED'),
    },
  },
};

```
