import { jest } from '@jest/globals';
import { categories } from '../../routes/categories';
import { helpers } from '../../helpers.js';
import { ObjectId } from 'mongodb';

describe('categories', () => {
    let mockRes;
    let mockNext;
    let err;

    let mockCollection;
    let mockDb;
    let mockCreateError;
    beforeEach(() => {
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
        let data;
        beforeEach(() => {
            data = { category: 'T-Shirts' };

            mockCollection.toArray.mockResolvedValue([]);
        });

        it('should create new category', async () => {
            // perform action to test
            mockCollection.insertOne.mockResolvedValue({ insertedId: 'success_id' });
            const req = { body: data, locals: { db: mockDb } };

            await categories.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ name: data.category });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.insertOne).toHaveBeenCalledWith({ name: data.category, items: [] });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle find failure', async () => {
            // perform action to test
            const findError = new Error('retrieval of categories failed');
            findError.status = 500;
            mockCollection.find.mockImplementation(() => { throw findError });

            const req = { body: data, locals: { db: mockDb } };

            await categories.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ name: data.category });
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('retrieval of categories failed');
        });

        it('should handle toArray failure', async () => {
            // perform action to test
            const toArrayError = new Error('array transformation of categories failed');
            toArrayError.status = 500;
            mockCollection.toArray.mockRejectedValue(toArrayError);

            const req = { body: data, locals: { db: mockDb } };

            await categories.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ name: data.category });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('array transformation of categories failed');
        });

        it('should handle insertion failure', async () => {
            // perform action to test
            const insertError = new Error('insertion of new category failed');
            insertError.status = 500;
            mockCollection.insertOne.mockRejectedValue(insertError);

            const req = { body: data, locals: { db: mockDb } };

            await categories.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ name: data.category });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.insertOne).toHaveBeenCalledWith({ name: data.category, items: [] });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('insertion of new category failed');
        });

        it('should fail if nothing inserted into database', async () => {
            // perform action to test
            mockCollection.insertOne.mockResolvedValue({ insertedId: '' });

            const req = { body: data, locals: { db: mockDb } };

            await categories.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ name: data.category });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.insertOne).toHaveBeenCalledWith({ name: data.category, items: [] });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('category was not inserted into database');
        });

        it('should fail if category already exists', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([data.category]);

            const req = { body: data, locals: { db: mockDb } };

            await categories.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ name: data.category });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe(`a category with the name "${data.category}" already exists`);
        });
        
        it('should fail with missing category name', async () => {
            // perform action to test
            data.category = '';
            const req = { body: data, locals: { db: mockDb } };

            await categories.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('a category name is required for category creation');
        });
    });

    describe('read', () => {
        let data;
        beforeEach(() => {
            data = [
                { _id: 0, name: 'Other' },
                { _id: '1', name: 'T-Shirts' },
                { _id: '2', name: 'Jeans' }
            ];

            mockCollection.toArray.mockResolvedValue([{ _id: 0, name: 'Other' }]);
        });

        it('should get clients', async () => {
            // perform action to test
            const mockCategories = data;
            mockCollection.toArray.mockResolvedValue(mockCategories);
            const req = { locals: { db: mockDb } };

            await categories.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockCategories);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle find failure', async () => {
            // perform action to test
            const findError = new Error('retrieval of categories failed');
            findError.status = 500;
            mockCollection.find.mockImplementation(() => { throw findError });
            const req = { locals: { db: mockDb } };

            await categories.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('retrieval of categories failed');
        });

        it('should handle toArray failure', async () => {
            // perform action to test
            const toArrayError = new Error('array transformation of categories failed');
            toArrayError.status = 500;
            mockCollection.toArray.mockRejectedValue(toArrayError);
            const req = { locals: { db: mockDb } };

            await categories.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('array transformation of categories failed');
        });

        it('should fail if no categories were found', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([]);
            const req = { locals: { db: mockDb } };

            await categories.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('no categories were found on retrieval');
        });

        it('should fail if Other category missing', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([{ _id: '1', name: 'T-Shirts' }]);
            const req = { locals: { db: mockDb } };

            await categories.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('the Other category is missing in categories retrieval');
        });
    });
    
    describe('update', () => {
        let data;
        let categoryId;
        beforeEach(async () => {
            data = { newName: 'T-Shirts' };

            categoryId = (new ObjectId()).toString();

            mockCollection.toArray.mockResolvedValue([]);
        });

        it('should update client', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { body: data, params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle find failure', async () => {
            // perform action to test
            const findError = new Error('retrieval of categories failed');
            findError.status = 500;
            mockCollection.find.mockImplementation(() => { throw findError });

            const req = { body: data, params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ name: data.newName });
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('retrieval of categories failed');
        });

        it('should handle toArray failure', async () => {
            // perform action to test
            const toArrayError = new Error('retrieval of categories failed');
            toArrayError.status = 500;
            mockCollection.toArray.mockRejectedValue(toArrayError);

            const req = { body: data, params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ name: data.newName });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('retrieval of categories failed');
        });

        it('should handle update failure', async () => {
            // perform action to test
            const updateError = new Error('update of category failed');
            updateError.status = 500;
            mockCollection.updateOne.mockRejectedValue(updateError);

            const req = { body: data, params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update of category failed');
        });

        it('should fail if category not found', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });
            
            const req = { body: data, params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('update failed: category not found with given category id');
        });

        it('should fail if category already exists', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([data.newName]);

            const req = { body: data, params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ name: data.newName });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe(`a category with the name "${data.newName}" already exists`);
        });

        it('should fail if Other category id given', async () => {
            // perform action to test
            categoryId = 0;      
            const req = { body: data, params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('invalid category id: cannot edit Other category');
        });

        it('should fail with missing category id', async () => {
            // perform action to test
            const req = { body: data, locals: { db: mockDb } };

            await categories.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update category: invalid or missing category id');
        });

        it('should fail with invalid category id', async () => {
            // perform action to test
            categoryId = 'not-valid-id';      
            const req = { body: data, params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update category: invalid or missing category id');
        });
        
        it('should fail with missing category name', async () => {
            // perform action to test
            data.newName = '';
            const req = { body: data, params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('category name is required for category update');
        });
    });

    describe('delete', () => {
        let categoryId;
        let mockMoveFilesToOther;
        beforeEach(async () => {
            categoryId = (new ObjectId()).toString();

            mockMoveFilesToOther = jest.spyOn(helpers, 'moveFilesToOther');
            mockMoveFilesToOther.mockResolvedValue();
        });

        it('should delete client', async () => {
            // perform action to test
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
            const req = { params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!'});
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle delete failure', async () => {
            // perform action to test
            const deleteError = new Error('deletion of category failed');
            deleteError.status = 500;
            mockCollection.deleteOne.mockRejectedValue(deleteError);

            const req = { params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('deletion of category failed');
        });

        it('should handle moveFilesToOther failure', async () => {
            // perform action to test
            const moveError = new Error('failed to move files to other');
            moveError.status = 500;
            mockMoveFilesToOther.mockRejectedValue(moveError);

            const req = { params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('failed to move files to other');
        });

        it('should fail if category not found', async () => {
            // perform action to test
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
            const req = { params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('deletion failed: category not found with given category id');
        });

        it('should fail if Other category id given', async () => {
            // perform action to test
            categoryId = 0;      
            const req = { params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('invalid category id: cannot delete Other category');
        });

        it('should fail with missing category id', async () => {
            // perform action to test
            categoryId = ''
            const req = { params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to delete category: invalid or missing category id');
        });

        it('should fail with invalid category id', async () => {
            // perform action to test
            categoryId = 'not-valid-id'
            const req = { params: { categoryId: categoryId }, locals: { db: mockDb } };

            await categories.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to delete category: invalid or missing category id');
        });
    });
});