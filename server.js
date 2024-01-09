// set up express app
import express from 'express';
import { config } from 'dotenv';
import { mongoConnect } from './mongoConnect.js';
import { bucketConnect } from './bucketConnect.js';

const app = express();
const port = 5000;
app.use(express.json());
config();

// connect to mongo db
let db;
let bucket;
async function connect() {
    try {
        const mongoClient = await mongoConnect();
        db = mongoClient.db('digitalCloset');

        bucket = await bucketConnect();
    } catch (err) {
        console.error(err);
    }
}

await connect();

import categories from './routes/categories.js';
app.use('/categories', categories);

import clients from './routes/clients.js';
app.use('/clients', clients);

import files from './routes/files.js';
app.use('/files', files);

import outfits from './routes/outfits.js';
app.use('/outfits', outfits);

app.use((err, req, res, next) => {
    console.log(`error: ${err.message}, status: ${err.status}`);
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
});

app.listen(process.env.port || port, () => console.log(`Server started on port ${process.env.port || port}`));

export { db, bucket };
