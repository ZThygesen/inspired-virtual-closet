import express from 'express';
const router = express.Router();
import { db, bucket } from '../server.js';
import { ObjectId } from 'mongodb';
import { parse } from 'path';
import imglyRemoveBackground from '@imgly/background-removal-node';
import ExpressFormidable from 'express-formidable';
import { createId } from '@paralleldrive/cuid2';

// upload file
router.post('/', ExpressFormidable(), async (req, res, next) => {
    try {
        // read in file fields
        const { fileSrc, fullFileName, clientId, categoryId } = req.fields;

        // convert file into blob and remove background
        const blob = await fetch(fileSrc).then(res => res.blob());
        const output = await imglyRemoveBackground(blob);
        const fileBuffer = await output.arrayBuffer().then(arrayBuffer => Buffer.from(arrayBuffer));

        // upload file to GCS
        const gcsId = createId();
        const gcsDest = `items/${gcsId}.png`;

        const gcsFile = bucket.file(gcsDest);
        await gcsFile.save(fileBuffer);
        
        const url = await gcsFile.publicUrl();

        // create file object 
        const fileName = parse(fullFileName).name;
        const file = {
            clientId: clientId,
            fileName: fileName,
            fullFileUrl: url,
            gcsId: gcsId,
            gcsDest: gcsDest
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
        
        res.status(201).json({ message: 'Success!'});
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

// TODO: switch file category


// delete file
router.delete('/:categoryId/:gcsId', async (req, res, next) => {
    try {
        // get file from db
        const collection = db.collection('categories');
        const id = req.params.categoryId === '0' ? 0 : ObjectId(req.params.categoryId);
        const document = await collection.findOne({ _id: id });
        const file = document.items.find(item => item.gcsId === req.params.gcsId);

        // delete file from GCS
        const gcsFile = bucket.file(file.gcsDest);
        await gcsFile.delete();

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

