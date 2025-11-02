import express from 'express';
import cuid2 from '@paralleldrive/cuid2';
import path from 'path';
import { helpers } from '../helpers.js';
import { schemaHelpers } from '../schema/helpers.js';
import { schema } from '../schema/files.schema.js';
import { auth } from './auth.js';
import ExpressFormidable from 'express-formidable';

const files = {
    async post(req, res, next) {
        try {
            const { db, bucket } = req.locals;
            const collection = db.collection('categories');
            const { clientId, categoryId } = req.params;
            const { fileSrc, fullFileName, tags, rmbg, crop } = req.body;
            if ((await collection.find({ _id: categoryId }).toArray()).length !== 1) {
                throw helpers.createError(`cannot add file: no category or multiple categories with the id "${categoryId.toString()}" exist`, 404);
            }

            if (!req?.user?.isSuperAdmin && !req?.user?.isAdmin) {
                if (!rmbg || !crop) {
                    throw helpers.createError('non-admins must remove background and crop image on file upload', 403);
                }
            }

            let clientCredits;
            const isSuperAdmin = await helpers.isSuperAdmin(db, clientId);
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
            if (rmbg) {
                fullImgBuffer = await helpers.removeBackground(fileSrc, crop);
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
                gcsId: gcsId,
                tags: tags,
            };
    
            // insert file object into db
            const result = await collection.updateOne(
                { _id: categoryId },
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
            const { db } = req.locals;
            const collection = db.collection('categories');
            const { clientId } = req.params;

            const files = await collection.aggregate([
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        group: 1,
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
            const { db } = req.locals;
            const collection = db.collection('categories');
            const { categoryId, gcsId } = req.params;
            const { name, tags } = req.body;

            const result = await collection.updateOne(
                { _id: categoryId, 'items.gcsId': gcsId },
                {
                    $set: {
                        'items.$.fileName': name,
                        'items.$.tags' : tags
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
            const { db } = req.locals;
            const collection = db.collection('categories');
            const { categoryId, gcsId } = req.params;
            const { newCategoryId } = req.body;
    
            // get file from current category
            const category = await collection.findOne({ _id: categoryId });
            const file = category?.items?.find(item => item?.gcsId === gcsId);

            if (!file) {
                throw helpers.createError('failed to retrieve file from database', 500);
            }

            // insert into new category
            let result = await collection.updateOne(
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

            // remove from old category
            result = await collection.updateOne(
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
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            const { db, bucket } = req.locals;
            const collection = db.collection('categories');
            const { categoryId, gcsId } = req.params;

            // get file from db
            const category = await collection.findOne({ _id: categoryId });
            const file = category?.items?.find(item => item?.gcsId === gcsId);

            if (!file) {
                throw helpers.createError('failed to retrieve file from database', 500);
            }
            if (!file?.fullGcsDest || !file?.smallGcsDest) {
                throw helpers.createError('file does not have both a full and small gcs path', 500);
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

router.post('/:clientId/:categoryId', 
    auth.checkPermissions,
    ExpressFormidable(),
    schemaHelpers.validateParams(schema.post.params.schema),
    schemaHelpers.validateFields(schema.post.body.schema),
    files.post,
);
router.get('/:clientId',
    auth.checkPermissions,
    schemaHelpers.validateParams(schema.get.params.schema),
    files.get,
);
router.patch('/:clientId/:categoryId/:gcsId', 
    auth.checkPermissions, 
    schemaHelpers.validateParams(schema.patchName.params.schema),
    schemaHelpers.validateBody(schema.patchName.body.schema),
    files.patchName,
);
router.patch('/category/:clientId/:categoryId/:gcsId', 
    auth.checkPermissions, 
    schemaHelpers.validateParams(schema.patchCategory.params.schema),
    schemaHelpers.validateBody(schema.patchCategory.body.schema),
    files.patchCategory,
);
router.delete('/:clientId/:categoryId/:gcsId', 
    auth.checkPermissions,
    schemaHelpers.validateParams(schema.delete.params.schema),
    files.delete,
);

export { files, router as filesRouter };