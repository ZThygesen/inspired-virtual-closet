import express from 'express';
const router = express.Router();
import { db } from '../server.js';

// get categories
router.get('/', async (req, res) => {
    try {
        const collections = await db.collections();
        const categories = collections
            .map(collection => (collection.collectionName))
            .filter(category => category !== 'clients');
        
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// create category
router.post('/', async (req, res) => {
    try {
        await db.createCollection(req.body.category);
        res.status(201).json({ message: 'Success!' });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err.message });
    }
});

export default router;
