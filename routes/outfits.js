import express from 'express';
const router = express.Router();
import { db } from '../server.js';
import { ObjectId } from 'mongodb';

// create outfit
router.post('/', async (req, res, next) => {
    try {
        const collection = db.collection('outfits');
        await collection.insertOne(req.body);

        res.status(201).json({ message: 'Success!' });

    } catch (err) {
        err.status = 400;
        next(err);
    }
});

// get outfits for given client
router.get('/:clientId', async (req, res, next) => {
    try {
        const collection = db.collection('outfits');
        const outfits = await collection.find({ clientId: req.params.clientId }).toArray();
        res.json(outfits);
    } catch (err) {
        next(err);
    }
});

// update outfit content
router.patch('/', async (req, res, next) => {
    console.log('HERE')
    try {

    } catch (err) {
        next(err);
    }
});

// update only outfit name
router.patch('/name', async (req, res, next) => {
    try {
        const collection = db.collection('outfits');
        await collection.updateOne(
            { _id: ObjectId(req.body.outfitId) },
            { 
                $set: {
                    outfitName: req.body.newName
                }
            }
        );

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

// delete outfit
router.delete('/:outfitId', async (req, res, next) => {
    try {
        const collection = db.collection('outfits');
        await collection.deleteOne({ _id: ObjectId(req.params.outfitId )});

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});




export default router;