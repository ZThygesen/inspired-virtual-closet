import express from 'express';
import { ObjectId } from 'mongodb';
import ExpressFormidable from 'express-formidable';
import cuid2 from '@paralleldrive/cuid2';
import { helpers } from '../helpers.js';
import { auth } from './auth.js';

const outfits = {
    async post(req, res, next) {
        try {
            // read in outfit fields
            const { fileSrc, stageItemsStr, outfitName } = req?.fields;

            if (!fileSrc) {
                throw helpers.createError('file source is required to create outfit', 400);
            }

            if (!stageItemsStr || (typeof stageItemsStr !== 'string')) {
                throw helpers.createError('stage items string is missing or invalid', 400);
            }

            if (!outfitName) {
                throw helpers.createError('outfit name is required to create outfit', 400);
            }

            const clientId = req?.params?.clientId;
            if (!helpers.isValidId(clientId)) {
                throw helpers.createError('failed to update outfit: invalid or missing client id', 400);
            }

            const stageItems = JSON.parse(stageItemsStr);

            const { db, bucket } = req.locals;
            const clientCollection = db.collection('clients');
            if ((await clientCollection.find({ _id: ObjectId(clientId) }).toArray()).length !== 1) {
                throw helpers.createError(`cannot create outfit: no client or multiple clients with the id "${clientId}" exist`, 400);
            }
    
            // convert outfit file to buffer
            const fileBuffer = await helpers.b64ToBuffer(fileSrc);
            const whiteBgBuffer = await helpers.addWhiteBackground(fileBuffer);
    
            // create file destination
            let gcsDest = `outfits/${cuid2.createId()}.png`;
            if (process.env.NODE_ENV === 'test') {
                gcsDest = 'test/' + gcsDest;
            }
            else if (process.env.NODE_ENV !== 'production') {
                gcsDest = 'dev/' + gcsDest;
            }
    
            // upload to GCS
            const url = await helpers.uploadToGCS(bucket, gcsDest, whiteBgBuffer);
    
            // create outfit object
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
            const clientId = req?.params?.clientId;
            if (!helpers.isValidId(clientId)) {
                throw helpers.createError('failed to get outfits: invalid or missing client id', 400);
            }

            const { db } = req.locals;
            const clientCollection = db.collection('clients');
            
            if ((await clientCollection.find({ _id: ObjectId(clientId) }).toArray()).length !== 1) {
                throw helpers.createError(`cannot get outfits: no client or multiple clients with the id "${clientId}" exist`, 400);
            }

            const collection = db.collection('outfits');
            const outfits = await collection.find({ clientId: clientId }).toArray();
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

            const outfitId = req?.params?.outfitId;
            if (!helpers.isValidId(outfitId)) {
                throw helpers.createError('failed to update outfit content: invalid or missing outfit id', 400);
            }

            const stageItems = JSON.parse(stageItemsStr);
    
            // convert new outfit file to buffer
            const fileBuffer = await helpers.b64ToBuffer(fileSrc);
            const whiteBgBuffer = await helpers.addWhiteBackground(fileBuffer);
    
            // create new file destination
            let newGcsDest = `outfits/${cuid2.createId()}.png`;
            if (process.env.NODE_ENV === 'test') {
                newGcsDest = 'test/' + newGcsDest;
            }
            else if (process.env.NODE_ENV !== 'production') {
                newGcsDest = 'dev/' + newGcsDest;
            }
            
            const { db, bucket } = req.locals;
            const collection = db.collection('outfits');
            if ((await collection.find({ _id: ObjectId(outfitId) }).toArray()).length !== 1) {
                throw helpers.createError(`cannot create outfit: no outfit or multiple outfits with the id "${outfitId}" exist`, 400);
            }

            // delete original file
            await helpers.deleteFromGCS(bucket, gcsDest);

            // upload to GCS
            const url = await helpers.uploadToGCS(bucket, newGcsDest, whiteBgBuffer);
    
            // update outfit in db            
            const result = await collection.updateOne(
                { _id: ObjectId(outfitId) },
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
            const name = req?.body?.newName;
            if (!name) {
                throw helpers.createError('outfit name is required to update outfit', 400);
            }

            const outfitId = req?.params?.outfitId;
            if (!helpers.isValidId(outfitId)) {
                throw helpers.createError('failed to update outfit name: invalid or missing outfit id', 400);
            }

            const { db } = req.locals;
            const collection = db.collection('outfits');
            const result = await collection.updateOne(
                { _id: ObjectId(outfitId) },
                { 
                    $set: {
                        outfitName: name
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
            const outfitId = req?.params?.outfitId;
            if (!helpers.isValidId(outfitId)) {
                throw helpers.createError('failed to delete outfit: invalid or missing outfit id', 400);
            }

            const { db, bucket } = req.locals;
            const collection = db.collection('outfits');
    
            // get outfit from db
            const outfit = await collection.findOne({ _id: ObjectId(outfitId) });

            if (!outfit?.gcsDest) {
                throw helpers.createError('outfit not found with given outfit id or is missing gcs destination', 404);
            }
    
            // delete file from GCS
            await helpers.deleteFromGCS(bucket, outfit.gcsDest);
    
            // delete from db
            const result = await collection.deleteOne({ _id: ObjectId(outfitId )});

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

router.post('/:clientId', auth.requireAdmin, auth.checkPermissions, ExpressFormidable(), outfits.post);
router.get('/:clientId', auth.checkPermissions, outfits.get);
router.patch('/:clientId/:outfitId', auth.requireAdmin, auth.checkPermissions, ExpressFormidable(), outfits.patchFull);
router.patch('/name/:clientId/:outfitId', auth.requireAdmin, auth.checkPermissions, outfits.patchPartial);
router.delete('/:clientId/:outfitId', auth.requireAdmin, auth.checkPermissions, outfits.delete);

export { outfits, router as outfitsRouter };