import { expect, jest } from '@jest/globals';
import { tags } from '../../routes/tags.js';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers.js';

describe('tags', () => {
    let mockRes, mockNext, err, mockCollection, mockDb, mockCreateError, locals, mockMoveTagsToOther;
    beforeEach(() => {
        expect(process.env.NODE_ENV).toBe('test');
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn()};
        err = null;
        mockNext = jest.fn((nextErr) => { if (nextErr) err = nextErr; });
        mockCollection = {
            findOne: jest.fn().mockResolvedValue(null),
            countDocuments: jest.fn().mockResolvedValue(3),
            insertOne: jest.fn().mockResolvedValue({ insertedId: 'success_id' }),
            find: jest.fn().mockReturnThis(),
            updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
            deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        };
        mockDb = { collection: jest.fn(() => mockCollection) };
        mockCreateError = jest.spyOn(helpers, 'createError').mockImplementation((message, status) => {
            const error = new Error(message);
            error.status = status;
            return error;
        });
        locals = { db: mockDb };
        mockMoveTagsToOther = jest.spyOn(helpers, 'moveTagsToOther').mockResolvedValue();
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe('postGroup', () => {
        let body;
        beforeEach(() => {
            body = { tagGroupName: 'Cool new tag group' };
        });

        it('should create new tag group', async () => {
            // perform action to test
            const req = { body, locals };
            await tags.postGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockCollection.countDocuments).toHaveBeenCalled();
            expect(mockCollection.insertOne).toHaveBeenCalledWith({ ...body, sortOrder: 3, state: 'active', tags: [] });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should fail if tag group already exists', async () => {
            // simulate existing tag group
            mockCollection.findOne.mockResolvedValueOnce({ existing: 'tag group' });

            // perform action to test
            const req = { body, locals };
            await tags.postGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockCreateError).toHaveBeenCalledWith(`a tag group named "${body.tagGroupName}" already exists`, 400);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle findOne error', async () => {
            // simulate error in findOne
            err = new Error('Find error');
            mockCollection.findOne.mockRejectedValueOnce(err);

            // perform action to test
            const req = { body, locals };
            await tags.postGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle countDocuments error', async () => {
            // simulate error in countDocuments
            err = new Error('Database error');
            mockCollection.countDocuments.mockRejectedValueOnce(err);

            // perform action to test
            const req = { body, locals };
            await tags.postGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.countDocuments).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle insertOne error', async () => {
            // simulate error in insertOne
            err = new Error('Insert error');
            mockCollection.insertOne.mockRejectedValueOnce(err);

            // perform action to test
            const req = { body, locals };
            await tags.postGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.insertOne).toHaveBeenCalledWith({ ...body, sortOrder: 3, state: 'active', tags: [] });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no insertion', async () => {
            // simulate no insertion
            mockCollection.insertOne.mockResolvedValueOnce({ insertedId: null });

            // perform action to test
            const req = { body, locals };
            await tags.postGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCreateError).toHaveBeenCalledWith('failed to create tag group', 500);
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('patchGroup', () => {
        let params, body;
        beforeEach(() => {
            params = { tagGroupId: ObjectId().toString() };
            body = { tagGroupName: 'Cool new tag group' };
        });

        it('should update tag group', async () => {
            // perform action to test
            const req = { params, body, locals };
            await tags.patchGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should fail if tag group already exists', async () => {
            // simulate existing tag group
            mockCollection.findOne.mockResolvedValueOnce({ existing: 'tag group' });

            // perform action to test
            const req = { params, body, locals };
            await tags.patchGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockCreateError).toHaveBeenCalledWith(`a tag group named "${body.tagGroupName}" already exists`, 400);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle findOne error', async () => {
            // simulate error in findOne
            err = new Error('Find error');
            mockCollection.findOne.mockRejectedValueOnce(err);

            // perform action to test
            const req = { params, body, locals };
            await tags.patchGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.findOne).toHaveBeenCalledWith({ tagGroupName: body.tagGroupName });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle updateOne error', async () => {
            // simulate error in updateOne
            err = new Error('Update error');
            mockCollection.updateOne.mockRejectedValueOnce(err);

            // perform action to test
            const req = { params, body, locals };
            await tags.patchGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no update', async () => {
            // simulate no update
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            // perform action to test
            const req = { params, body, locals };
            await tags.patchGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCreateError).toHaveBeenCalledWith('failed to update tag group', 500);
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('patchGroupOrder', () => {
        let body;
        beforeEach(() => {
            body = { 
                tagGroups: [
                    { _id: ObjectId().toString() },
                    { _id: '0' },
                    { _id: ObjectId().toString() },
                    { _id: ObjectId().toString() },
                ]
            };
        });

        it('should update tag group order', async () => {
            // perform action to test
            const req = { body, locals };
            await tags.patchGroupOrder(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.updateOne).toHaveBeenCalledTimes(body.tagGroups.length);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle updateOne error', async () => {
            // simulate error in updateOne
            err = new Error('Update error');
            mockCollection.updateOne.mockRejectedValueOnce(err);

            // perform action to test
            const req = { body, locals };
            await tags.patchGroupOrder(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('deleteGroup', () => {
        let params;
        beforeEach(() => {
            params = { tagGroupId: ObjectId().toString() };
        });

        it('should delete tag group', async () => {
            // perform action to test
            const req = { params, locals };
            await tags.deleteGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockMoveTagsToOther).toHaveBeenCalledWith(mockDb, params.tagGroupId);
            expect(mockCollection.deleteOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle moveTagsToOther error', async () => {
            // simulate error in moveTagsToOther
            err = new Error('Move error');
            mockMoveTagsToOther.mockRejectedValueOnce(err);

            // perform action to test
            const req = { params, locals };
            await tags.deleteGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockMoveTagsToOther).toHaveBeenCalledWith(mockDb, params.tagGroupId);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle deleteOne error', async () => {
            // simulate error in deleteOne
            err = new Error('Delete error');
            mockCollection.deleteOne.mockRejectedValueOnce(err);

            // perform action to test
            const req = { params, locals };
            await tags.deleteGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.deleteOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no deletion', async () => {
            // simulate no deletion
            mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 0 });

            // perform action to test
            const req = { params, locals };
            await tags.deleteGroup(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.deleteOne).toHaveBeenCalled();
            expect(mockCreateError).toHaveBeenCalledWith('failed to delete tag group', 500);
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });
});