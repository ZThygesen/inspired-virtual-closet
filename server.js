import express from 'express';
import { config } from 'dotenv';
import { mongoConnect } from './mongoConnect.js';
import { googleConnect } from './googleConnect.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import http from 'http';

const app = express();

const server = http.createServer(app);
const io = new Server(server)

app.use(express.json());
config();
const port = process.env.PORT || 5000;

// connect to mongo db
let db;
let serviceAuth;
let bucket;
async function connect() {
    try {
        const mongoClient = await mongoConnect();
        db = mongoClient.db(process.env.DB_NAME);

        ({ serviceAuth, bucket } = await googleConnect());
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

app.post('/password', async (req, res, next) => {
    try {
        const collection = db.collection('password');
        const result = await collection.find({ password: req.body.password }).toArray();

        if (result.length === 0) {
            res.json(false);
        } else {
            res.json(true);
        }

    } catch (err) {
        err.status = 400;
        next(err);
    }
});

if (process.env.NODE_ENV === 'review' || process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    app.use(express.static(path.resolve(__dirname, './client/build')));
    app.get('*', function (req, res) {
        res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
    });
} else {
    app.use((err, req, res, next) => {
        console.log(`error: ${err.message}, status: ${err.status}`);
        const status = err.status || 500;
        res.status(status).json({ message: err.message });
    });
}

server.listen(port, () => console.log(`Server started on port ${process.env.port || port}`));

export { db, serviceAuth, bucket, io };
