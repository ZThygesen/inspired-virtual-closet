import express from 'express';
import { ObjectId } from 'mongodb';
import { helpers } from '../helpers.js';
import { auth } from './auth.js';

const categories = {
    async post(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('categories');

            const category = req?.body?.category;
            if (!category) {
                throw helpers.createError('a category name is required for category creation', 400);
            }
    
            if ((await collection.find({ name: category }).toArray()).length > 0) {
                throw helpers.createError(`a category with the name "${category}" already exists`, 400);
            }
    
            const categoryEntry = {
                name: category,
                items: []
            }
    
            const result = await collection.insertOne(categoryEntry);

            if (!result.insertedId) {
                throw helpers.createError('category was not inserted into database', 500);
            }
    
            res.status(201).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async get(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('categories');
            const categories = await collection.find({ }, { projection: {items: 0 } }).toArray();
            
            if (categories.length === 0) {
                throw helpers.createError('no categories were found on retrieval', 500);
            }

            let otherMissing = true;
            for (let i = 0; i < categories.length; i++) {
                if (categories[i].name === 'Other' && categories[i]._id === 0) {
                    otherMissing = false;
                    break;
                }
            }

            if (otherMissing) {
                throw helpers.createError('the Other category is missing in categories retrieval', 500);
            }

            res.status(200).json(categories)
        } catch (err) {
            next(err);
        }
    },

    async patch(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('categories');

            const categoryId = req?.params?.categoryId;
            if (helpers.isOtherCategory(categoryId)) {
                throw helpers.createError('invalid category id: cannot edit Other category', 400);
            }

            if (!helpers.isValidId(categoryId)) {
                throw helpers.createError('failed to update category: invalid or missing category id', 400);
            }

            const name = req?.body?.newName;
            if (!name) {
                throw helpers.createError('category name is required for category update', 400);
            }

            if ((await collection.find({ name: name }).toArray()).length > 0) {
                throw helpers.createError(`a category with the name "${name}" already exists`, 400);
            }

            const result = await collection.updateOne(
                { _id: ObjectId(categoryId) },
                {
                    $set: {
                        name: name
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update failed: category not found with given category id', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
    
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            const categoryId = req?.params?.categoryId;
            if (helpers.isOtherCategory(categoryId)) {
                throw helpers.createError('invalid category id: cannot delete Other category', 400);
            }

            if (!helpers.isValidId(categoryId)) {
                throw helpers.createError('failed to delete category: invalid or missing category id', 400);
            }

            // move files to Other
            const { db } = req.locals;
            await helpers.moveFilesToOther(db, categoryId);
            
            // delete category
            const collection = db.collection('categories');
            const result = await collection.deleteOne({ _id: ObjectId(categoryId )});

            if (result.deletedCount === 0) {
                throw helpers.createError('deletion failed: category not found with given category id', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    }
};

const router = express.Router();

router.post('/', auth.requireSuperAdmin, categories.post);
router.get('/', categories.get);
router.patch('/:categoryId', auth.requireSuperAdmin, categories.patch);
router.delete('/:categoryId', auth.requireSuperAdmin, categories.delete);

export { categories, router as categoriesRouter }; 
