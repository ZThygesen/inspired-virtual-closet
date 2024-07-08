import express from 'express';
import { ObjectId } from 'mongodb';
import { helpers } from '../helpers.js';
import { auth } from './auth.js';

const shopping = {
    async post(req, res, next) {
        try {
            const itemName = req?.body?.itemName;
            if (!itemName) {
                throw helpers.createError('item name is required to create shopping item', 400);
            }

            const itemLink = req?.body?.itemLink;
            if (!itemLink) {
                throw helpers.createError('item link is required to create shopping item', 400);
            }

            const imageLink = req?.body?.imageLink;
            if (!imageLink) {
                throw helpers.createError('image link is required to create shopping item', 400);
            }
            
            const notes = req?.body?.notes;

            const clientId = req?.params?.clientId;
            if (!helpers.isValidId(clientId)) {
                throw helpers.createError('failed to create shopping item: invalid or missing client id', 400);
            }
    
            // create shopping item object
            const shoppingItem = {
                clientId: clientId,
                itemName: itemName,
                itemLink: itemLink,
                imageLink: imageLink,
                notes: notes || 'None',
                purchased: false
            };
    
            // insert shopping item into db
            const { db } = req.locals;
            const collection = db.collection('shopping');
            const result = await collection.insertOne(shoppingItem);

            if (!result.insertedId) {
                throw helpers.createError('shopping item was not inserted into database', 500);
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
                throw helpers.createError('failed to get shopping items: invalid or missing client id', 400);
            }

            const { db } = req.locals;
            const collection = db.collection('shopping');
            const shoppingItems = await collection.find({ clientId: clientId }).toArray();
            res.status(200).json(shoppingItems);
        } catch (err) {
            next(err);
        }
    },

    async patchFull(req, res, next) {
        try {
            const itemName = req?.body?.newItemName;
            if (!itemName) {
                throw helpers.createError('item name is required to update shopping item', 400);
            }

            const itemLink = req?.body?.newItemLink;
            if (!itemLink) {
                throw helpers.createError('item link is required to update shopping item', 400);
            }

            const imageLink = req?.body?.newImageLink;
            if (!imageLink) {
                throw helpers.createError('image link is required to update shopping item', 400);
            }
            
            const notes = req?.body?.newNotes;

            const purchased = req?.body?.newPurchased;
            if (purchased === null || purchased === undefined) {
                throw helpers.createError('purchased status is required to update shopping item', 400);
            }

            const shoppingId = req?.params?.shoppingId;
            if (!helpers.isValidId(shoppingId)) {
                throw helpers.createError('failed to update shopping item: invalid or missing shopping id', 400);
            }
            
            const { db } = req.locals;
            const collection = db.collection('shopping');
    
            // update shopping item in db            
            const result = await collection.updateOne(
                { _id: ObjectId(shoppingId) },
                {
                    $set: {
                        itemName: itemName,
                        itemLink: itemLink,
                        imageLink: imageLink,
                        notes: notes || 'None',
                        purchased: purchased
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update failed: shopping item not updated', 500);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async patchPurchased(req, res, next) {
        try {
            const purchased = req?.body?.newPurchased;
            if (purchased === null || purchased === undefined) {
                throw helpers.createError('purchased status is required to update shopping item', 400);
            }

            const shoppingId = req?.params?.shoppingId;
            if (!helpers.isValidId(shoppingId)) {
                throw helpers.createError('failed to update shopping item purchased status: invalid or missing shopping id', 400);
            }

            const { db } = req.locals;
            const collection = db.collection('shopping');
            const result = await collection.updateOne(
                { _id: ObjectId(shoppingId) },
                { 
                    $set: {
                        purchased: purchased
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update failed: shopping item purchased status not updated', 500);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            const shoppingId = req?.params?.shoppingId;
            if (!helpers.isValidId(shoppingId)) {
                throw helpers.createError('failed to delete shopping item: invalid or missing shopping id', 400);
            }

            // delete from db
            const { db } = req.locals;
            const collection = db.collection('shopping');
            const result = await collection.deleteOne({ _id: ObjectId(shoppingId)});

            if (result.deletedCount === 0) {
                throw helpers.createError('deletion failed: shopping item not deleted', 500);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    }
};

const router = express.Router();

router.post('/:clientId', auth.requireAdmin, auth.checkPermissions, shopping.post);
router.get('/:clientId', auth.checkPermissions, shopping.get);
router.patch('/:clientId/:shoppingId', auth.requireAdmin, auth.checkPermissions, shopping.patchFull);
router.patch('/purchased/:clientId/:shoppingId', auth.checkPermissions, shopping.patchPurchased);
router.delete('/:clientId/:shoppingId', auth.requireAdmin, auth.checkPermissions, shopping.delete);

export { shopping, router as shoppingRouter };