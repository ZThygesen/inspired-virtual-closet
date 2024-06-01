import { jest } from '@jest/globals';
import { outfits } from '../../routes/outfits.js';
import cuid2, { createId } from '@paralleldrive/cuid2';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers.js';

describe('outfits', () => {
    let mockRes;
    let mockNext;
    let err;

    let mockCollection;
    let mockDb;
    let mockBucket;

    let mockCreateError;
    let mockCreateId;
    let createIdResponse = '4n_1d_f0r_0u7f1t5';
    let mockb64ToBuffer;
    let mockUploadToGCS;
    let uploadToGCSResponse = 'outfit.file.url';
    let mockDeleteFromGCS;
    let mockJSONParse;
    let JSONResponse = { stage: 'items', as: 'json' };
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

        mockBucket = { bucket: 'head' };

        mockCreateError = jest.spyOn(helpers, 'createError');
        mockCreateError.mockImplementation((message, status) => {
            const error = new Error(message);
            error.status = status;
            return error;
        });

        mockCreateId = jest.spyOn(cuid2, 'createId');
        mockCreateId.mockReturnValue(createIdResponse);

        mockb64ToBuffer = jest.spyOn(helpers, 'b64ToBuffer');
        mockb64ToBuffer.mockImplementation((fileSrc) => {
            return Buffer.from(fileSrc);
        });

        mockUploadToGCS = jest.spyOn(helpers, 'uploadToGCS');
        mockUploadToGCS.mockImplementation(() => uploadToGCSResponse);

        mockDeleteFromGCS = jest.spyOn(helpers, 'deleteFromGCS');
        mockDeleteFromGCS.mockResolvedValue();

        mockJSONParse = jest.spyOn(JSON, 'parse');
        mockJSONParse.mockImplementation(() => JSONResponse);
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe('create', () => {
        let data;
        beforeEach(() => {
            data = {
                fileSrc: 'file source string',
                stageItemsStr: 'stage items string',
                outfitName: 'Blazin Blazer Blast',
                clientId: (new ObjectId()).toString()
            };

            mockCollection.toArray.mockResolvedValue([{ client: 'exists' }]);
        });

        afterEach(() => {
            process.env.NODE_ENV = 'test';
        });

        it('should create new outfit - non-production environment', async () => {
            // perform action to test
            mockCollection.insertOne.mockResolvedValue({ insertedId: 'success_id' });
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/outfits/${createIdResponse}.png`, Buffer.from(data.fileSrc));
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                clientId: data.clientId,
                stageItems: JSONResponse,
                outfitName: data.outfitName,
                outfitUrl: uploadToGCSResponse,
                gcsDest: `dev/outfits/${createIdResponse}.png`
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should create new outfit - production environment', async () => {
            // perform action to test
            process.env.NODE_ENV = 'production';
            mockCollection.insertOne.mockResolvedValue({ insertedId: 'success_id' });
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `outfits/${createIdResponse}.png`, Buffer.from(data.fileSrc));
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                clientId: data.clientId,
                stageItems: JSONResponse,
                outfitName: data.outfitName,
                outfitUrl: uploadToGCSResponse,
                gcsDest: `outfits/${createIdResponse}.png`
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle find failure', async () => {
            // perform action to test
            const findError = new Error('retrieval of clients failed');
            findError.status = 500;
            mockCollection.find.mockImplementation(() => { throw findError });

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
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

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('array transformation of clients failed');
        });

        it('should handle b64ToBuffer failure', async () => {
            // perform action to test
            const bufferError = new Error('b64toBuffer conversion of file source failed');
            bufferError.status = 500;
            mockb64ToBuffer.mockRejectedValue(bufferError);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('b64toBuffer conversion of file source failed');
        });

        it('should handle createId failure', async () => {
            // perform action to test
            const createIdError = new Error('createId failed');
            createIdError.status = 500;
            mockCreateId.mockImplementation(() => { throw createIdError });

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('createId failed');
        });

        it('should handle uploadToGCS failure', async () => {
            // perform action to test
            const uploadError = new Error('uploadToGCS failed');
            uploadError.status = 500;
            mockUploadToGCS.mockRejectedValue(uploadError);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/outfits/${createIdResponse}.png`, Buffer.from(data.fileSrc));
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('uploadToGCS failed');
        });

        it('should handle JSON parse failure', async () => {
            // perform action to test
            const parseError = new Error('JSON parsing failed');
            parseError.status = 500;
            mockJSONParse.mockImplementation(() => { throw parseError });

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/outfits/${createIdResponse}.png`, Buffer.from(data.fileSrc));
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('JSON parsing failed');
        });

        it('should handle insertion failure', async () => {
            // perform action to test
            const insertError = new Error('insertion of outfit failed');
            insertError.status = 500;
            mockCollection.insertOne.mockRejectedValue(insertError);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/outfits/${createIdResponse}.png`, Buffer.from(data.fileSrc));
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                clientId: data.clientId,
                stageItems: JSONResponse,
                outfitName: data.outfitName,
                outfitUrl: uploadToGCSResponse,
                gcsDest: `dev/outfits/${createIdResponse}.png`
            });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('insertion of outfit failed');
        });

        it('should fail if nothing inserted into database', async () => {
            // perform action to test
            mockCollection.insertOne.mockResolvedValue({ insertedId: '' });
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/outfits/${createIdResponse}.png`, Buffer.from(data.fileSrc));
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                clientId: data.clientId,
                stageItems: JSONResponse,
                outfitName: data.outfitName,
                outfitUrl: uploadToGCSResponse,
                gcsDest: `dev/outfits/${createIdResponse}.png`
            });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('outfit was not inserted into database');
        });

        it('should fail if no client found given client id', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([]);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe(`no client or multiple clients with the id "${data.clientId}" was found`);
        });

        it('should fail if multiple clients found given client id', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([{ client: 'exists' }, { anotherClient: 'exists' }]);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe(`no client or multiple clients with the id "${data.clientId}" was found`);
        });

        it('should fail with missing file source', async () => {
            // perform action to test
            data.fileSrc = '';
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('file source is required to create outfit');
        });

        it('should fail with missing stage items', async () => {
            // perform action to test
            delete data.stageItemsStr;
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('stage items string is required to create outfit');
        });

        it('should fail with missing outfit name', async () => {
            // perform action to test
            data.outfitName = null;
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('outfit name is required to create outfit');
        });

        it('should fail with missing client id', async () => {
            // perform action to test
            data.clientId = undefined;
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('client id is required to create outfit');
        });

    //     it('should fail with missing email', async () => {
    //         // perform action to test
    //         data.email = '';
    //         const req = { body: data, locals: { db: mockDb } };

    //         await clients.post(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.insertOne).not.toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(400);
    //         expect(err.message).toBe('an email is required for client creation');
    //     });

    //     it('should fail with missing admin status', async () => {
    //         // perform action to test
    //         delete data.isAdmin;
    //         const req = { body: data, locals: { db: mockDb } };

    //         await clients.post(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.insertOne).not.toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(400);
    //         expect(err.message).toBe('a role status is required for client creation');
    //     });
    });

    // describe('read', () => {
    //     let data;
    //     beforeEach(() => {
    //         data = {
    //             _id: new ObjectId(),
    //             firstName: 'John',
    //             lastName: 'Doe',
    //             email: 'jdoe@gmail.com',
    //             isAdmin: false
    //         };
    //     });

    //     it('should get clients', async () => {
    //         // perform action to test
    //         const mockClients = [data];
    //         mockCollection.toArray.mockResolvedValue(mockClients);
    //         const req = { locals: { db: mockDb } };

    //         await clients.get(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.find).toHaveBeenCalledWith({ });
    //         expect(mockCollection.toArray).toHaveBeenCalled();
    //         expect(mockRes.status).toHaveBeenCalledWith(200);
    //         expect(mockRes.json).toHaveBeenCalledWith(mockClients);
    //         expect(mockNext).not.toHaveBeenCalled();
    //     });

    //     it('should handle find failure', async () => {
    //         // perform action to test
    //         const findError = new Error('retrieval of clients failed');
    //         findError.status = 500;
    //         mockCollection.find.mockImplementation(() => { throw findError });
    //         const req = { locals: { db: mockDb } };

    //         await clients.get(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.find).toHaveBeenCalledWith({ });
    //         expect(mockCollection.toArray).not.toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(500);
    //         expect(err.message).toBe('retrieval of clients failed');
    //     });

    //     it('should handle toArray failure', async () => {
    //         // perform action to test
    //         const toArrayError = new Error('array transformation of clients failed');
    //         toArrayError.status = 500;
    //         mockCollection.toArray.mockRejectedValue(toArrayError);
    //         const req = { locals: { db: mockDb } };

    //         await clients.get(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.find).toHaveBeenCalledWith({ });
    //         expect(mockCollection.toArray).toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(500);
    //         expect(err.message).toBe('array transformation of clients failed');
    //     });
    // });
    
    // describe('update', () => {
    //     let data;
    //     let clientId;
    //     beforeEach(async () => {
    //         data = {
    //             newFirstName: 'John',
    //             newLastName: 'Doe',
    //             newEmail: 'jdoe@gmail.com',
    //             newIsAdmin: false
    //         };

    //         clientId = (new ObjectId()).toString();
    //     });

    //     it('should update client', async () => {
    //         // perform action to test
    //         mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
    //         const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

    //         await clients.patch(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.updateOne).toHaveBeenCalled();
    //         expect(mockRes.status).toHaveBeenCalledWith(200);
    //         expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
    //         expect(mockNext).not.toHaveBeenCalled();
    //     });

    //     it('should handle update failure', async () => {
    //         // perform action to test
    //         const updateError = new Error('update of client failed');
    //         updateError.status = 500;
    //         mockCollection.updateOne.mockRejectedValue(updateError);

    //         const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

    //         await clients.patch(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.updateOne).toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(500);
    //         expect(err.message).toBe('update of client failed');
    //     });

    //     it('should fail if client not found', async () => {
    //         // perform action to test
    //         mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });
            
    //         const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

    //         await clients.patch(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.updateOne).toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(404);
    //         expect(err.message).toBe('update failed: client not found with given client id');
    //     });

    //     it('should fail with missing client id', async () => {
    //         // perform action to test
    //         const req = { body: data, locals: { db: mockDb } };

    //         await clients.patch(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.updateOne).not.toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(400);
    //         expect(err.message).toBe('client id is required to update client');
    //     });
        
    //     it('should fail with missing first name', async () => {
    //         // perform action to test
    //         data.newFirstName = '';
    //         const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

    //         await clients.patch(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.updateOne).not.toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(400);
    //         expect(err.message).toBe('both first name and last name fields are required for client update');
    //     });

    //     it('should fail with missing last name', async () => {
    //         // perform action to test
    //         delete data.newLastName;
    //         const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

    //         await clients.patch(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.updateOne).not.toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(400);
    //         expect(err.message).toBe('both first name and last name fields are required for client update');
    //     });

    //     it('should fail with missing email', async () => {
    //         // perform action to test
    //         data.newEmail = '';
    //         const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

    //         await clients.patch(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.updateOne).not.toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(400);
    //         expect(err.message).toBe('an email is required for client update');
    //     });

    //     it('should fail with missing admin status', async () => {
    //         // perform action to test
    //         delete data.newIsAdmin;
    //         const req = { body: data, params: { clientId: clientId }, locals: { db: mockDb } };

    //         await clients.patch(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.updateOne).not.toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(400);
    //         expect(err.message).toBe('a role status is required for client update');
    //     });
    // });

    // describe('delete', () => {
    //     let clientId;
    //     beforeEach(async () => {
    //         clientId = (new ObjectId()).toString();
    //     });

    //     it('should delete client', async () => {
    //         // perform action to test
    //         mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
    //         const req = { params: { clientId: clientId }, locals: { db: mockDb } };

    //         await clients.delete(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
    //         expect(mockRes.status).toHaveBeenCalledWith(200);
    //         expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!'});
    //         expect(mockNext).not.toHaveBeenCalled();
    //     });

    //     it('should handle delete failure', async () => {
    //         // perform action to test
    //         const deleteError = new Error('deletion of client failed');
    //         deleteError.status = 500;
    //         mockCollection.deleteOne.mockRejectedValue(deleteError);

    //         const req = { params: { clientId: clientId }, locals: { db: mockDb } };

    //         await clients.delete(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(500);
    //         expect(err.message).toBe('deletion of client failed');
    //     });

    //     it('should fail if client not found', async () => {
    //         // perform action to test
    //         mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
    //         const req = { params: { clientId: clientId }, locals: { db: mockDb } };

    //         await clients.delete(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(404);
    //         expect(err.message).toBe('deletion failed: client not found with given client id');
    //     });

    //     it('should fail with missing client id', async () => {
    //         // perform action to test
    //         clientId = ''
    //         const req = { params: { clientId: clientId }, locals: { db: mockDb } };

    //         await clients.delete(req, mockRes, mockNext);

    //         // perform checks
    //         expect(mockDb.collection).toHaveBeenCalledWith('clients');
    //         expect(mockCollection.deleteOne).not.toHaveBeenCalled();
    //         expect(mockRes.status).not.toHaveBeenCalled();
    //         expect(mockRes.json).not.toHaveBeenCalled();
    //         expect(mockNext).toHaveBeenCalled();
    //         expect(err).toBeInstanceOf(Error);
    //         expect(err.status).toBe(400);
    //         expect(err.message).toBe('client id is required to delete client');
    //     });
    // });
});