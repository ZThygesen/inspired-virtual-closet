import express from 'express';
import { ObjectId } from 'mongodb';
import cuid2 from '@paralleldrive/cuid2';
import { helpers } from '../helpers.js';
import { schemaHelpers } from '../schema/helpers.js';
import { schema } from '../schema/outfits.schema.js';
import { auth } from './auth.js';
import ExpressFormidable from 'express-formidable';

const outfits = {
    async post(req, res, next) {
        try {
            const { db, bucket } = req.locals;
            const collection = db.collection('outfits');
            const { clientId } = req.params;
            const { fileSrc, stageItems, outfitName, filesUsed } = req.body;

            // create GCS destinations
            let gcsDest = `outfits/${cuid2.createId()}.png`;
            if (process.env.NODE_ENV === 'test') {
                gcsDest = 'test/' + gcsDest;
            }
            else if (process.env.NODE_ENV !== 'production') {
                gcsDest = 'dev/' + gcsDest;
            }

            const fileBuffer = await helpers.b64ToBuffer(fileSrc);
            const whiteBgBuffer = await helpers.addWhiteBackground(fileBuffer);
    
            // upload to GCS
            const url = await helpers.uploadToGCS(bucket, gcsDest, whiteBgBuffer);
    
            // create outfit object
            const outfit = {
                clientId: clientId,
                stageItems: stageItems,
                outfitName: outfitName,
                filesUsed: filesUsed,
                outfitUrl: url,
                gcsDest: gcsDest
            };
    
            // insert outfit into db
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
            const { db } = req.locals;
            const collection = db.collection('outfits');
            const { clientId } = req.params;
            const outfits = await collection.find({ clientId: clientId }).toArray();
            res.status(200).json(outfits);
        } catch (err) {
            next(err);
        }
    },

    async patchFull(req, res, next) {
        try {
            const { db, bucket } = req.locals;
            const collection = db.collection('outfits');
            const { outfitId } = req.params;
            const { fileSrc, stageItems, outfitName, filesUsed, gcsDest } = req.body;

            // make sure outfit exists
            const outfit = await collection.findOne({ _id: outfitId });
            if (!outfit) {
                throw helpers.createError(`cannot update outfit: no outfit with the id "${outfitId.toString()}" exists`, 400);
            }
    
            // create GCS destinations
            let newGcsDest = `outfits/${cuid2.createId()}.png`;
            if (process.env.NODE_ENV === 'test') {
                newGcsDest = 'test/' + newGcsDest;
            }
            else if (process.env.NODE_ENV !== 'production') {
                newGcsDest = 'dev/' + newGcsDest;
            }

            const fileBuffer = await helpers.b64ToBuffer(fileSrc);
            const whiteBgBuffer = await helpers.addWhiteBackground(fileBuffer);

            // upload new file to GCS
            const url = await helpers.uploadToGCS(bucket, newGcsDest, whiteBgBuffer);
    
            // update outfit in db            
            const result = await collection.updateOne(
                { _id: outfitId },
                {
                    $set: {
                        stageItems: stageItems,
                        outfitName: outfitName,
                        outfitUrl: url,
                        filesUsed: filesUsed,
                        gcsDest: newGcsDest,
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update failed: outfit not found with given outfit id', 404);
            }

            // delete original file from GCS
            await helpers.deleteFromGCS(bucket, gcsDest);
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async patchPartial(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('outfits');
            const { outfitId } = req.params;
            const { outfitName } = req.body;

            const result = await collection.updateOne(
                { _id: outfitId },
                { 
                    $set: {
                        outfitName: outfitName,
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
            const { db, bucket } = req.locals;
            const collection = db.collection('outfits');
            const { outfitId } = req.params;
    
            // check if outfit exists and has gcsDest
            const outfit = await collection.findOne({ _id: outfitId });
            if (!outfit?.gcsDest) {
                throw helpers.createError('outfit not found with given outfit id or is missing gcs destination', 404);
            }
    
            // delete file from GCS
            await helpers.deleteFromGCS(bucket, outfit.gcsDest);
    
            // delete from db
            const result = await collection.deleteOne({ _id: outfitId });

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

router.post('/:clientId', 
    auth.requireAdmin, 
    auth.checkPermissions, 
    ExpressFormidable(),
    schemaHelpers.validateParams(schema.post.params.schema),
    schemaHelpers.validateFields(schema.post.body.schema),
    outfits.post,
);
router.get('/:clientId', 
    auth.checkPermissions,
    schemaHelpers.validateParams(schema.get.params.schema),
    outfits.get,
);
router.patch('/:clientId/:outfitId', 
    auth.requireAdmin, 
    auth.checkPermissions, 
    ExpressFormidable(),
    schemaHelpers.validateParams(schema.patchFull.params.schema),
    schemaHelpers.validateFields(schema.patchFull.body.schema), 
    outfits.patchFull,
);
router.patch('/name/:clientId/:outfitId', 
    auth.requireAdmin, 
    auth.checkPermissions,
    schemaHelpers.validateParams(schema.patchPartial.params.schema),
    schemaHelpers.validateBody(schema.patchPartial.body.schema),
    outfits.patchPartial
);
router.delete('/:clientId/:outfitId', 
    auth.requireAdmin, 
    auth.checkPermissions,
    schemaHelpers.validateParams(schema.delete.params.schema), 
    outfits.delete
);

export { outfits, router as outfitsRouter };