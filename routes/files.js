import express from 'express';
import { ObjectId } from 'mongodb';
import ExpressFormidable from 'express-formidable';
import cuid2 from '@paralleldrive/cuid2';
import path from 'path';
import { helpers } from '../helpers.js';

const files = {
    async post(req, res, next) {
        try {
            // read in file fields
            const { fileSrc, fullFileName, clientId, categoryId, rmbg } = req?.fields;
            
            if (!fileSrc) {
                throw helpers.createError('file source is required to create file', 400);
            }

            if (!fullFileName) {
                throw helpers.createError('file name is required to create file', 400);
            }

            if (!clientId) {
                throw helpers.createError('client id is required to create file', 400);
            }

            if (!categoryId && categoryId !== 0) {
                throw helpers.createError('category id is required to create file', 400);
            }

            if (rmbg === null || rmbg === undefined) {
                throw helpers.createError('background removal option is required to create file', 400);
            }

            // create GCS destinations
            const gcsId = cuid2.createId();
            let fullGcsDest = `items/${gcsId}/full.png`;
            let smallGcsDest = `items/${gcsId}/small.png`;
    
            if (process.env.NODE_ENV !== 'production') {
                fullGcsDest = 'dev/' + fullGcsDest;
                smallGcsDest = 'dev/' + smallGcsDest;
            }
            
            let fullImgBuffer;
            if (rmbg) {
                fullImgBuffer = await helpers.removeBackground(fileSrc);
            } else {
                fullImgBuffer = await helpers.b64ToBuffer(fileSrc);
            }

            const smallImgBuffer = await helpers.createImageThumbnail(fullImgBuffer, 300, 300);
            
            const { db, bucket } = req.locals;

            const fullFileUrl = await helpers.uploadToGCS(bucket, fullGcsDest, fullImgBuffer);
            const smallFileUrl = await helpers.uploadToGCS(bucket, smallGcsDest, smallImgBuffer);
            
            // create file object 
            const fileName = path.parse(fullFileName)?.name;
            if (!fileName) {
                throw helpers.createError('error parsing file name', 500);
            }

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
            const collection = db.collection('categories');
            const id = categoryId === '0' ? 0 : ObjectId(categoryId);
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

            res.status(201).json({ message: 'Success!'});

        } catch (err) {
            next(err);
        }
    },

    async get(req, res, next) {
        try {
            if (!req?.params?.clientId) {
                throw helpers.createError('client id is required to get files', 400);
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
                            cond: { $eq: ['$$item.clientId', req.params.clientId] }
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
            if (!req?.body?.newName) {
                throw helpers.createError('file name is required to update file name', 400);
            }

            if (!req?.params?.categoryId && req?.params?.categoryId !== 0) {
                throw helpers.createError('category id is required to update file name', 400);
            }

            if (!req?.params?.gcsId) {
                throw helpers.createError('gcs id is required to update file name', 400);
            }

            const { db } = req.locals;
            const collection = db.collection('categories');
            const id = req.params.categoryId === '0' ? 0 : ObjectId(req.params.categoryId);
            const result = await collection.updateOne(
                { _id: id, 'items.gcsId': req.params.gcsId },
                {
                    $set: {
                        'items.$.fileName': req.body.newName
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
            if (!req?.body?.newCategoryId && req?.body?.newCategoryId !== 0) {
                throw helpers.createError('new category id is required to update file category', 400);
            }

            if (!req?.params?.categoryId && req?.params?.categoryId !== 0) {
                throw helpers.createError('current category id is required to update file category', 400);
            }

            if (!req?.params?.gcsId) {
                throw helpers.createError('gcs id is required to update file category', 400);
            }

            const { db } = req.locals;
            const collection = db.collection('categories');
            const currId = req.params.categoryId === '0' ? 0 : ObjectId(req.params.categoryId);
            const newId = req.body.newCategoryId === 0 ? 0 : ObjectId(req.body.newCategoryId)
    
            // get file from current category and remove it
            const category = await collection.findOne({ _id: currId });
            const file = category?.items?.find(item => item?.gcsId === req.params.gcsId);

            if (!file) {
                throw helpers.createError('failed to retrieve file from database', 500);
            }

            let result = await collection.updateOne(
                { _id: currId },
                {
                    $pull: {
                        items: { gcsId: req.params.gcsId }
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update of file category failed: file not removed from current category', 404);
            }
    
            // now insert to new category
            result = await collection.updateOne(
                { _id: newId },
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
            if (!req?.params?.categoryId && req?.params?.categoryId !== 0) {
                throw helpers.createError('category id is required to delete file', 400);
            }

            if (!req?.params?.gcsId) {
                throw helpers.createError('gcs id is required to delete file', 400);
            }

            // get file from db
            const { db, bucket } = req.locals;
            const collection = db.collection('categories');
            const id = req.params.categoryId === '0' ? 0 : ObjectId(req.params.categoryId);
            const category = await collection.findOne({ _id: id });
            const file = category?.items?.find(item => item?.gcsId === req.params.gcsId);

            if (!file?.fullGcsDest || !file?.smallGcsDest) {
                throw helpers.createError('failed to retrieve file from database', 500);
            }
    
            // delete files from GCS
            await helpers.deleteFromGCS(bucket, file.fullGcsDest);
            await helpers.deleteFromGCS(bucket, file.smallGcsDest);
    
            // then delete from db
            const result = await collection.updateOne(
                { _id: id },
                {
                    $pull: {
                        items: { gcsId: req.params.gcsId }
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

router.post('/', ExpressFormidable(), files.post);
router.get('/:clientId', files.get);
router.patch('/:categoryId/:gcsId', files.patchName);
router.patch('/category/:categoryId/:gcsId', files.patchCategory);
router.delete('/:categoryId/:gcsId', files.delete);

export { files, router as filesRouter };