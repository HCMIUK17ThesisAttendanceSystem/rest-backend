const { MONGO_USER, MONGO_PASSWORD, MONGO_CLUSTER, MONGO_DATABASE } = process.env;

module.exports = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_CLUSTER}.mongodb.net/${MONGO_DATABASE}?retryWrites=true&w=majority`;
