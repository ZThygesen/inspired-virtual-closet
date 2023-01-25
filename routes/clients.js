import express from 'express';
const router = express.Router();
import { db } from '../server.js';
import { ObjectId } from 'mongodb';
import puppeteer from 'puppeteer';

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
router.patch('/', async (req, res, next) => {
    try {
        const collection = db.collection('clients');
        await collection.updateOne(
            { _id: ObjectId(req.body.clientId) },
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
        // delete all files from imgbb
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

        await deleteFromWeb(files);
        
        // delete all files associated with client
        await collection.updateMany(
            { },
            {
                $pull: {
                    items: { clientId: req.params.clientId }
                }
            }
        );

        // delete client
        collection = db.collection('clients');
        await collection.deleteOne({ _id: ObjectId(req.params.clientId) });

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

async function deleteFromWeb(files) {
    for (let i = 0; i < files.length; i++) {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(files[i].deleteUrl);

            const deleteBtn = '.link.link--delete';
            await page.waitForSelector(deleteBtn);
            await page.click(deleteBtn);

            const confirmDeleteBtn = '.btn.btn-input.default';
            await page.waitForSelector(confirmDeleteBtn);
            await page.click(confirmDeleteBtn);

            await browser.close();
        } catch (err) {
            console.log(err);
            continue;
        }
    }
}

export default router;
