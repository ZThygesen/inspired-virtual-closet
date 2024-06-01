import express from 'express';
import { ObjectId } from 'mongodb';
import { helpers } from '../helpers.js';

const categories = {
    async post(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('categories');

            if (!req.body.category) {
                throw helpers.createError('a category name is required for category creation', 400);
            }
    
            if ((await collection.find({ name: req.body.category }).toArray()).length > 0) {
                throw helpers.createError(`a category with the name "${req.body.category}" already exists`, 400);
            }
    
            const category = {
                name: req.body.category,
                items: []
            }
    
            const result = await collection.insertOne(category);

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

            if (req?.params?.categoryId === 0) {
                throw helpers.createError('invalid category id: cannot edit Other category', 400);
            }

            if (!req.params || !req.params.categoryId) {
                throw helpers.createError('category id is required to update category', 400);
            }

            if (!req.body.newName || !req.body.newName) {
                throw helpers.createError('category name is required for category update', 400);
            }
            console.log
            if ((await collection.find({ name: req.body.newName }).toArray()).length > 0) {
                throw helpers.createError(`a category with the name "${req.body.newName}" already exists`, 400);
            }

            const result = await collection.updateOne(
                { _id: ObjectId(req.params.categoryId) },
                {
                    $set: {
                        name: req.body.newName
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
            if (req?.params?.categoryId === 0) {
                throw helpers.createError('invalid category id: cannot delete Other category', 400);
            }

            if (!req.params || !req.params.categoryId) {
                throw helpers.createError('category id is required to delete category', 400);
            }

            // move files to Other
            await helpers.moveFilesToOther(req.params.categoryId);
            
            // delete category
            const { db } = req.locals;
            const collection = db.collection('categories');
            const result = await collection.deleteOne({ _id: ObjectId(req.params.categoryId )});

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

router.post('/', categories.post);
router.get('/', categories.get);
router.patch('/:categoryId', categories.patch);
router.delete('/:categoryId', categories.delete);

export { categories, router as categoriesRouter }; 
