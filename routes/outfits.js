import express from 'express';
import { ObjectId } from 'mongodb';
import ExpressFormidable from 'express-formidable';
import cuid2 from '@paralleldrive/cuid2';
import { helpers } from '../helpers.js';

const outfits = {
    async post(req, res, next) {
        try {
            // read in outfit fields
            const { fileSrc, stageItemsStr, outfitName, clientId } = req.fields;

            if (!fileSrc) {
                throw helpers.createError('file source is required to create outfit', 400);
            }

            if (!stageItemsStr) {
                throw helpers.createError('stage items string is required to create outfit', 400);
            }

            if (!outfitName) {
                throw helpers.createError('outfit name is required to create outfit', 400);
            }

            if (!clientId) {
                throw helpers.createError('client id is required to create outfit', 400);
            }

            const { db } = req.locals;
            const clientCollection = db.collection('clients');
            if ((await clientCollection.find({ _id: clientId }).toArray()).length !== 1) {
                throw helpers.createError(`no client or multiple clients with the id "${clientId}" was found`, 400);
            }
    
            // convert outfit file to buffer
            const fileBuffer = await helpers.b64ToBuffer(fileSrc);
    
            // create file destination
            let gcsDest = `outfits/${cuid2.createId()}.png`;
            if (process.env.NODE_ENV !== 'production') {
                gcsDest = 'dev/' + gcsDest;
            }
    
            // upload to GCS
            const { bucket } = req.locals;
            const url = await helpers.uploadToGCS(bucket, gcsDest, fileBuffer);
    
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
            const result = await collection.insertOne(outfit);

            if (!result.insertedId) {
                throw helpers.createError('outfit was not inserted into database', 500);
            }
    
            res.status(201).json({ message: 'Success!' });
    
        } catch (err) {
            next(err);
        }
    },

    async get(req, res, next) {
        try {
            const collection = db.collection('outfits');
            const outfits = await collection.find({ clientId: req.params.clientId }).toArray();
            res.status(200).json(outfits);
        } catch (err) {
            next(err);
        }
    },

    async patchFull(req, res, next) {
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
    },

    async patchPartial(req, res, next) {
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
    },

    async delete(req, res, next) {
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
    }
};

const router = express.Router();

router.post('/', ExpressFormidable(), outfits.post);
router.get('/:clientId', outfits.get);
router.patch('/:outfitId', ExpressFormidable(), outfits.patchFull);
router.patch('/name/:outfitId', outfits.patchPartial);
router.delete('/:outfitId', outfits.delete);

export { outfits, router as outfitsRouter };