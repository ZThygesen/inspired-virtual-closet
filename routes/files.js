import express from 'express';
import { ObjectId } from 'mongodb';
import ExpressFormidable from 'express-formidable';
import cuid2 from '@paralleldrive/cuid2';
import path from 'path';
import { helpers } from '../helpers.js';
import { auth } from './auth.js';

const files = {
    async post(req, res, next) {
        try {
            // read in file fields
            const { fileSrc, fullFileName, categoryId, rmbg, crop } = req?.fields;

            if (!fileSrc) {
                throw helpers.createError('file source is required to create file', 400);
            }

            if (!fullFileName) {
                throw helpers.createError('file name is required to create file', 400);
            }

            const clientId = req?.params?.clientId;
            if (!helpers.isValidId(clientId)) {
                throw helpers.createError('failed to add file: invalid or missing client id', 400);
            }

            let id;
            if (helpers.isOtherCategory(categoryId)) {
                id = 0;
            }
            else if (helpers.isValidId(categoryId)) {
                id = ObjectId(categoryId);
            }
            else {
                throw helpers.createError('failed to add file: invalid or missing category id', 400);
            }

            if (rmbg === null || rmbg === undefined) {
                throw helpers.createError('background removal option is required to create file', 400);
            }
            const parsedRmbg = rmbg === "true";
            
            if (crop === null || crop === undefined) {
                throw helpers.createError('crop image option is required to create file', 400);
            }
            const parsedCrop = crop === "true";

            const { db, bucket } = req.locals;
            const collection = db.collection('categories');
            if ((await collection.find({ _id: id }).toArray()).length !== 1) {
                throw helpers.createError(`cannot add file: no category or multiple categories with the id "${id.toString()}" exist`, 404);
            }

            if (!req?.user?.isSuperAdmin && !req?.user?.isAdmin && (!parsedRmbg || !parsedCrop)) {
                throw helpers.createError('non-admins must remove background and crop image on file upload', 403);
            }

            const isSuperAdmin = await helpers.isSuperAdmin(db, clientId);
            let clientCredits;
            if (!isSuperAdmin) {
                clientCredits = await helpers.getCredits(db, clientId);
                if (clientCredits <= 0) {
                    throw helpers.createError('client does not have any credits', 403);
                }
            }

            // create GCS destinations
            const gcsId = cuid2.createId();
            let fullGcsDest = `items/${gcsId}/full.png`;
            let smallGcsDest = `items/${gcsId}/small.png`;

            if (process.env.NODE_ENV === 'test') {
                fullGcsDest = 'test/' + fullGcsDest;
                smallGcsDest = 'test/' + smallGcsDest;
            }
            else if (process.env.NODE_ENV !== 'production') {
                fullGcsDest = 'dev/' + fullGcsDest;
                smallGcsDest = 'dev/' + smallGcsDest;
            }
            
            let fullImgBuffer;
            if (parsedRmbg) {
                fullImgBuffer = await helpers.removeBackground(fileSrc, parsedCrop);
            } else {
                fullImgBuffer = await helpers.b64ToBuffer(fileSrc);
            }

            const smallImgBuffer = await helpers.createImageThumbnail(fullImgBuffer, 300, 300);
            
            // create file object 
            const fileName = path.parse(fullFileName)?.name;
            if (!fileName) {
                throw helpers.createError('error parsing file name', 500);
            }

            const fullFileUrl = await helpers.uploadToGCS(bucket, fullGcsDest, fullImgBuffer);
            const smallFileUrl = await helpers.uploadToGCS(bucket, smallGcsDest, smallImgBuffer);

            const file = {
                clientId: clientId,
                fileName: fileName,
                fullFileUrl: fullFileUrl,
                smallFileUrl: smallFileUrl,
                fullGcsDest: fullGcsDest,
                smallGcsDest: smallGcsDest,
                gcsId: gcsId
            };
    
            // insert file object into db
            const result = await collection.updateOne(
                { _id: id },
                {
                    $push: {
                        items: file
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('insertion of file failed: category not found with given category id', 404);
            }

            if (!isSuperAdmin) {
                await helpers.deductCredits(db, clientId, clientCredits);
            }

            res.status(201).json({ message: 'Success!'});

        } catch (err) {
            next(err);
        }
    },

    async get(req, res, next) {
        try {
            const clientId = req?.params?.clientId;
            if (!helpers.isValidId(clientId)) {
                throw helpers.createError('failed to get files: invalid or missing client id', 400);
            }

            const { db } = req.locals;
            const collection = db.collection('categories');
            const files = await collection.aggregate([
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        items: { $filter: {
                            input: '$items',
                            as: 'item',
                            cond: { $eq: ['$$item.clientId', clientId] }
                        }},
                    }
                }
            ]).toArray();
            
            res.status(200).json(files);
        } catch (err) {
            next(err);
        }
    },

    async patchName(req, res, next) {
        try {
            const name = req?.body?.newName;
            if (!name) {
                throw helpers.createError('file name is required to update file name', 400);
            }

            let id = req?.params?.categoryId;
            if (helpers.isOtherCategory(id)) {
                id = 0;
            }
            else if (helpers.isValidId(id)) {
                id = ObjectId(id);
            }
            else {
                throw helpers.createError('failed to update file name: invalid or missing category id', 400);
            }

            const gcsId = req?.params?.gcsId;
            if (!gcsId) {
                throw helpers.createError('gcs id is required to update file name', 400);
            }

            const { db } = req.locals;
            const collection = db.collection('categories');
            const result = await collection.updateOne(
                { _id: id, 'items.gcsId': gcsId },
                {
                    $set: {
                        'items.$.fileName': name
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update of file name failed: category or file not found with given category or gcs id', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async patchCategory(req, res, next) {
        try {
            let newCategoryId = req?.body?.newCategoryId;
            if (helpers.isOtherCategory(newCategoryId)) {
                newCategoryId = 0;
            }
            else if (helpers.isValidId(newCategoryId)) {
                newCategoryId = ObjectId(newCategoryId);
            }
            else {
                throw helpers.createError('failed to update file category: invalid or missing new category id', 400);
            }

            let categoryId = req?.params?.categoryId;
            if (helpers.isOtherCategory(categoryId)) {
                categoryId = 0;
            }
            else if (helpers.isValidId(categoryId)) {
                categoryId = ObjectId(categoryId);
            }
            else {
                throw helpers.createError('failed to update file category: invalid or missing category id', 400);
            }
            
            const gcsId = req?.params?.gcsId;
            if (!req?.params?.gcsId) {
                throw helpers.createError('gcs id is required to update file category', 400);
            }

            const { db } = req.locals;
            const collection = db.collection('categories');

            if ((await collection.find({ _id: newCategoryId }).toArray()).length !== 1) {
                throw helpers.createError('cannot change file category: no category or multiple categories exist', 404);
            }
    
            // get file from current category and remove it
            const category = await collection.findOne({ _id: categoryId });
            const file = category?.items?.find(item => item?.gcsId === gcsId);

            if (!file) {
                throw helpers.createError('failed to retrieve file from database', 500);
            }

            let result = await collection.updateOne(
                { _id: categoryId },
                {
                    $pull: {
                        items: { gcsId: gcsId }
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update of file category failed: file not removed from current category', 404);
            }
    
            // now insert to new category
            result = await collection.updateOne(
                { _id: newCategoryId },
                {
                    $push: {
                        items: file
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update of file category failed: file not added to new category', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            let categoryId = req?.params?.categoryId;
            if (helpers.isOtherCategory(categoryId)) {
                categoryId = 0;
            } 
            else if (helpers.isValidId(categoryId)) {
                categoryId = ObjectId(categoryId);
            }
            else {
                throw helpers.createError('failed to delete file: invalid or missing category id', 400)
            }
            
            const gcsId = req?.params?.gcsId;
            if (!gcsId) {
                throw helpers.createError('gcs id is required to delete file', 400);
            }

            // get file from db
            const { db, bucket } = req.locals;
            const collection = db.collection('categories');

            const category = await collection.findOne({ _id: categoryId });
            const file = category?.items?.find(item => item?.gcsId === gcsId);

            if (!file?.fullGcsDest || !file?.smallGcsDest) {
                throw helpers.createError('failed to retrieve file from database', 500);
            }
    
            // delete files from GCS
            await helpers.deleteFromGCS(bucket, file.fullGcsDest);
            await helpers.deleteFromGCS(bucket, file.smallGcsDest);
    
            // then delete from db
            const result = await collection.updateOne(
                { _id: categoryId },
                {
                    $pull: {
                        items: { gcsId: gcsId }
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('deletion of file failed: file not deleted from database', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    }
};

const router = express.Router();

router.post('/:clientId', auth.checkPermissions, ExpressFormidable(), files.post);
router.get('/:clientId', auth.checkPermissions, files.get);
router.patch('/:clientId/:categoryId/:gcsId', auth.checkPermissions, files.patchName);
router.patch('/category/:clientId/:categoryId/:gcsId', auth.checkPermissions, files.patchCategory);
router.delete('/:clientId/:categoryId/:gcsId', auth.checkPermissions, files.delete);

export { files, router as filesRouter };