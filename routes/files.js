import express from 'express';
const router = express.Router();
import { db } from '../server.js';
import { ObjectId } from 'mongodb';

// upload files
router.post('/', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        await collection.updateOne(
            { _id: ObjectId(req.body.categoryId) },
            {
                $push: {
                    items: {
                        $each: req.body.files
                    }
                }
            }
        )

        res.status(201).json({ message: 'Success!'});
    } catch (err) {
        err.status = 400;
        next(err);
    }
});

// get files
router.get('/:clientId', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        const files = await collection.aggregate([
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

        res.json({ files: files });
    } catch (err) {
        next(err);
    }
});

// update file
router.patch('/', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        await collection.updateOne(
            { _id: ObjectId(req.body.categoryId) },
            {
                $set: {
                    'items.$.fileName': req.body.newName
                }
            }
        );

        res.json({ message: 'Success!' });
    } catch (err) {
        err.status = 400;
        next(err);
    }
});

// delete file
router.delete('/:categoryId/:fileId', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        await collection.updateOne(
            { _id: ObjectId(req.params.categoryId) },
            {
                $pull: {
                    items: { fileId: req.params.fileId }
                }
            }
        );

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

export default router;

