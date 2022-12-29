const { MongoClient } = require('mongodb');

async function mongoConnect(uri) {
    let mongoClient;
    try {
        mongoClient = new MongoClient(process.env.DB_URI);
        await mongoClient.connect(); 

        console.log('Connected to database');

        return mongoClient;
    } catch (err) {
        console.error(err);
    }
}

module.exports = mongoConnect;
