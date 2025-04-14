## Introduction    
In the backend, we are leveraging a PostgreSQL database, GraphQL, and Node.js to build a robust and efficient system for managing student data. The choice of these technologies enables us to handle complex queries with flexibility and provides a seamless experience for both developers and users.

## Technologies Used:
- PostgreSQL
- Nodejs
- GraphQL
- React
- Apollo Server Express

In the backend, we built the application using a combination of powerful packages to streamline our GraphQL setup and enable real-time communication. We used @graphql-tools/schema to define and build the GraphQL schema, and apollo-server-express to integrate Apollo Server with Express for handling API requests. The graphql package is used to implement the core GraphQL query language, while graphql-request simplifies making GraphQL queries from the client. For real-time data updates, we utilized graphql-subscriptions and subscriptions-transport-ws to enable WebSocket-based subscriptions, allowing for seamless real-time interactions in the application
# GraphQL Setup for backend
- Install the below packages 
```javascript
@graphql-tools/schema
apollo-server-express
graphql
graphql-request
graphql-subscriptions
subscriptions-transport-ws
```
-- For other, refer backend folder
