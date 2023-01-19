import express from 'express';
const router = express.Router();
import { db } from '../server.js';

// get categories
router.get('/', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        const categories = await collection.find({ }).toArray();

        res.json(categories);
    } catch (err) {
        next(err);
    }
});

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
        err.status = 400;
        next(err);
    }
});

export default router;
