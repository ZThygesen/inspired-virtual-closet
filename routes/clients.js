import express from 'express';
const router = express.Router();
import { db } from '../server.js';

// get clients
router.get('/', async (req, res, next) => {
    try {
        const collection = db.collection('clients');
        const clients = await collection.find({ }).toArray();

        res.json(clients);
    } catch (err) {
        next(err);
    }
});

// create client
router.post('/', async (req, res, next) => {
    try {
        const collection = db.collection('clients');

        const client = {
            firstName: req.body.firstName,
            lastName: req.body.lastName
        }

        await collection.insertOne(client);

        res.status(201).json({ message: 'Success!' });
    } catch (err) {
        err.status = 400;
        next(err);
    }
});

export default router;
