import express from 'express';
const router = express.Router();
import { db, bucket } from '../server.js';
import { ObjectId } from 'mongodb';

// create client
router.post('/', async (req, res, next) => {
    try {
        console.log('here')
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
        // get all files from db
        let collection = db.collection('categories');
        const categories = await collection.aggregate([
            { $match: { 'items.clientId': req.params.clientId } },
            {
                $project: {
                    items: { $filter: {
                        input: '$items',
                        as: 'item',
                        cond: { $eq: ['$$item.clientId', req.params.clientId] }
                    }},
                }
            }
        ]).toArray();

        let files = []; 
        categories.forEach(category => {
            files = [...files, ...category.items];
        });

        // delete all files on GCS
        for (const file of files) {
            const fullGcsFile = bucket.file(file.fullGcsDest);
            await fullGcsFile.delete();

            const smallGcsFile = bucket.file(file.smallGcsDest);
            await smallGcsFile.delete();
        }
        
        // delete all files associated with client in db
        await collection.updateMany(
            { },
            {
                $pull: {
                    items: { clientId: req.params.clientId }
                }
            }
        );

        // get all outfits from db
        collection = db.collection('outfits');
        const outfits = await collection.find({ clientId: req.params.clientId }).toArray();
        
        // delete all clients' outfits on GCS
        for (const outfit of outfits) {
            const gcsFile = bucket.file(outfit.gcsDest);
            await gcsFile.delete();
        }

        // delete all clients' files in db
        await collection.deleteMany({ clientId: req.params.clientId });

        // delete client
        collection = db.collection('clients');
        await collection.deleteOne({ _id: ObjectId(req.params.clientId) });

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

export default router;
