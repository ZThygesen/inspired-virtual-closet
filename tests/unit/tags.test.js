import { tags } from '../../routes/tags';
import { ObjectId } from 'mongodb';
import { unitHelpers } from './helpers';

describe('tags', () => {
    let err, mockRes, mockNext, mockCollection, mockDb, locals, mockCreateError;
    let mockMoveTagsToOther;
    beforeEach(() => {
        unitHelpers.beforeEach();
        ({
            mockRes,
            mockNext,
            mockCollection,
            mockDb,
            locals,
            mockCreateError,
            mockMoveTagsToOther,
        } = unitHelpers);
    });

    afterEach(() => {
        unitHelpers.afterEach();
    });

    describe('postGroup', () => {
        let body, req;
        beforeEach(() => {
            body = { tagGroupName: 'Cool new tag group' };
            req = { body, locals };
        });

        async function makeFunctionCall() {
            await tags.postGroup(req, mockRes, mockNext);
        }

        it('should create new tag group', async () => {
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockCollection.countDocuments).toHaveBeenCalled();
            expect(mockCollection.insertOne).toHaveBeenCalledWith({ ...body, sortOrder: 3, state: 'active', tags: [] });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should fail if tag group already exists', async () => {
            // simulate existing tag group
            mockCollection.findOne.mockResolvedValueOnce({ existing: 'tag group' });

            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockCreateError).toHaveBeenCalledWith(`a tag group named "${body.tagGroupName}" already exists`, 400);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle findOne error', async () => {
            // simulate error in findOne
            err = new Error('Find error');
            mockCollection.findOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle countDocuments error', async () => {
            // simulate error in countDocuments
            err = new Error('Database error');
            mockCollection.countDocuments.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.countDocuments).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle insertOne error', async () => {
            // simulate error in insertOne
            err = new Error('Insert error');
            mockCollection.insertOne.mockRejectedValueOnce(err);

           await makeFunctionCall();

            expect(mockCollection.insertOne).toHaveBeenCalledWith({ ...body, sortOrder: 3, state: 'active', tags: [] });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no insertion', async () => {
            // simulate no insertion
            mockCollection.insertOne.mockResolvedValueOnce({ insertedId: null });

            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('failed to create tag group', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('patchGroup', () => {
        let params, body, req;
        beforeEach(() => {
            params = { tagGroupId: ObjectId().toString() };
            body = { tagGroupName: 'Cool new tag group' };
            req = { params, body, locals };
        });

        async function makeFunctionCall() {
            await tags.patchGroup(req, mockRes, mockNext);
        }

        it('should update tag group', async () => {
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should fail if tag group already exists', async () => {
            // simulate existing tag group
            mockCollection.findOne.mockResolvedValueOnce({ existing: 'tag group' });

            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockCreateError).toHaveBeenCalledWith(`a tag group named "${body.tagGroupName}" already exists`, 400);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle findOne error', async () => {
            // simulate error in findOne
            err = new Error('Find error');
            mockCollection.findOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle updateOne error', async () => {
            // simulate error in updateOne
            err = new Error('Update error');
            mockCollection.updateOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no update', async () => {
            // simulate no update
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('failed to update tag group', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('patchGroupOrder', () => {
        let body, req;
        beforeEach(() => {
            body = { 
                tagGroups: [
                    ObjectId().toString(),
                    '0',
                    ObjectId().toString(),
                    ObjectId().toString(),
                ],
            };
            req = { body, locals };
        });

        async function makeFunctionCall() {
            await tags.patchGroupOrder(req, mockRes, mockNext);
        }

        it('should update tag group order', async () => {
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(body.tagGroups.length);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle updateOne error', async () => {
            // simulate error in updateOne
            err = new Error('Update error');
            mockCollection.updateOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('deleteGroup', () => {
        let params, req;
        beforeEach(() => {
            params = { tagGroupId: ObjectId().toString() };
            req = { params, locals };
        });

        async function makeFunctionCall() {
            await tags.deleteGroup(req, mockRes, mockNext);
        }

        it('should delete tag group', async () => {
            await makeFunctionCall();

            expect(mockMoveTagsToOther).toHaveBeenCalledWith(mockDb, params.tagGroupId);
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: params.tagGroupId });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle moveTagsToOther error', async () => {
            // simulate error in moveTagsToOther
            err = new Error('Move error');
            mockMoveTagsToOther.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockMoveTagsToOther).toHaveBeenCalledWith(mockDb, params.tagGroupId);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle deleteOne error', async () => {
            // simulate error in deleteOne
            err = new Error('Delete error');
            mockCollection.deleteOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.deleteOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no deletion', async () => {
            // simulate no deletion
            mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 0 });

            await makeFunctionCall();

            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: params.tagGroupId });
            expect(mockCreateError).toHaveBeenCalledWith('failed to delete tag group', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('postTag', () => {
        let params, body, req;
        beforeEach(() => {
            params = { tagGroupId: ObjectId().toString() };
            body = { 
                tagName: 'Cool new tag',
                tagColor: '#FFFFFF',
            };
            req = { params, body, locals };
        });

        async function makeFunctionCall() {
            await tags.postTag(req, mockRes, mockNext);
        }

        it('should create new tag', async () => {
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle updateOne error', async () => {
            // simulate error in updateOne
            err = new Error('Update error');
            mockCollection.updateOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no update', async () => {
            // simulate no update
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('tag was not inserted into database', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('getActive', () => {
        let req;
        let tagGroups;
        beforeEach(() => {
            req = { locals };

            tagGroups = [
                { 
                    _id: ObjectId(), 
                    state: 'active', 
                    tags: [
                        { state: 'active' },
                    ],
                },
                {
                    _id: ObjectId(), 
                    state: 'active', 
                    tags: [
                        { state: 'active' },
                    ],
                },
            ];
            mockCollection.toArray.mockResolvedValue(tagGroups);
        });

        async function makeFunctionCall() {
            await tags.getActive(req, mockRes, mockNext);
        }

        it('should get active tag groups', async () => {
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ state: 'active' });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(tagGroups);
        });

        it('should work with no active tag groups', async () => {
            // simulate no active tag groups
            mockCollection.toArray.mockResolvedValueOnce([]);

            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ state: 'active' });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith([]);
        });

        it('should work with no active tags in tag groups', async () => {
            // simulate no active tags in tag groups
            const tagGroupsWithNoActiveTags = [
                { 
                    _id: ObjectId(), 
                    state: 'active',
                    tags: [
                        { state: 'archived' },
                    ],
                },
                {
                    _id: ObjectId(),
                    state: 'active',
                    tags: [],
                },
            ];
            mockCollection.toArray.mockResolvedValueOnce(tagGroupsWithNoActiveTags);

            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ state: 'active' });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith([
                { 
                    _id: tagGroupsWithNoActiveTags[0]._id,
                    state: 'active',
                    tags: [],
                },
                {
                    _id: tagGroupsWithNoActiveTags[1]._id,
                    state: 'active',
                    tags: [],
                },
            ]);
        });

        it('should handle find error', async () => {
            // simulate error in find
            err = new Error('Find error');
            mockCollection.find.mockImplementationOnce(() => { throw err });

            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ state: 'active' });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle toArray error', async () => {
            // simulate error in toArray
            err = new Error('Database error');
            mockCollection.toArray.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('getArchived', () => {
        let req;
        let tagGroups;
        beforeEach(() => {
            req = { locals };

            tagGroups = [
                {
                    _id: ObjectId(),
                    state: 'active',
                    tags: [
                        { state: 'archived' },
                    ],
                },
                {
                    _id: ObjectId(),
                    state: 'active',
                    tags: [
                        { state: 'archived' },
                    ],
                },
            ];
            mockCollection.toArray.mockResolvedValue(tagGroups);
        });

        async function makeFunctionCall() {
            await tags.getArchived(req, mockRes, mockNext);
        }

        it('should get archived tag groups', async () => {
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ state: 'active' });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(tagGroups);
        });

        it('should work with no archived tag groups', async () => {
            // simulate no archived tag groups
            mockCollection.toArray.mockResolvedValueOnce([]);

            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ state: 'active' });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith([]);
        });

        it('should work with no archived tags in tag groups', async () => {
            // simulate no archived tags in tag groups
            const tagGroupsWithNoArchivedTags = [
                {
                    _id: ObjectId(),
                    state: 'active',
                    tags: [
                        { state: 'active' },
                    ],
                },
                {
                    _id: ObjectId(),
                    state: 'active',
                    tags: [],
                },
            ];
            mockCollection.toArray.mockResolvedValueOnce(tagGroupsWithNoArchivedTags);

            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ state: 'active' });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith([
                {
                    _id: tagGroupsWithNoArchivedTags[0]._id,
                    state: 'active',
                    tags: [],
                },
                {
                    _id: tagGroupsWithNoArchivedTags[1]._id,
                    state: 'active',
                    tags: [],
                },
            ]);
        });

        it('should handle find error', async () => {
            // simulate error in find
            err = new Error('Find error');
            mockCollection.find.mockImplementationOnce(() => { throw err });

            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ state: 'active' });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle toArray error', async () => {
            // simulate error in toArray
            err = new Error('Database error');
            mockCollection.toArray.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('patchTag', () => {
        let params, body, req;
        beforeEach(() => {
            params = { 
                tagGroupId: ObjectId().toString(),
                tagId: ObjectId().toString(),
            };
            body = { 
                tagName: 'Cool updated tag',
                tagColor: '#000000',
            };
            req = { params, body, locals };
        });

        async function makeFunctionCall() {
            await tags.patchTag(req, mockRes, mockNext);
        }

        it('should update tag', async () => {
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle updateOne error', async () => {
            // simulate error in updateOne
            err = new Error('Update error');
            mockCollection.updateOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no update', async () => {
            // simulate no update
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('failed to update tag', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('patchTagGroup', () => {
        let params, body, req;
        beforeEach(() => {
            params = { 
                tagGroupId: ObjectId().toString(),
                tagId: ObjectId().toString(),
            };
            body = { 
                newTagGroupId: ObjectId().toString(),
            };
            req = { params, body, locals };

            mockCollection.findOne.mockResolvedValue({
                _id: ObjectId(params.tagGroupId),
                tags: [
                    { tagId: ObjectId(params.tagId) },
                ],
            });
        });

        async function makeFunctionCall() {
            await tags.patchTagGroup(req, mockRes, mockNext);
        }

        it('should move tag to new tag group', async () => {
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.tagGroupId });
            expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle findOne error', async () => {
            // simulate error in findOne
            err = new Error('Find error');
            mockCollection.findOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.tagGroupId });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no tag found', async () => {
            // simulate no tag found
            mockCollection.findOne.mockResolvedValueOnce();

            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.tagGroupId });
            expect(mockCreateError).toHaveBeenCalledWith('failed to retrieve tag from database', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle first updateOne error', async () => {
            // simulate error in updateOne
            err = new Error('Update error');
            mockCollection.updateOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it ('should handle no first update', async () => {
            // simulate no update
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
            expect(mockCreateError).toHaveBeenCalledWith('update of tag group failed: tag not added to new tag group', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle second updateOne error', async () => {
            // simulate error in second updateOne
            err = new Error('Update error');
            mockCollection.updateOne
                .mockResolvedValueOnce({ modifiedCount: 1 }) // first updateOne succeeds
                .mockRejectedValueOnce(err); // second updateOne fails

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it ('should handle no second update', async () => {
            // simulate no update
            mockCollection.updateOne
                .mockResolvedValueOnce({ modifiedCount: 1 }) // first updateOne succeeds
                .mockResolvedValueOnce({ modifiedCount: 0 }); // second updateOne fails

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
            expect(mockCreateError).toHaveBeenCalledWith('update of tag group failed: tag not removed from current tag group', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('archiveTag', () => {
        let params, req;
        beforeEach(() => {
            params = { 
                tagGroupId: ObjectId().toString(),
                tagId: ObjectId().toString(),
            };
            req = { params, locals };
        });

        async function makeFunctionCall() {
            await tags.archiveTag(req, mockRes, mockNext);
        }

        it('should archive tag', async () => {
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle updateOne error', async () => {
            // simulate error in updateOne
            err = new Error('Update error');
            mockCollection.updateOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no update', async () => {
            // simulate no update
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('archive failed: tag not archived', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('recoverTag', () => {
        let params, req;
        beforeEach(() => {
            params = { 
                tagGroupId: ObjectId().toString(),
                tagId: ObjectId().toString(),
            };
            req = { params, locals };
        });

        async function makeFunctionCall() {
            await tags.recoverTag(req, mockRes, mockNext);
        }

        it('should recover tag', async () => {
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle updateOne error', async () => {
            // simulate error in updateOne
            err = new Error('Update error');
            mockCollection.updateOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no update', async () => {
            // simulate no update
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('recover failed: tag not recovered', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('deleteTag', () => {
        let params, req;
        beforeEach(() => {
            params = { 
                tagGroupId: ObjectId().toString(),
                tagId: ObjectId().toString(),
            };
            req = { params, locals };
        });

        async function makeFunctionCall() {
            await tags.deleteTag(req, mockRes, mockNext);
        }

        it('should delete tag', async () => {
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle updateOne error', async () => {
            // simulate error in updateOne
            err = new Error('Update error');
            mockCollection.updateOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no update', async () => {
            // simulate no update
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('deletion failed: tag not deleted', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });
});