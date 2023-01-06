// set up express app
const express = require('express');
const app = express();
const port = 5000;
require('dotenv').config();
app.use(express.json());

// connect to mongo db
const connect = require('./mongoConnect');
connect();

/* // set up mongo db
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to database')); */
    
// app routes
const subscribersRouter = require('./routes/subscribers');
app.use('/subscribers', subscribersRouter);

const uploadFiles = require('./routes/uploadFiles');
app.use('/upload-files', uploadFiles);

const deleteFiles = require('./routes/deleteFiles');
app.use('/delete-files', deleteFiles);

const server = app.listen(process.env.port || port, () => {
    const serverPort = server.address().port;
    console.log(`Server started on port ${serverPort}`);
});
