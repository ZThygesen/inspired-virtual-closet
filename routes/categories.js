import express from 'express';
import { helpers } from '../helpers.js';
import { schemaHelpers } from '../schema/helpers.js';
import { schema } from '../schema/categories.schema.js';
import { auth } from './auth.js';

const categories = {
    async post(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('categories');
            const { name, group, type, clientViewItems, clientAddItems, rmbgItems } = req.body;
    
            if ((await collection.find({ name: name }).toArray()).length > 0) {
                throw helpers.createError(`a category with the name "${name}" already exists`, 400);
            }
    
            const categoryEntry = {
                name: name,
                group: group || '',
                type: type,
                clientViewItems: clientViewItems,
                clientAddItems: clientAddItems,
                rmbgItems: rmbgItems,
            };
    
            const result = await collection.insertOne(categoryEntry);
            if (!result.insertedId) throw helpers.createError('category was not inserted into database', 500);
    
            res.status(201).json({ message: 'Success!' });
        } 
        catch (err) {
            next(err);
        }
    },

    async get(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('categories');
            const categories = await collection.find({ }).toArray();

            res.status(200).json(categories)
        } 
        catch (err) {
            next(err);
        }
    },

    async patch(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('categories');
            const { categoryId } = req.params;
            const { name, group, type, clientViewItems, clientAddItems, rmbgItems } = req.body;

            // if the new category name already exists, throw error
            const currCategory = await collection.findOne({ _id: categoryId });
            if (currCategory
                && currCategory.name !== name
                && (await collection.find({ name: name }).toArray()).length > 0
            ) {
                throw helpers.createError(`a category with the name "${name}" already exists`, 400)
            }

            const result = await collection.updateOne(
                { _id: categoryId },
                {
                    $set: {
                        name: name,
                        group: group || '',
                        type: type,
                        clientViewItems: clientViewItems,
                        clientAddItems: clientAddItems,
                        rmbgItems: rmbgItems,
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update failed: category not found with given category id', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
    
        } 
        catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            const { categoryId } = req.params;

            // move files to Other
            const { db } = req.locals;
            await helpers.moveFilesToOther(db, categoryId.toString());
            
            // delete category
            const collection = db.collection('categories');
            const result = await collection.deleteOne({ _id: categoryId });

            if (result.deletedCount === 0) {
                throw helpers.createError('deletion failed: category not found with given category id', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } 
        catch (err) {
            next(err);
        }
    }
};

const router = express.Router();

router.post('/', 
    auth.requireSuperAdmin,
    schemaHelpers.validateBody(schema.post.body.schema),
    categories.post,
);
router.get('/', 
    categories.get,
);
router.patch('/:categoryId', 
    auth.requireSuperAdmin, 
    schemaHelpers.validateParams(schema.patch.params.schema),
    schemaHelpers.validateBody(schema.patch.body.schema),
    categories.patch,
);
router.delete('/:categoryId', 
    auth.requireSuperAdmin,
    schemaHelpers.validateParams(schema.delete.params.schema),
    categories.delete,
);

export { categories, router as categoriesRouter }; 
