import express from 'express';
const router = express.Router();
import { db, bucket } from '../server.js';
import { ObjectId } from 'mongodb';
import ExpressFormidable from 'express-formidable';
import { createId } from '@paralleldrive/cuid2';
import { helpers } from '../helpers';

// create outfit
router.post('/', ExpressFormidable(), async (req, res, next) => {
    try {
        // read in outfit fields
        const { fileSrc, stageItemsStr, outfitName, clientId } = req.fields;

        // convert outfit file to buffer
        const fileBuffer = await helpers.b64ToBuffer(fileSrc);

        // create file destination
        let gcsDest = `outfits/${createId()}.png`;
        if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'review' || process.env.NODE_ENV === 'staging') {
            gcsDest = 'dev/' + gcsDest;
        }

        // upload to GCS
        const url = await helpers.uploadToGCS(gcsDest, fileBuffer);

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
        next(err);
    }
});

// get outfits for given client
router.get('/:clientId', async (req, res, next) => {
    try {
        const collection = db.collection('outfits');
        const outfits = await collection.find({ clientId: req.params.clientId }).toArray();
        res.status(200).json(outfits);
    } catch (err) {
        next(err);
    }
});

// update outfit content
router.patch('/:outfitId', ExpressFormidable(), async (req, res, next) => {
    try {
        // read in outfit fields
        const { fileSrc, stageItemsStr, outfitName, gcsDest } = req.fields;

        // delete original file
        await helpers.deleteFromGCS(gcsDest);

        // convert new outfit file to buffer
        const fileBuffer = await helpers.b64ToBuffer(fileSrc);

        // create new file destination
        let newGcsDest = `outfits/${createId()}.png`;
        if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'review' || process.env.NODE_ENV === 'staging') {
            newGcsDest = 'dev/' + newGcsDest;
        }

        // upload to GCS
        const url = await helpers.uploadToGCS(newGcsDest, fileBuffer);

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

        res.status(200).json({ message: 'Success!' });
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

        res.status(200).json({ message: 'Success!' });
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
        await helpers.deleteFromGCS(outfit.gcsDest);

        // delete from db
        await collection.deleteOne({ _id: ObjectId(req.params.outfitId )});

        res.status(200).json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

export default router;