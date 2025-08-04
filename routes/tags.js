import express from 'express';
import { ObjectId } from 'mongodb';
import { helpers } from '../helpers.js';
import { schemaHelpers } from '../schema/helpers.js';
import { schema } from '../schema/tags.schema.js';
import { auth } from './auth.js';

const tags = {
    // tag groups
    async postGroup(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('tags');
            const { tagGroupName } = req.body;

            if (await collection.findOne({ tagGroupName })) {
                throw helpers.createError(`a tag group named "${tagGroupName}" already exists`, 400);
            };

            const sortOrder = await collection.countDocuments();
            const result = await collection.insertOne({
                tagGroupName: tagGroupName,
                sortOrder: sortOrder,
                state: 'active',
                tags: [],
            });
            if (!result.insertedId) throw helpers.createError('failed to create tag group', 500);
    
            res.status(201).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async patchGroup(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('tags');
            const { tagGroupId } = req.params;
            const { tagGroupName } = req.body;

            if (await collection.findOne({ tagGroupName })) {
                throw helpers.createError(`a tag group named "${tagGroupName}" already exists`, 400);
            }

            const result = await collection.updateOne(
                { _id: tagGroupId },
                {
                    $set: {
                        tagGroupName: tagGroupName
                    }
                }
            );
            if (!result.modifiedCount) {
                throw helpers.createError('failed to update tag group', 500);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async patchGroupOrder(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('tags');
            const { tagGroups } = req.body;

            let index = 0;
            for (const tagGroup of tagGroups) {
                const tagGroupId = tagGroup._id;
                await collection.updateOne(
                    { _id: tagGroupId },
                    {
                        $set: {
                            sortOrder: index
                        }
                    }
                );
                index++;
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async deleteGroup(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('tags');
            const { tagGroupId } = req.params;

            await helpers.moveTagsToOther(db, tagGroupId);

            const result = await collection.deleteOne({ _id: ObjectId(tagGroupId)});
            if (!result.deletedCount) {
                throw helpers.createError('failed to delete tag group', 500);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    // tags

    // async postTag(req, res, next) {
    //     try {
    //         let tagGroupId = req?.params?.tagGroupId;
    //         if (helpers.isOtherCategory(tagGroupId)) {
    //             tagGroupId = 0;
    //         }
    //         else if (helpers.isValidId(tagGroupId)) {
    //             tagGroupId = ObjectId(tagGroupId);
    //         }
    //         else {
    //             throw helpers.createError('failed to create tag: invalid or missing tag group id', 400);
    //         }

    //         const tagName = req?.body?.tagName;
    //         if (!tagName) {
    //             throw helpers.createError('tag name is required to create tag', 400);
    //         }

    //         const tagColor = req?.body?.tagColor;
    //         if (!tagColor) {
    //             throw helpers.createError('tag color is required to create tag', 400);
    //         }

    //         const tag = {
    //             tagId: new ObjectId(),
    //             tagName: tagName,
    //             tagColor: tagColor,
    //             state: 'active'
    //         };
    
    //         // insert tag group into db
    //         const { db } = req.locals;
    //         const collection = db.collection('tags');
    //         const result = await collection.updateOne(
    //             { _id: tagGroupId },
    //             {
    //                 $push: {
    //                     tags: tag
    //                 }
    //             }   
    //         );

    //         if (result.modifiedCount === 0) {
    //             throw helpers.createError('tag was not inserted into database', 500);
    //         }
    
    //         res.status(201).json({ message: 'Success!' });
    
    //     } catch (err) {
    //         next(err);
    //     }
    // },

    async postTag(req, res, next) {
        try {
            let tagGroupId = req?.params?.tagGroupId;
            if (helpers.isOtherCategory(tagGroupId)) {
                tagGroupId = 0;
            }
            else if (helpers.isValidId(tagGroupId)) {
                tagGroupId = ObjectId(tagGroupId);
            }
            else {
                throw helpers.createError('failed to create tag: invalid or missing tag group id', 400);
            }

            const tagName = req?.body?.tagName;
            if (!tagName) {
                throw helpers.createError('tag name is required to create tag', 400);
            }

            const tagColor = req?.body?.tagColor;
            if (!tagColor) {
                throw helpers.createError('tag color is required to create tag', 400);
            }

            const tag = {
                tagId: new ObjectId(),
                tagName: tagName,
                tagColor: tagColor,
                state: 'active'
            };
    
            // insert tag group into db
            const { db } = req.locals;
            const collection = db.collection('tags');
            const result = await collection.updateOne(
                { _id: tagGroupId },
                {
                    $push: {
                        tags: tag
                    }
                }   
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('tag was not inserted into database', 500);
            }
    
            res.status(201).json({ message: 'Success!' });
    
        } catch (err) {
            next(err);
        }
    },

    async getActive(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('tags');
            const tagGroups = await collection.find({ state: 'active' }).toArray();
            tagGroups.forEach(tagGroup => {
                const activeTags = tagGroup.tags.filter(tag => tag.state === "active");
                tagGroup.tags = activeTags;
            });
            res.status(200).json(tagGroups);
        } catch (err) {
            next(err);
        }
    },

    async getArchived(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('tags');
            const tagGroups = await collection.find({ state: 'active' }).toArray();
            tagGroups.forEach(tagGroup => {
                const archivedTags = tagGroup.tags.filter(tag => tag.state === "archived");
                tagGroup.tags = archivedTags;
            });
            res.status(200).json(tagGroups);
        } catch (err) {
            next(err);
        }
    },

    async patchTag(req, res, next) {
        try {
            let tagGroupId = req?.params?.tagGroupId;
            if (helpers.isOtherCategory(tagGroupId)) {
                tagGroupId = 0;
            }
            else if (helpers.isValidId(tagGroupId)) {
                tagGroupId = ObjectId(tagGroupId);
            }
            else {
                throw helpers.createError('failed to update tag: invalid or missing tag group id', 400);
            }

            let tagId = req?.params?.tagId;
            if (helpers.isValidId(tagId)) {
                tagId = ObjectId(tagId);
            }
            else {
                throw helpers.createError('failed to update tag: invalid or missing tag group id', 400);
            }

            const tagName = req?.body?.newTagName;
            if (!tagName) {
                throw helpers.createError('tag name is required to update tag', 400);
            }

            const tagColor = req?.body?.newTagColor;
            if (!tagColor) {
                throw helpers.createError('tag color is required to update tag', 400);
            }
            
            const { db } = req.locals;
            const collection = db.collection('tags');
    
            // update tag in db            
            const result = await collection.updateOne(
                { _id: tagGroupId, 'tags.tagId': tagId },
                {
                    $set: {
                        'tags.$.tagName': tagName,
                        'tags.$.tagColor': tagColor,
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update failed: tag not updated', 500);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async patchTagGroup(req, res, next) {
        try {
            let tagGroupId = req?.params?.tagGroupId;
            if (helpers.isOtherCategory(tagGroupId)) {
                tagGroupId = 0;
            }
            else if (helpers.isValidId(tagGroupId)) {
                tagGroupId = ObjectId(tagGroupId);
            }
            else {
                throw helpers.createError('failed to update tag: invalid or missing tag group id', 400);
            }

            let tagId = req?.params?.tagId;
            if (helpers.isValidId(tagId)) {
                tagId = ObjectId(tagId);
            }
            else {
                throw helpers.createError('failed to update tag: invalid or missing tag id', 400);
            }

            let newTagGroupId = req?.body?.newTagGroupId;
            if (helpers.isOtherCategory(newTagGroupId)) {
                newTagGroupId = 0;
            }
            else if (helpers.isValidId(newTagGroupId)) {
                newTagGroupId = ObjectId(newTagGroupId);
            }
            else {
                throw helpers.createError('failed to update tag: invalid or missing new tag group id', 400);
            }
            
            const { db } = req.locals;
            const collection = db.collection('tags');

            // get tag from current tag group and remove it
            const tagGroup = await collection.findOne({ _id: tagGroupId });
            const tag = tagGroup?.tags?.find(tag => tag?.tagId?.toString() === tagId.toString());

            if (!tag) {
                throw helpers.createError('failed to retrieve tag from database', 500);
            }

            // insert to new tag group            
            let result = await collection.updateOne(
                { _id: newTagGroupId },
                {
                    $push: {
                        tags: tag
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update of tag group failed: tag not added to new tag group', 500);
            }

            // remove from old tag group
            result = await collection.updateOne(
                { _id: tagGroupId },
                {
                    $pull: {
                        tags: { tagId: tagId }
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update of tag group failed: tag not removed from current tag group', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async archiveTag(req, res, next) {
        try {
            let tagGroupId = req?.params?.tagGroupId;
            if (helpers.isOtherCategory(tagGroupId)) {
                tagGroupId = 0;
            }
            else if (helpers.isValidId(tagGroupId)) {
                tagGroupId = ObjectId(tagGroupId);
            }
            else {
                throw helpers.createError('failed to archive tag: invalid or missing tag group id', 400);
            }

            let tagId = req?.params?.tagId;
            if (helpers.isValidId(tagId)) {
                tagId = ObjectId(tagId);
            }
            else {
                throw helpers.createError('failed to archive tag: invalid or missing tag id', 400);
            }
            
            const { db } = req.locals;
            const collection = db.collection('tags');
    
            // update tag in db            
            const result = await collection.updateOne(
                { _id: tagGroupId, 'tags.tagId': tagId },
                {
                    $set: {
                        'tags.$.state': 'archived'
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('archive failed: tag not archived', 500);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async recoverTag(req, res, next) {
        try {
            let tagGroupId = req?.params?.tagGroupId;
            if (helpers.isOtherCategory(tagGroupId)) {
                tagGroupId = 0;
            }
            else if (helpers.isValidId(tagGroupId)) {
                tagGroupId = ObjectId(tagGroupId);
            }
            else {
                throw helpers.createError('failed to recover tag: invalid or missing tag group id', 400);
            }

            let tagId = req?.params?.tagId;
            if (helpers.isValidId(tagId)) {
                tagId = ObjectId(tagId);
            }
            else {
                throw helpers.createError('failed to recover tag: invalid or missing tag id', 400);
            }
            
            const { db } = req.locals;
            const collection = db.collection('tags');
    
            // update tag in db            
            const result = await collection.updateOne(
                { _id: tagGroupId, 'tags.tagId': tagId },
                {
                    $set: {
                        'tags.$.state': 'active'
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('recover failed: tag not recovered', 500);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async deleteTag(req, res, next) {
        try {
            let tagGroupId = req?.params?.tagGroupId;
            if (helpers.isOtherCategory(tagGroupId)) {
                tagGroupId = 0;
            }
            else if (helpers.isValidId(tagGroupId)) {
                tagGroupId = ObjectId(tagGroupId);
            }
            else {
                throw helpers.createError('failed to delete tag: invalid or missing tag group id', 400);
            }

            let tagId = req?.params?.tagId;
            if (helpers.isValidId(tagId)) {
                tagId = ObjectId(tagId);
            }
            else {
                throw helpers.createError('failed to delete tag: invalid or missing tag id', 400);
            }

            // delete from db
            const { db } = req.locals;
            const collection = db.collection('tags');
            const result = await collection.updateOne(
                { _id: tagGroupId },
                {
                    $pull: {
                        tags: { tagId: tagId }
                    }
                }
            );

            if (result.deletedCount === 0) {
                throw helpers.createError('deletion failed: tag not deleted', 500);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    }
};

const router = express.Router();

// tag groups
router.post(
    '/group', 
    auth.requireSuperAdmin,
    schemaHelpers.validateBody(schema.postGroupBody), 
    tags.postGroup,
);
router.patch(
    '/group/:tagGroupId', 
    auth.requireSuperAdmin,
    schemaHelpers.validateParams(schema.patchGroupParams),
    schemaHelpers.validateBody(schema.patchGroupBody), 
    tags.patchGroup
);
router.patch(
    '/group-order', 
    auth.requireSuperAdmin,
    schemaHelpers.validateBody(schema.patchGroupOrderBody),
    tags.patchGroupOrder
);
router.delete(
    '/group/:tagGroupId', 
    auth.requireSuperAdmin, 
    schemaHelpers.validateParams(schema.deleteGroupParams),
    tags.deleteGroup
);

// tags
router.post(
    '/tag/:tagGroupId', 
    auth.requireSuperAdmin,
    schemaHelpers.validateParams(),
    schemaHelpers.validateBody(schema.postTagBody),
    tags.postTag,
);
router.get('/active', tags.getActive);
router.get('/archived', tags.getArchived);
router.patch('/tag/:tagGroupId/:tagId', auth.requireSuperAdmin, tags.patchTag);
router.patch('/tag-group/:tagGroupId/:tagId', auth.requireSuperAdmin, tags.patchTagGroup);
router.patch('/archive-tag/:tagGroupId/:tagId', auth.requireSuperAdmin, tags.archiveTag);
router.patch('/recover-tag/:tagGroupId/:tagId', auth.requireSuperAdmin, tags.recoverTag);
router.delete('/tag/:tagGroupId/:tagId', auth.requireSuperAdmin, tags.deleteTag);

export { tags, router as tagsRouter };