// set up express app
import express from 'express';
import { config } from 'dotenv';
import { mongoConnect } from './mongoConnect.js';

const app = express();
const port = 5000;
app.use(express.json());
config();

// connect to mongo db
const mongoClient = await mongoConnect();
const db = mongoClient.db('digitalCloset');

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

import categories from './routes/categories.js';
app.use('/categories', categories);

import uploadFiles from './routes/uploadFiles.js';
app.use('/upload-files', uploadFiles);

import deleteFiles from './routes/deleteFiles.js';
app.use('/delete-files', deleteFiles);

const server = app.listen(process.env.port || port, () => {
    const serverPort = server.address().port;
    console.log(`Server started on port ${serverPort}`);
});

export { db };
