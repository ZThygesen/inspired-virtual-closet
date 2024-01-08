// set up express app
import express from 'express';
import { config } from 'dotenv';
import { mongoConnect } from './mongoConnect.js';

const app = express();
const port = 5000;
app.use(express.json());
config();

// connect to mongo db
let db;
async function connect() {
    try {
        const mongoClient = await mongoConnect();
        db = mongoClient.db('digitalCloset');
    } catch (err) {
        console.error(err);
    }
}
connect();

/* // set up mongo db
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to database')); */
    
// app routes
/* import subscribersRouter from './routes/subscribers.js';
app.use('/subscribers', subscribersRouter); */



import clients from './routes/clients.js';
app.use('/clients', clients);

import categories from './routes/categories.js';
app.use('/categories', categories);

import files from './routes/files.js';
app.use('/files', files);

import deleteFiles from './routes/deleteFiles.js';
app.use('/delete-files', deleteFiles);

import outfits from './routes/outfits.js';
app.use('/outfits', outfits);

app.use((err, req, res, next) => {
    console.log(`error: ${err.message}, status: ${err.status}`);
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
});

app.listen(process.env.port || port, () => console.log(`Server started on port ${process.env.port || port}`));

export { db };
