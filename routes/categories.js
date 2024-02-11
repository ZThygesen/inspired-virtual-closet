import express from 'express';
const router = express.Router();
import { db } from '../server.js';
import { ObjectId } from 'mongodb';
import { helpers } from '../helpers.js';

// create category
router.post('/', async (req, res, next) => {
    try {
        const collection = db.collection('categories');

        if ((await collection.find({ name: req.body.category }).toArray()).length > 0) {
            throw new Error(`A category with the name "${req.body.category}" already exists`);
        }

        const category = {
            name: req.body.category,
            items: []
        }

        await collection.insertOne(category);

        res.status(201).json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

// get categories
router.get('/', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        const categories = await collection.find({ }, { projection: {items: 0 } }).toArray();
        
        res.status(200).json(categories)
    } catch (err) {
        next(err);
    }
});

// update category
router.patch('/:categoryId', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        await collection.updateOne(
            { _id: ObjectId(req.params.categoryId) },
            {
                $set: {
                    name: req.body.newName
                }
            }
        );

        res.status(200).json({ message: 'Success!' });

    } catch (err) {
        next(err);
    }
});

// delete category
router.delete('/:categoryId', async (req, res, next) => {
    try {
        // move files to Other
        await helpers.moveFilesToOther(req.params.categoryId);

        // delete category
        const collection = db.collection('categories');
        await collection.deleteOne({ _id: ObjectId(req.params.categoryId )});

        res.status(200).json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

export default router;
