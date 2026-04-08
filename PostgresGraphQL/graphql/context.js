const { PubSub } = require("graphql-subscriptions");

const pubsub = new PubSub();

const createContext = () => {
  return {
    pubsub,
  };
};

module.exports = createContext;