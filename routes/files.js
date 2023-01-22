import express from 'express';
const router = express.Router();
import { db } from '../server.js';
import { ObjectId } from 'mongodb';

// get files
router.get('/:id', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        const files = await collection.aggregate([
            { $match: { 'items.clientId': req.params.id } },
            { $project: {
                items: { $filter: {
                    input: '$items',
                    as: 'item',
                    cond: { $eq: ['$$item.clientId', req.params.id] }
                }},
            }}
        ]).toArray();

        res.json({ files: files });
    } catch (err) {
        next(err);
    }
});

// upload files
router.post('/', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        console.log(req.body);
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

// delete file
router.delete('/', async (req, res, next) => {

});

export default router;

