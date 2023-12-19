import express from 'express';
const router = express.Router();
import { db } from '../server.js';
import { ObjectId } from 'mongodb';

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

// get categories
// router.get('/', async (req, res, next) => {
//     try {
//         const collection = db.collection('categories');
//         const categories = await collection.find({ }).toArray();

//         res.json(categories);
//     } catch (err) {
//         next(err);
//     }
// });

// update category
router.patch('/', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        await collection.updateOne(
            { _id: ObjectId(req.body.categoryId) },
            {
                $set: {
                    name: req.body.newName
                }
            }
        );

        res.json({ message: 'Success!' });

    } catch (err) {
        err.status = 400;
        next(err);
    }
});

// delete category
router.delete('/:categoryId', async (req, res, next) => {
    try {
        // get all files associated with category
        const collection = db.collection('categories');
        const files = await collection.find(
            { _id: ObjectId(req.params.categoryId) },
            { _id: 0, name: 0, items: 1 }
        ).toArray();
        
        // move all files to "Other" category
        await collection.updateOne(
            { _id: 0 },
            {
                $push: {
                    items: {
                        $each: files[0].items
                    }
                }
            }
        );

        // delete category
        await collection.deleteOne({ _id: ObjectId(req.params.categoryId )})

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

export default router;
