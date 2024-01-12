import express from 'express';
const router = express.Router();
import { db, bucket } from '../server.js';
import { ObjectId } from 'mongodb';
import ExpressFormidable from 'express-formidable';
import { createId } from '@paralleldrive/cuid2';

// create outfit
router.post('/', ExpressFormidable(), async (req, res, next) => {
    try {
        // read in outfit fields
        const { fileSrc, stageItemsStr, outfitName, clientId } = req.fields;

        // convert outfit file to buffer
        const blob = await fetch(fileSrc).then(res => res.blob());
        const fileBuffer = await blob.arrayBuffer().then(arrayBuffer => Buffer.from(arrayBuffer));
        
        // upload file to GCS
        let gcsDest = `outfits/${createId()}.png`;

        if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'review' || process.env.NODE_ENV === 'staging') {
            gcsDest = 'dev/' + gcsDest;
        }

        const gcsFile = bucket.file(gcsDest);
        await gcsFile.save(fileBuffer);

        const url = await gcsFile.publicUrl();

        // create outfit object
        const stageItems = JSON.parse(stageItemsStr);
        const outfit = {
            clientId: clientId,
            stageItems: stageItems,
            outfitName: outfitName,
            outfitUrl: url,
            gcsDest: gcsDest
        };

        // insert outfit into db
        const collection = db.collection('outfits');
        await collection.insertOne(outfit);

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
router.patch('/:outfitId', ExpressFormidable(), async (req, res, next) => {
    try {
        // read in outfit fields
        const { fileSrc, stageItemsStr, outfitName, gcsDest } = req.fields;

        // convert outfit file to buffer
        const blob = await fetch(fileSrc).then(res => res.blob());
        const fileBuffer = await blob.arrayBuffer().then(arrayBuffer => Buffer.from(arrayBuffer));

        // delete original file
        const gcsFile = bucket.file(gcsDest)
        await gcsFile.delete();

        // upload new file to GCS
        const newGcsDest = `outfits/${createId()}.png`;
        const newGcsFile = bucket.file(newGcsDest)
        await newGcsFile.save(fileBuffer);

        const url = await newGcsFile.publicUrl();

        // update outfit in db
        const stageItems = JSON.parse(stageItemsStr);

        const collection = db.collection('outfits');
        await collection.updateOne(
            { _id: ObjectId(req.params.outfitId) },
            {
                $set: {
                    stageItems: stageItems,
                    outfitName: outfitName,
                    outfitUrl: url,
                    gcsDest: newGcsDest
                }
            }
        );

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

// update only outfit name
router.patch('/name/:outfitId', async (req, res, next) => {
    try {
        const collection = db.collection('outfits');
        await collection.updateOne(
            { _id: ObjectId(req.params.outfitId) },
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

        // get outfit from db
        const outfit = await collection.findOne({ _id: ObjectId(req.params.outfitId) });

        // delete file from GCS
        const gcsFile = bucket.file(outfit.gcsDest);
        await gcsFile.delete();

        // delete from db
        await collection.deleteOne({ _id: ObjectId(req.params.outfitId )});

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});




export default router;