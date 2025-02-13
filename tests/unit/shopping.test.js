import { jest } from '@jest/globals';
import { shopping } from '../../routes/shopping.js';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers.js';

describe('shopping', () => {
    let mockRes;
    let mockNext;
    let err;

    let mockCollection;
    let mockDb;

    let mockCreateError;
    beforeEach(() => {
        expect(process.env.NODE_ENV).toBe('test');

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        err = null;
        mockNext = jest.fn((nextErr) => {
            if (nextErr) {
                err = nextErr;
            }
        });

        mockCollection = {
            insertOne: jest.fn().mockResolvedValue(),
            find: jest.fn().mockReturnThis(),
            toArray: jest.fn().mockResolvedValue(),
            updateOne: jest.fn().mockResolvedValue(),
            deleteOne: jest.fn().mockResolvedValue()
        };
        
        mockDb = {
            collection: jest.fn(() => mockCollection)
        };

        mockCreateError = jest.spyOn(helpers, 'createError');
        mockCreateError.mockImplementation((message, status) => {
            const error = new Error(message);
            error.status = status;
            return error;
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe('create', () => {
        let clientId;
        let data;
        beforeEach(() => {
            clientId = (new ObjectId()).toString(); 
            data = {
                itemName: 'Cool New Shirt',
                itemLink: 'cool-new-shirt.link',
                imageLink: 'cool-new-shirt-image.link',
                notes: 'Size: M, Color: Red'
            };
        });

        it('should create new shopping item', async () => {
            // perform action to test
            mockCollection.insertOne.mockResolvedValue({ insertedId: 'success_id' });
            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await shopping.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({ clientId: clientId, ...data, purchased: false });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should create new shopping item (no notes)', async () => {
            // perform action to test
            delete data.notes;
            mockCollection.insertOne.mockResolvedValue({ insertedId: 'success_id' });
            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await shopping.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({ 
                clientId: clientId,
                itemName: data.itemName,
                itemLink: data.itemLink,
                imageLink: data.imageLink,
                notes: '',
                purchased: false 
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle insertion failure', async () => {
            // perform action to test
            const error = new Error('insertion of new shopping item failed');
            error.status = 500;
            mockCollection.insertOne.mockRejectedValue(error);

            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await shopping.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({ clientId: clientId, ...data, purchased: false });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('insertion of new shopping item failed');
        });

        it('should fail if nothing inserted into database', async () => {
            // perform action to test
            mockCollection.insertOne.mockResolvedValue({ insertedId: '' });

            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await shopping.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({ clientId: clientId, ...data, purchased: false });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('shopping item was not inserted into database');
        });

        it('should fail with missing item name', async () => {
            // perform action to test
            data.itemName = '';

            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await shopping.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('item name is required to create shopping item');
        });

        it('should fail with missing item link', async () => {
            // perform action to test
            delete data.itemLink;

            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await shopping.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('item link is required to create shopping item');
        });

        it('should fail with missing image link', async () => {
            // perform action to test
            data.imageLink = null;

            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await shopping.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('image link is required to create shopping item');
        });

        it('should fail with missing client id', async () => {
            // perform action to test
            const req = { body: data, locals: { db: mockDb } };

            await shopping.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to create shopping item: invalid or missing client id');
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            clientId = 'not-valid-id'

            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await shopping.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to create shopping item: invalid or missing client id');
        });
    });

    describe('read', () => {
        let data;
        beforeEach(() => {
            data = {
                _id: new ObjectId(),
                clientId: (new ObjectId()).toString(),
                itemName: 'Cool New Shirt',
                itemLink: 'cool-new-shirt.link',
                imageLink: 'cool-new-shirt-image.link',
                notes: 'Size: M, Color: Red',
                purchased: false
            };
        });

        it('should get shopping items', async () => {
            // perform action to test
            const mockShoppingItems = [data];
            mockCollection.toArray.mockResolvedValue(mockShoppingItems);
            const req = { params: { clientId: data.clientId }, locals: { db: mockDb } };

            await shopping.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.find).toHaveBeenCalledWith({ clientId: data.clientId });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockShoppingItems);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle find failure', async () => {
            // perform action to test
            const error = new Error('retrieval of shopping items failed');
            error.status = 500;
            mockCollection.find.mockImplementation(() => { throw error });

            const req = { params: { clientId: data.clientId }, locals: { db: mockDb } };

            await shopping.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.find).toHaveBeenCalledWith({ clientId: data.clientId });
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('retrieval of shopping items failed');
        });

        it('should handle toArray failure', async () => {
            // perform action to test
            const error = new Error('array transformation of shopping items failed');
            error.status = 500;
            mockCollection.toArray.mockRejectedValue(error);

            const req = { params: { clientId: data.clientId }, locals: { db: mockDb } };

            await shopping.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.find).toHaveBeenCalledWith({ clientId: data.clientId });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('array transformation of shopping items failed');
        });

        it('should fail with missing client id', async () => {
            // perform action to test
            const req = { locals: { db: mockDb } };

            await shopping.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to get shopping items: invalid or missing client id');
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            data.clientId = 'not-valid-id'

            const req = { params: { clientId: data.clientId }, locals: { db: mockDb } };

            await shopping.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to get shopping items: invalid or missing client id');
        });
    });
    
    describe('update full', () => {
        let data;
        let shoppingId;
        beforeEach(async () => {
            data = {
                newItemName: 'Cool Shirt',
                newItemLink: 'cool-shirt.link',
                newImageLink: 'cool-shirt-image.link',
                newNotes: 'Size: L, Color: Blue',
                newPurchased: true
            };

            shoppingId = (new ObjectId()).toString();
        });

        it('should update shopping item', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should update shopping item (no notes)', async () => {
            // perform action to test
            data.newNotes = '';
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle update failure', async () => {
            // perform action to test
            const error = new Error('update of shopping item failed');
            error.status = 500;
            mockCollection.updateOne.mockRejectedValue(error);

            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update of shopping item failed');
        });

        it('should fail if no update made', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });

            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update failed: shopping item not updated');
        });

        it('should fail with missing item name', async () => {
            // perform action to test
            delete data.newItemName;

            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('item name is required to update shopping item');
        });

        it('should fail with missing item link', async () => {
            // perform action to test
            data.newItemLink = '';

            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('item link is required to update shopping item');
        });

        it('should fail with missing image link', async () => {
            // perform action to test
            data.newImageLink = '';

            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('image link is required to update shopping item');
        });

        it('should fail with missing purchased status', async () => {
            // perform action to test
            delete data.newPurchased;

            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('purchased status is required to update shopping item');
        });

        it('should fail with missing shopping id', async () => {
            // perform action to test
            const req = { body: data, locals: { db: mockDb } };

            await shopping.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update shopping item: invalid or missing shopping id');
        });

        it('should fail with invalid shopping id', async () => {
            // perform action to test
            shoppingId = 'not-valid-id';
            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update shopping item: invalid or missing shopping id');
        });
    });

    describe('update purchased', () => {
        let data;
        let shoppingId;
        beforeEach(async () => {
            data = { newPurchased: true };

            shoppingId = (new ObjectId()).toString();
        });

        it('should update shopping item', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchPurchased(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle update failure', async () => {
            // perform action to test
            const error = new Error('update of shopping item failed');
            error.status = 500;
            mockCollection.updateOne.mockRejectedValue(error);

            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchPurchased(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update of shopping item failed');
        });

        it('should fail if no update made', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });

            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchPurchased(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update failed: shopping item purchased status not updated');
        });

        it('should fail with missing purchased status', async () => {
            // perform action to test
            delete data.newPurchased;

            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchPurchased(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('purchased status is required to update shopping item');
        });

        it('should fail with missing shopping id', async () => {
            // perform action to test
            const req = { body: data, locals: { db: mockDb } };

            await shopping.patchPurchased(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update shopping item purchased status: invalid or missing shopping id');
        });

        it('should fail with invalid shopping id', async () => {
            // perform action to test
            shoppingId = 'not-valid-id';
            const req = { body: data, params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.patchPurchased(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update shopping item purchased status: invalid or missing shopping id');
        });
    });

    describe('delete', () => {
        let shoppingId;
        beforeEach(async () => {
            shoppingId = (new ObjectId()).toString();
        });

        it('should delete shopping item', async () => {
            // perform action to test
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
            const req = { params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(shoppingId) });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!'});
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle delete failure', async () => {
            // perform action to test
            const error = new Error('deletion of shopping item failed');
            error.status = 500;
            mockCollection.deleteOne.mockRejectedValue(error);
            
            const req = { params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(shoppingId) });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('deletion of shopping item failed');
        });

        it('should fail if no deletion made', async () => {
            // perform action to test
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
            
            const req = { params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('shopping');
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(shoppingId) });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('deletion failed: shopping item not deleted');
        });

        it('should fail with missing shopping id', async () => {
            // perform action to test
            const req = { locals: { db: mockDb } };

            await shopping.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to delete shopping item: invalid or missing shopping id');
        });

        it('should fail with invalid shopping id', async () => {
            // perform action to test
            shoppingId = 'not-valid-id';

            const req = { params: { shoppingId: shoppingId }, locals: { db: mockDb } };

            await shopping.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to delete shopping item: invalid or missing shopping id');
        });
    });
});