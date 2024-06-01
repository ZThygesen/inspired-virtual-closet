import express from 'express';
import { ObjectId } from 'mongodb';
import ExpressFormidable from 'express-formidable';
import cuid2 from '@paralleldrive/cuid2';
import { helpers } from '../helpers.js';

const outfits = {
    async post(req, res, next) {
        try {
            // read in outfit fields
            const { fileSrc, stageItemsStr, outfitName, clientId } = req?.fields;

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

            const { db, bucket } = req.locals;
            const clientCollection = db.collection('clients');
            if ((await clientCollection.find({ _id: clientId }).toArray()).length !== 1) {
                throw helpers.createError(`cannot create outfit: no client or multiple clients with the id "${clientId}" exist`, 400);
            }
    
            // convert outfit file to buffer
            const fileBuffer = await helpers.b64ToBuffer(fileSrc);
    
            // create file destination
            let gcsDest = `outfits/${cuid2.createId()}.png`;
            if (process.env.NODE_ENV !== 'production') {
                gcsDest = 'dev/' + gcsDest;
            }
    
            // upload to GCS
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
            if (!req?.params?.clientId) {
                throw helpers.createError('client id is required to get client outfits', 400);
            }

            const { db } = req.locals;
            const clientCollection = db.collection('clients');
            
            if ((await clientCollection.find({ _id: req.params.clientId }).toArray()).length !== 1) {
                throw helpers.createError(`cannot get outfits: no client or multiple clients with the id "${req.params.clientId}" exist`, 400);
            }

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
            const { fileSrc, stageItemsStr, outfitName, gcsDest } = req?.fields;

            if (!fileSrc) {
                throw helpers.createError('file source is required to update outfit', 400);
            }

            if (!stageItemsStr) {
                throw helpers.createError('stage items string is required to update outfit', 400);
            }

            if (!outfitName) {
                throw helpers.createError('outfit name is required to update outfit', 400);
            }

            if (!gcsDest) {
                throw helpers.createError('gcsDest is required to update outfit', 400);
            }

            if (!req?.params?.outfitId) {
                throw helpers.createError('outfit id is required to update outfit', 400);
            }

            const { db, bucket } = req.locals;
    
            // delete original file
            await helpers.deleteFromGCS(bucket, gcsDest);
    
            // convert new outfit file to buffer
            const fileBuffer = await helpers.b64ToBuffer(fileSrc);
    
            // create new file destination
            let newGcsDest = `outfits/${cuid2.createId()}.png`;
            if (process.env.NODE_ENV !== 'production') {
                newGcsDest = 'dev/' + newGcsDest;
            }
    
            // upload to GCS
            const url = await helpers.uploadToGCS(bucket, newGcsDest, fileBuffer);
    
            // update outfit in db
            const stageItems = JSON.parse(stageItemsStr);
            const collection = db.collection('outfits');
            
            const result = await collection.updateOne(
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

            if (result.modifiedCount === 0) {
                throw helpers.createError('update failed: outfit not found with given outfit id', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async patchPartial(req, res, next) {
        try {
            if (!req?.body?.newName) {
                throw helpers.createError('outfit name is required to update outfit', 400);
            }

            if (!req?.params?.outfitId) {
                throw helpers.createError('outfit id is required to update outfit', 400);
            }

            const { db } = req.locals;
            const collection = db.collection('outfits');
            const result = await collection.updateOne(
                { _id: ObjectId(req.params.outfitId) },
                { 
                    $set: {
                        outfitName: req.body.newName
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update failed: outfit not found with given outfit id', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            if (!req?.params?.outfitId) {
                throw helpers.createError('outfit id is required to delete outfit', 400);
            }

            const { db, bucket } = req.locals;
            const collection = db.collection('outfits');
    
            // get outfit from db
            const outfit = await collection.findOne({ _id: ObjectId(req.params.outfitId) });

            if (!outfit?.gcsDest) {
                throw helpers.createError('outfit not found with given outfit id or is missing gcs destination', 404);
            }
    
            // delete file from GCS
            await helpers.deleteFromGCS(bucket, outfit.gcsDest);
    
            // delete from db
            const result = await collection.deleteOne({ _id: ObjectId(req.params.outfitId )});

            if (result.deletedCount === 0) {
                throw helpers.createError('deletion failed: outfit not found with given outfit id', 404);
            }
    
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