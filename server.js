import express from 'express';
import process from 'process';
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
        if (process.env.NODE_ENV === 'test') {
            db = mongoClient.db(process.env.DB_NAME_TEST);
            // console.log('Connected to database: test');
        } else {
            db = mongoClient.db(process.env.DB_NAME);
            console.log('Connected to database: dev');
        }
        
        ({ serviceAuth, bucket } = await googleConnect());
    } catch (err) {
        console.error(err);
    }
}

await connect();

import categories from './routes/categories.js';
app.use('/categories', categories);

import clients from './routes/clients.js';
app.use('/api/clients', clients);

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
}

app.use((err, req, res, next) => {
    const status = err.status || 500;
    console.error(`\nError: ${err.message}\nStatus: ${status}\nStack:\n${err.stack}\n`);
    
    res.status(status).json({ message: err.message });
});

if (process.env.NODE_ENV !== 'test') {
    server.listen(port, () => console.log(`Server started on port ${process.env.port || port}`));
}

export { app, db, serviceAuth, bucket, io };
