import express from 'express';
import process from 'process';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { helpers } from './helpers.js';
import { auth } from './routes/auth.js'
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(cookieParser());
config();
const port = process.env.PORT || 5000;

// connect to mongo db
let db;
let serviceAuth;
let bucket;
async function connect() {
    try {
        db = await helpers.mongoConnect();
        ({ serviceAuth, bucket } = await helpers.googleConnect());
    } catch (err) {
        console.error(err);
    }
}

await connect();

function injectDb(req, res, next) {
    req.locals = { db, bucket };
    next();
}

// routes
import { authRouter } from './routes/auth.js';
app.use('/google-auth', injectDb, authRouter);

import { categoriesRouter } from './routes/categories.js';
app.use('/categories', injectDb, auth.authenticateJWT, categoriesRouter);

import { clientsRouter } from './routes/clients.js';
app.use('/api/clients', injectDb, auth.authenticateJWT, clientsRouter);

import { itemsRouter } from './routes/items.js';
app.use('/items', injectDb, auth.authenticateJWT, itemsRouter);

import { outfitsRouter } from './routes/outfits.js';
app.use('/outfits', injectDb, auth.authenticateJWT, outfitsRouter);

import { profileRouter } from './routes/profile.js';
app.use('/profile', injectDb, auth.authenticateJWT, profileRouter);

import { shoppingRouter } from './routes/shopping.js';
app.use('/shopping', injectDb, auth.authenticateJWT, shoppingRouter);

import { tagsRouter } from './routes/tags.js';
app.use('/tags', injectDb, auth.authenticateJWT, tagsRouter);

if (process.env.NODE_ENV === 'review' || process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    app.use(express.static(path.resolve(__dirname, './client/build')));
    app.get('*', function (req, res) {
        res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
    });
}

// error handling
app.use((err, req, res, next) => {
    const status = err.status || 500;

    if (process.env.NODE_ENV !== 'test') {
        console.error(`\nError: ${err.message}\nStatus: ${status}\nStack:\n${err.stack}\n`); 
    }
    
    res.status(status).json({ message: err.message });
});

if (process.env.NODE_ENV === 'test') {
    app.listen(0);
} else {
    app.listen(port, () => console.log(`Server started on port ${process.env.port || port}`));
}

export { app, bucket, serviceAuth };
