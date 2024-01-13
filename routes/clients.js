import express from 'express';
const router = express.Router();
import { db, bucket } from '../server.js';
import { ObjectId } from 'mongodb';

// create client
router.post('/', async (req, res, next) => {
    try {
        const collection = db.collection('clients');

        const client = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: '',
            isAdmin: false
        }

        await collection.insertOne(client);

        res.status(201).json({ message: 'Success!' });
    } catch (err) {
        err.status = 400;
        next(err);
    }
});

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

// update client
router.patch('/:clientId', async (req, res, next) => {
    try {
        const collection = db.collection('clients');
        await collection.updateOne(
            { _id: ObjectId(req.params.clientId) },
            {
                $set: {
                    firstName: req.body.newFirstName,
                    lastName: req.body.newLastName
                }
            }
        );

        res.json({ message: 'Success!' });
    } catch (err) {
        err.status = 400;
        next(err);
    }
});

// delete client
router.delete('/:clientId', async (req, res, next) => {
    try {
        const collection = db.collection('clients');
        await collection.deleteOne({ _id: ObjectId(req.params.clientId) });

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

export default router;
