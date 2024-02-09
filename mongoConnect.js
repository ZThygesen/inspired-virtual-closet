import { MongoClient } from 'mongodb';

export async function mongoConnect() {
    let mongoClient;
    try {
        mongoClient = new MongoClient(process.env.DB_URI);
        await mongoClient.connect(); 

        return mongoClient;
    } catch (err) {
        console.error(err);
    }
}
