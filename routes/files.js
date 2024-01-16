import express from 'express';
const router = express.Router();
import { db, serviceAuth, bucket, io } from '../server.js';
import { ObjectId } from 'mongodb';
import { parse } from 'path';
import ExpressFormidable from 'express-formidable';
import { createId } from '@paralleldrive/cuid2';
import axios from 'axios';

// upload file
router.post('/', ExpressFormidable(), async (req, res, next) => {
    try {
        // read in file fields
        const { fileSrc, fullFileName, clientId, categoryId, requestId } = req.fields;

        // acknowledge request
        res.status(201).json({ message: 'Success!'});

        // get id token to use google cloud function
        const client = await serviceAuth.getIdTokenClient(process.env.GCF_URL);
        const idToken = await client.idTokenProvider.fetchIdToken(process.env.GCF_URL)
        
        // create GCS destinations
        const gcsId = createId();
        let fullGcsDest = `items/${gcsId}/full.png`;
        let smallGcsDest = `items/${gcsId}/small.png`;

        if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'review' || process.env.NODE_ENV === 'staging') {
            fullGcsDest = 'dev/' + fullGcsDest;
            smallGcsDest = 'dev/' + smallGcsDest;
        }

        // send file to google cloud function to remove background and store
        const response = await axios.post(
            'https://us-central1-avid-invention-410701.cloudfunctions.net/upload-item', 
            { fileSrc, fullGcsDest, smallGcsDest }, 
            { headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const fullFileUrl = response.data.fullFileUrl;
        const smallFileUrl = response.data.smallFileUrl;

        // create file object 
        const fileName = parse(fullFileName).name;
        const file = {
            clientId: clientId,
            fileName: fileName,
            fullFileUrl: fullFileUrl,
            smallFileUrl: smallFileUrl,
            fullGcsDest: fullGcsDest,
            smallGcsDest: smallGcsDest,
            gcsId: gcsId,
            tags: []
        };

        // insert file object into db
        const collection = db.collection('categories');
        const id = categoryId === '0' ? 0 : ObjectId(categoryId);
        await collection.updateOne(
            { _id: id },
            {
                $push: {
                    items: file
                }
            }
        );

        // upload complete
        io.emit('uploadComplete', { requestId });
    } catch (err) {
        err.status = 400;
        next(err);
    }
});

// get files for given client
router.get('/:clientId', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        const files = await collection.aggregate([
            {
                $project: {
                    _id: 1,
                    name: 1,
                    items: { $filter: {
                        input: '$items',
                        as: 'item',
                        cond: { $eq: ['$$item.clientId', req.params.clientId] }
                    }},
                }
            }
        ]).toArray();
        
        res.json(files);
    } catch (err) {
        next(err);
    }
});

// update file name
router.patch('/:categoryId/:gcsId', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        const id = req.params.categoryId === '0' ? 0 : ObjectId(req.params.categoryId);
        await collection.updateOne(
            { _id: id, 'items.gcsId': req.params.gcsId },
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

// switch file category
router.patch('/category/:categoryId/:gcsId', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        const currId = req.params.categoryId === '0' ? 0 : ObjectId(req.params.categoryId);
        const newId = req.body.newCategoryId === 0 ? 0 : ObjectId(req.body.newCategoryId)

        // get file from current category and remove it
        const category = await collection.findOne({ _id: currId });
        const file = category.items.find(item => item.gcsId === req.params.gcsId);
        await collection.updateOne(
            { _id: currId },
            {
                $pull: {
                    items: { gcsId: req.params.gcsId }
                }
            }
        );

        // now insert to new category
        await collection.updateOne(
            { _id: newId },
            {
                $push: {
                    items: file
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
router.delete('/:categoryId/:gcsId', async (req, res, next) => {
    try {
        // get file from db
        const collection = db.collection('categories');
        const id = req.params.categoryId === '0' ? 0 : ObjectId(req.params.categoryId);
        const document = await collection.findOne({ _id: id });
        const file = document.items.find(item => item.gcsId === req.params.gcsId);

        // delete files from GCS
        const fullGcsFile = bucket.file(file.fullGcsDest);
        await fullGcsFile.delete();

        const smallGcsFile = bucket.file(file.smallGcsDest);
        await smallGcsFile.delete();

        // then delete from db
        await collection.updateOne(
            { _id: id },
            {
                $pull: {
                    items: { gcsId: req.params.gcsId }
                }
            }
        );

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

export default router;

