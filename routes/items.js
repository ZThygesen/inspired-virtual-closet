import express from 'express';
import cuid2 from '@paralleldrive/cuid2';
import path from 'path';
import { helpers } from '../helpers.js';
import { schemaHelpers } from '../schema/helpers.js';
import { schema } from '../schema/items.schema.js';
import { auth } from './auth.js';
import ExpressFormidable from 'express-formidable';

const items = {
    async post(req, res, next) {
        try {
            const { db, bucket } = req.locals;
            const collection = db.collection('items');
            const { clientId } = req.params;
            const { categoryId, fileSrc, fullFileName, tags, rmbg, crop } = req.body;

            if (!(await helpers.categoryExists(db, categoryId))) {
                throw helpers.createError(`cannot add item: no categories with the id "${categoryId}" exist`, 404);
            }

            if (!req?.user?.isSuperAdmin && !req?.user?.isAdmin) {
                if (!rmbg || !crop) {
                    throw helpers.createError('non-admins must remove background and crop image on item upload', 403);
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

            const item = {
                clientId: clientId,
                categoryId: categoryId,
                fileName: fileName,
                fullFileUrl: fullFileUrl,
                smallFileUrl: smallFileUrl,
                fullGcsDest: fullGcsDest,
                smallGcsDest: smallGcsDest,
                gcsId: gcsId,
                tags: tags,
            };
    
            // insert file object into db
            const result = await collection.insertOne(item);
            if (!result.insertedId) {
                throw helpers.createError('item was not inserted into database', 500);
            }

            if (!isSuperAdmin) {
                await helpers.deductCredits(db, clientId, clientCredits);
            }

            res.status(201).json({ message: 'Success!'});

        } 
        catch (err) {
            next(err);
        }
    },

    async get(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('items');
            const { clientId } = req.params;
            const items = await collection.find({ clientId: clientId }).toArray();
            res.status(200).json(items);
        } 
        catch (err) {
            next(err);
        }
    },

    async patchName(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('items');
            const { itemId } = req.params;
            const { name, tags } = req.body;

            const result = await collection.updateOne(
                { _id: itemId },
                {
                    $set: {
                        fileName: name,
                        tags : tags,
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update of item failed: item not found with given item id', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } 
        catch (err) {
            next(err);
        }
    },

    async patchCategory(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('items');
            const { itemId } = req.params;
            const { newCategoryId } = req.body;
    
            if (!(await helpers.categoryExists(db, newCategoryId))) {
                throw helpers.createError(`cannot change item category: no categories with the id "${newCategoryId}" exist`, 404);
            }

            const result = await collection.updateOne(
                { _id: itemId },
                {
                    $set: {
                        categoryId: newCategoryId
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('item category not updated', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } 
        catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            const { db, bucket } = req.locals;
            const collection = db.collection('items');
            const { itemId } = req.params;

            // get item from db
            const item = await collection.findOne({ _id: itemId });
            if (!item) {
                throw helpers.createError('failed to retrieve item from database', 500);
            }
            if (!item?.fullGcsDest || !item?.smallGcsDest) {
                throw helpers.createError('item does not have both a full and small gcs path', 500);
            }
    
            // delete items from GCS
            await helpers.deleteFromGCS(bucket, item.fullGcsDest);
            await helpers.deleteFromGCS(bucket, item.smallGcsDest);
    
            // then delete from db
            const result = await collection.deleteOne({ _id: itemId });

            if (result.deletedCount === 0) {
                throw helpers.createError('deletion of item failed: item not deleted from database', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } 
        catch (err) {
            next(err);
        }
    }
};

const router = express.Router();

router.post('/:clientId', 
    auth.checkPermissions,
    ExpressFormidable(),
    schemaHelpers.validateParams(schema.post.params.schema),
    schemaHelpers.validateFields(schema.post.body.schema),
    items.post,
);
router.get('/:clientId',
    auth.checkPermissions,
    schemaHelpers.validateParams(schema.get.params.schema),
    items.get,
);
router.patch('/:clientId/:itemId', 
    auth.checkPermissions, 
    schemaHelpers.validateParams(schema.patchName.params.schema),
    schemaHelpers.validateBody(schema.patchName.body.schema),
    items.patchName,
);
router.patch('/category/:clientId/:itemId', 
    auth.checkPermissions,
    schemaHelpers.validateParams(schema.patchCategory.params.schema),
    schemaHelpers.validateBody(schema.patchCategory.body.schema),
    items.patchCategory,
);
router.delete('/:clientId/:itemId', 
    auth.checkPermissions,
    schemaHelpers.validateParams(schema.delete.params.schema),
    items.delete,
);

export { items, router as itemsRouter };