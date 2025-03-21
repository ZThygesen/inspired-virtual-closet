import { jest } from '@jest/globals';
import { clients } from '../../routes/clients.js';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers.js';

describe('clients', () => {
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
            findOne: jest.fn().mockResolvedValue(),
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
            data = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'jdoe@gmail.com',
                credits: 350,
                isAdmin: false
            };
        });

        it('should create new client', async () => {
            // perform action to test
            mockCollection.insertOne.mockResolvedValue({ insertedId: 'success_id' });
            const req = { body: data, locals: { db: mockDb } };

            await clients.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.insertOne).toHaveBeenCalledWith(data);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle insertion failure', async () => {
            // perform action to test
            const insertError = new Error('insertion of new client failed');
            insertError.status = 500;
            mockCollection.insertOne.mockRejectedValue(insertError);

            const req = { body: data, locals: { db: mockDb } };

            await clients.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.insertOne).toHaveBeenCalledWith(data);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('insertion of new client failed');
        });

        it('should fail if nothing inserted into database', async () => {
            // perform action to test
            mockCollection.insertOne.mockResolvedValue({ insertedId: '' });

            const req = { body: data, locals: { db: mockDb } };

            await clients.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.insertOne).toHaveBeenCalledWith(data);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('client was not inserted into database');
        });
        
        it('should fail with missing first name', async () => {
            // perform action to test
            data.firstName = '';
            const req = { body: data, locals: { db: mockDb } };

            await clients.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('both first name and last name fields are required for client creation');
        });

        it('should fail with missing last name', async () => {
            // perform action to test
            delete data.lastName;
            const req = { body: data, locals: { db: mockDb } };

            await clients.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('both first name and last name fields are required for client creation');
        });

        it('should fail with missing email', async () => {
            // perform action to test
            data.email = '';
            const req = { body: data, locals: { db: mockDb } };

            await clients.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('an email is required for client creation');
        });

        it('should fail with missing credits', async () => {
            // perform action to test
            delete data.credits;
            const req = { body: data, locals: { db: mockDb } };

            await clients.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('credits missing or must be of type number to create client');
        });

        it('should fail with invalid credits', async () => {
            // perform action to test
            data.credits = 'not a number';
            const req = { body: data, locals: { db: mockDb } };

            await clients.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('credits missing or must be of type number to create client');
        });

        it('should fail with missing admin status', async () => {
            // perform action to test
            delete data.isAdmin;
            const req = { body: data, locals: { db: mockDb } };

            await clients.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('a role status is required for client creation');
        });
    });

    describe('read', () => {
        let data;
        beforeEach(() => {
            data = {
                _id: new ObjectId(),
                firstName: 'John',
                lastName: 'Doe',
                email: 'jdoe@gmail.com',
                credits: 350,
                isAdmin: false
            };
        });

        it('should get clients', async () => {
            // perform action to test
            const mockClients = [data];
            mockCollection.toArray.mockResolvedValue(mockClients);
            const req = { locals: { db: mockDb } };

            await clients.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockClients);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle find failure', async () => {
            // perform action to test
            const findError = new Error('retrieval of clients failed');
            findError.status = 500;
            mockCollection.find.mockImplementation(() => { throw findError });
            const req = { locals: { db: mockDb } };

            await clients.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ });
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('retrieval of clients failed');
        });

        it('should handle toArray failure', async () => {
            // perform action to test
            const toArrayError = new Error('array transformation of clients failed');
            toArrayError.status = 500;
            mockCollection.toArray.mockRejectedValue(toArrayError);
            const req = { locals: { db: mockDb } };

            await clients.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('array transformation of clients failed');
        });
    });

    describe('read client', () => {
        let data;
        beforeEach(() => {
            data = {
                _id: new ObjectId(),
                firstName: 'John',
                lastName: 'Doe',
                email: 'jdoe@gmail.com',
                credits: 350,
                isAdmin: false
            };
        });

        it('should get client', async () => {
            // perform action to test
            const mockClient = data;
            mockCollection.findOne.mockResolvedValue(mockClient);
            const req = { params: { clientId: data._id.toString() }, locals: { db: mockDb } };

            await clients.getClient(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: data._id });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockClient);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle findOne failure', async () => {
            // perform action to test
            const findError = new Error('retrieval of client failed');
            findError.status = 500;
            mockCollection.findOne.mockRejectedValue(findError);
            const req = { params: { clientId: data._id.toString() }, locals: { db: mockDb } };

            await clients.getClient(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: data._id });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('retrieval of client failed');
        });

        it('should fail if client not found', async () => {
            // perform action to test
            mockCollection.findOne.mockResolvedValue();
            const req = { params: { clientId: data._id.toString() }, locals: { db: mockDb } };

            await clients.getClient(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: data._id });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('client not found');
        });

        it('should fail with missing client id', async () => {
            // perform action to test
            const req = { locals: { db: mockDb } };

            await clients.getClient(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to get client: invalid or missing client id');
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            const req = { params: { clientId: 'not-valid-id' }, locals: { db: mockDb } };

            await clients.getClient(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to get client: invalid or missing client id');
        });
    });
    
    describe('update', () => {
        let data;
        let clientId;
        beforeEach(async () => {
            data = {
                newFirstName: 'John',
                newLastName: 'Doe',
                newEmail: 'jdoe@gmail.com',
                newCredits: 450,
                newIsAdmin: false
            };

            clientId = (new ObjectId()).toString();
        });

        it('should update client', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle update failure', async () => {
            // perform action to test
            const updateError = new Error('update of client failed');
            updateError.status = 500;
            mockCollection.updateOne.mockRejectedValue(updateError);

            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update of client failed');
        });

        it('should fail if client not found', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });
            
            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('update failed: client not found with given client id or nothing was updated');
        });

        it('should fail with missing client id', async () => {
            // perform action to test
            const req = { body: data, locals: { db: mockDb } };

            await clients.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update client: invalid or missing client id');
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            clientId = 'not-valid-id';
            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update client: invalid or missing client id');
        });
        
        it('should fail with missing first name', async () => {
            // perform action to test
            data.newFirstName = '';
            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('both first name and last name fields are required for client update');
        });

        it('should fail with missing last name', async () => {
            // perform action to test
            delete data.newLastName;
            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('both first name and last name fields are required for client update');
        });

        it('should fail with missing email', async () => {
            // perform action to test
            data.newEmail = '';
            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('an email is required for client update');
        });

        it('should fail with missing credits', async () => {
            // perform action to test
            data.newCredits = undefined;
            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('credits missing or must be of type number to update client');
        });

        it('should fail with invalid credits', async () => {
            // perform action to test
            data.newCredits = 'not a number';
            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('credits missing or must be of type number to update client');
        });

        it('should fail with missing admin status', async () => {
            // perform action to test
            delete data.newIsAdmin;
            const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.patch(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('a role status is required for client update');
        });
    });

    describe('delete', () => {
        let clientId;
        beforeEach(async () => {
            clientId = (new ObjectId()).toString();
        });

        it('should delete client', async () => {
            // perform action to test
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!'});
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle delete failure', async () => {
            // perform action to test
            const deleteError = new Error('deletion of client failed');
            deleteError.status = 500;
            mockCollection.deleteOne.mockRejectedValue(deleteError);

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('deletion of client failed');
        });

        it('should fail if client not found', async () => {
            // perform action to test
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('deletion failed: client not found with given client id');
        });

        it('should fail with missing client id', async () => {
            // perform action to test
            const req = { locals: { db: mockDb } };

            await clients.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to delete client: invalid or missing client id');
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            clientId = new ObjectId();
            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await clients.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to delete client: invalid or missing client id');
        });
    });
});