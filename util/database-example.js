const username = 'username';
const password = 'password';
const cluster = 'cluster';
const dbname = 'dbname';

module.exports = `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`;
