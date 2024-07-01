import { jest } from '@jest/globals';
import { outfits } from '../../routes/outfits.js';
import cuid2 from '@paralleldrive/cuid2';
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
    let mockAddWhiteBackground;
    let whiteBackgroundResponse = Buffer.from('white background data');
    let mockUploadToGCS;
    let uploadToGCSResponse = 'outfit.file.url';
    let mockDeleteFromGCS;
    let mockJSONParse;
    let JSONResponse = { stage: 'items', as: 'json' };
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

        mockAddWhiteBackground = jest.spyOn(helpers, 'addWhiteBackground');
        mockAddWhiteBackground.mockImplementation(() => whiteBackgroundResponse);

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
        let clientId;
        let data;
        beforeEach(() => {
            clientId = (new ObjectId()).toString(); 
            data = {
                fileSrc: 'file source string',
                stageItemsStr: 'stage items string',
                outfitName: 'Blazin Blazer Blast'
            };

            mockCollection.toArray.mockResolvedValue([{ client: 'exists' }]);
        });

        afterEach(() => {
            process.env.NODE_ENV = 'test';
        });

        it('should create new outfit - test environment', async () => {
            // perform action to test
            mockCollection.insertOne.mockResolvedValue({ insertedId: 'success_id' });
            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                clientId: clientId,
                stageItems: JSONResponse,
                outfitName: data.outfitName,
                outfitUrl: uploadToGCSResponse,
                gcsDest: `test/outfits/${createIdResponse}.png`
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should create new outfit - non-production environment', async () => {
            // perform action to test
            process.env.NODE_ENV = 'dev';
            mockCollection.insertOne.mockResolvedValue({ insertedId: 'success_id' });
            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                clientId: clientId,
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
            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                clientId: clientId,
                stageItems: JSONResponse,
                outfitName: data.outfitName,
                outfitUrl: uploadToGCSResponse,
                gcsDest: `outfits/${createIdResponse}.png`
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle JSON parse failure', async () => {
            // perform action to test
            const parseError = new Error('JSON parsing failed');
            parseError.status = 500;
            mockJSONParse.mockImplementation(() => { throw parseError });

            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('JSON parsing failed');
        });

        it('should handle find failure', async () => {
            // perform action to test
            const findError = new Error('retrieval of clients failed');
            findError.status = 500;
            mockCollection.find.mockImplementation(() => { throw findError });

            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
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

            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
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

            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('b64toBuffer conversion of file source failed');
        });

        it('should handle addWhiteBackground failure', async () => {
            // perform action to test
            const bufferError = new Error('white background conversion failed');
            bufferError.status = 500;
            mockAddWhiteBackground.mockRejectedValue(bufferError);

            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('white background conversion failed');
        });

        it('should handle createId failure', async () => {
            // perform action to test
            const createIdError = new Error('createId failed');
            createIdError.status = 500;
            mockCreateId.mockImplementation(() => { throw createIdError });

            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
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

            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('uploadToGCS failed');
        });

        it('should handle insertion failure', async () => {
            // perform action to test
            const insertError = new Error('insertion of outfit failed');
            insertError.status = 500;
            mockCollection.insertOne.mockRejectedValue(insertError);

            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                clientId: clientId,
                stageItems: JSONResponse,
                outfitName: data.outfitName,
                outfitUrl: uploadToGCSResponse,
                gcsDest: `test/outfits/${createIdResponse}.png`
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
            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                clientId: clientId,
                stageItems: JSONResponse,
                outfitName: data.outfitName,
                outfitUrl: uploadToGCSResponse,
                gcsDest: `test/outfits/${createIdResponse}.png`
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

            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe(`cannot create outfit: no client or multiple clients with the id "${clientId}" exist`);
        });

        it('should fail if multiple clients found given client id', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([{ client: 'exists' }, { anotherClient: 'exists' }]);

            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe(`cannot create outfit: no client or multiple clients with the id "${clientId}" exist`);
        });

        it('should fail with missing file source', async () => {
            // perform action to test
            data.fileSrc = '';
            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
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
            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('stage items string is missing or invalid');
        });

        it('should fail with invalid stage items', async () => {
            // perform action to test
            data.stageItemsStr = { stage: 'items' };
            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('stage items string is missing or invalid');
        });

        it('should fail with missing outfit name', async () => {
            // perform action to test
            data.outfitName = null;
            const req = { params: { clientId: clientId }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
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
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update outfit: invalid or missing client id');
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            const req = { params: { clientId: 'not-valid-id' }, fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.post(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.insertOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update outfit: invalid or missing client id');
        });
    });

    describe('read', () => {
        let clientId;
        let data;
        beforeEach(() => {
            clientId = (new ObjectId()).toString();
            data = {
                _id: (new ObjectId()).toString(),
                clientId: clientId,
                stageItems: { stage: 'items', as: 'json' },
                outfitName: 'Blazin Blazer Blast',
                outfitUrl: 'outfit.file.url',
                gcsDest: 'dev/outfits/id.png'
            };
        });

        it('should get outfits for client', async () => {
            // perform action to test
            const mockOutfits = [data, data];
            mockCollection.toArray.mockResolvedValueOnce([{ client: 'exists' }]);
            mockCollection.toArray.mockResolvedValueOnce(mockOutfits);

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await outfits.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.find).toHaveBeenCalledWith({ clientId: clientId });
            expect(mockCollection.toArray).toHaveBeenCalledTimes(2);
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockOutfits);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle find failure: client search', async () => {
            // perform action to test
            const findError = new Error('retrieval of clients failed');
            findError.status = 500;
            mockCollection.find.mockImplementation(() => { throw findError });

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await outfits.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('retrieval of clients failed');
        });

        it('should handle toArray failure: client search', async () => {
            // perform action to test
            const toArrayError = new Error('array transformation of clients failed');
            toArrayError.status = 500;
            mockCollection.toArray.mockRejectedValue(toArrayError);

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await outfits.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalledTimes(1);
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('array transformation of clients failed');
        });

        it('should handle find failure: outfit search', async () => {
            // perform action to test
            mockCollection.find.mockImplementationOnce();
            mockCollection.toArray.mockResolvedValueOnce([{ client: 'exists' }]);

            const findError = new Error('retrieval of clients failed');
            findError.status = 500;
            mockCollection.find.mockImplementationOnce(() => { throw findError });

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await outfits.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.find).toHaveBeenCalledWith({ clientId: clientId });
            expect(mockCollection.toArray).toHaveBeenCalledTimes(1);
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('retrieval of clients failed');
        });

        it('should handle toArray failure: outfit search', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValueOnce([{ client: 'exists' }]);

            const toArrayError = new Error('array transformation of clients failed');
            toArrayError.status = 500;
            mockCollection.toArray.mockRejectedValueOnce(toArrayError);

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await outfits.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.find).toHaveBeenCalledWith({ clientId: clientId });
            expect(mockCollection.toArray).toHaveBeenCalledTimes(2);
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('array transformation of clients failed');
        });

        it('should fail if no client found given client id', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([]);

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await outfits.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalledTimes(1);
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe(`cannot get outfits: no client or multiple clients with the id "${clientId}" exist`);
        });

        it('should fail if multiple clients found given client id', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([{ client: 'exists' }, { anotherClient: 'exists' }]);

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await outfits.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(clientId) });
            expect(mockCollection.toArray).toHaveBeenCalledTimes(1);
            expect(mockDb.collection).not.toHaveBeenCalledWith('outfits');
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe(`cannot get outfits: no client or multiple clients with the id "${clientId}" exist`);
        });

        it('should fail if client id missing', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValueOnce([{ client: 'exists' }]);
            clientId = '';
            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await outfits.get(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to get outfits: invalid or missing client id');
        });

        it('should fail if client id invalid', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValueOnce([{ client: 'exists' }]);
            clientId = 'not-valid-id';
            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await outfits.get(req, mockRes, mockNext);

            // perform checks
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to get outfits: invalid or missing client id');
        });
    });
    
    describe('update full', () => {
        let data;
        let outfitId;
        beforeEach(async () => {
            data = {
                fileSrc: 'file source string',
                stageItemsStr: 'stage items string',
                outfitName: 'Blazin Blazer Blast',
                gcsDest: 'dev/outfits/id.png'
            };

            outfitId = (new ObjectId()).toString();

            mockCollection.toArray.mockResolvedValue([{ outfit: 'exists' }]);
        });

        afterEach(() => {
            process.env.NODE_ENV = 'test';
        });

        it('should update client: test environment', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, data.gcsDest);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should update client: non-production environment', async () => {
            // perform action to test
            process.env.NODE_ENV = 'dev';
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, data.gcsDest);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should update client: production environment', async () => {
            // perform action to test
            process.env.NODE_ENV = 'production';
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, data.gcsDest);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle JSON parse failure', async () => {
            // perform action to test
            const parseError = new Error('JSON parsing failed');
            parseError.status = 500;
            mockJSONParse.mockImplementation(() => { throw parseError });

            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('JSON parsing failed');
        });

        it('should handle b64ToBuffer failure', async () => {
            // perform action to test
            const bufferError = new Error('b64toBuffer conversion of file source failed');
            bufferError.status = 500;
            mockb64ToBuffer.mockRejectedValue(bufferError);

            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('b64toBuffer conversion of file source failed');
        });

        it('should handle addWhiteBackground failure', async () => {
            // perform action to test
            const bufferError = new Error('white background conversion failed');
            bufferError.status = 500;
            mockAddWhiteBackground.mockRejectedValue(bufferError);

            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('white background conversion failed');
        });

        it('should handle createId failure', async () => {
            // perform action to test
            const createIdError = new Error('createId failed');
            createIdError.status = 500;
            mockCreateId.mockImplementation(() => { throw createIdError });

            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('createId failed');
        });

        it('should handle find failure', async () => {
            // perform action to test
            const findError = new Error('find failed');
            findError.status = 500;
            mockCollection.find.mockImplementation(() => { throw findError });

            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('find failed');
        });

        it('should handle toArray failure', async () => {
            // perform action to test
            const toArrayError = new Error('toArray failed');
            toArrayError.status = 500;
            mockCollection.toArray.mockRejectedValue(toArrayError);

            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('toArray failed');
        });

        it('should handle fail if toArray returns nothing', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([]);

            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe(`cannot create outfit: no outfit or multiple outfits with the id "${outfitId}" exist`);
        });

        it('should handle deleteFromGCS failure', async () => {
            // perform action to test
            const deleteError = new Error('deletion of outfit failed');
            deleteError.status = 500;
            mockDeleteFromGCS.mockRejectedValue(deleteError);

            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, data.gcsDest);
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('deletion of outfit failed');
        });

        it('should handle uploadToGCS failure', async () => {
            // perform action to test
            const uploadError = new Error('uploadToGCS failed');
            uploadError.status = 500;
            mockUploadToGCS.mockRejectedValue(uploadError);

            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, data.gcsDest);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('uploadToGCS failed');
        });

        it('should handle update failure', async () => {
            // perform action to test
            const updateError = new Error('update of outfit failed');
            updateError.status = 500;
            mockCollection.updateOne.mockRejectedValue(updateError);

            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, data.gcsDest);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update of outfit failed');
        });

        it('should fail if nothing updated', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });

            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).toHaveBeenCalledWith(data.stageItemsStr);
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(Buffer.from(data.fileSrc));
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, data.gcsDest);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${createIdResponse}.png`, whiteBackgroundResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('update failed: outfit not found with given outfit id');
        });

        it('should fail with missing file source', async () => {
            // perform action to test
            data.fileSrc = '';
            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('file source is required to update outfit');
        });

        it('should fail with missing stage items string', async () => {
            // perform action to test
            delete data.stageItemsStr;
            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('stage items string is required to update outfit');
        });

        it('should fail with missing outfit name', async () => {
            // perform action to test
            data.outfitName = null;
            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('outfit name is required to update outfit');
        });

        it('should fail with missing gcsDest', async () => {
            // perform action to test
            data.gcsDest = undefined;
            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('gcsDest is required to update outfit');
        });

        it('should fail with missing outfit id', async () => {
            // perform action to test
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update outfit content: invalid or missing outfit id');
        });

        it('should fail with invalid outfit id', async () => {
            // perform action to test
            outfitId = 'not-valid-id'
            const req = { fields: data, params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.patchFull(req, mockRes, mockNext);

            // perform checks
            expect(mockJSONParse).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockAddWhiteBackground).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update outfit content: invalid or missing outfit id');
        });
    });

    describe('update partial', () => {
        let data;
        let outfitId;
        beforeEach(async () => {
            data = { newName: 'Blazin Blazer Blast' };

            outfitId = (new ObjectId()).toString();
        });

        it('should update client', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { body: data, params: { outfitId: outfitId }, locals: { db: mockDb } };

            await outfits.patchPartial(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle update failure', async () => {
            // perform action to test
            const updateError = new Error('update of outfit failed');
            updateError.status = 500;
            mockCollection.updateOne.mockRejectedValue(updateError);

            const req = { body: data, params: { outfitId: outfitId }, locals: { db: mockDb } };

            await outfits.patchPartial(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update of outfit failed');
        });

        it('should fail if nothing updated', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });

            const req = { body: data, params: { outfitId: outfitId }, locals: { db: mockDb } };

            await outfits.patchPartial(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('update failed: outfit not found with given outfit id');
        });

        it('should fail with missing outfit name', async () => {
            // perform action to test
            data.newName = null;
            const req = { body: data, params: { outfitId: outfitId }, locals: { db: mockDb } };

            await outfits.patchPartial(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('outfit name is required to update outfit');
        });

        it('should fail with missing outfit id', async () => {
            // perform action to test
            outfitId = '';
            const req = { body: data, params: { outfitId: outfitId }, locals: { db: mockDb } };

            await outfits.patchPartial(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update outfit name: invalid or missing outfit id');
        });

        it('should fail with invalid outfit id', async () => {
            // perform action to test
            outfitId = 'not-valid-id';
            const req = { body: data, params: { outfitId: outfitId }, locals: { db: mockDb } };

            await outfits.patchPartial(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update outfit name: invalid or missing outfit id');
        });
    });

    describe('delete', () => {
        let outfitId;
        let outfit;
        beforeEach(async () => {
            outfitId = (new ObjectId()).toString();

            outfit = {
                _id: new ObjectId(),
                clientId: (new ObjectId()).toString(),
                stageItems: { stage: 'items', as: 'json' },
                outfitName: 'Blazin Blazer Blast',
                outfitUrl: 'outfit.file.url',
                gcsDest: 'dev/outfits/id.png'
            };
            mockCollection.findOne.mockResolvedValue(outfit)
        });

        it('should delete client', async () => {
            // perform action to test
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
            const req = { params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, outfit.gcsDest);
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!'});
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle findOne failure', async () => {
            // perform action to test
            const findError = new Error('retrieval of outfit failed');
            findError.status = 500;
            mockCollection.findOne.mockRejectedValue(findError);

            const req = { params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('retrieval of outfit failed');
        });

        it('should handle deleteFromGCS failure', async () => {
            // perform action to test
            const deleteError = new Error('deletion of outfit from GCS failed');
            deleteError.status = 500;
            mockDeleteFromGCS.mockRejectedValue(deleteError);

            const req = { params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, outfit.gcsDest);
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('deletion of outfit from GCS failed');
        });

        it('should handle deletion failure', async () => {
            // perform action to test
            const deleteError = new Error('deletion of outfit failed');
            deleteError.status = 500;
            mockCollection.deleteOne.mockRejectedValue(deleteError);

            const req = { params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, outfit.gcsDest);
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('deletion of outfit failed');
        });

        it('should fail if findOne finds no outfit', async () => {
            // perform action to test
            mockCollection.findOne.mockResolvedValue();

            const req = { params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('outfit not found with given outfit id or is missing gcs destination');
        });

        it('should fail if outfit not deleted', async () => {
            // perform action to test
            mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

            const req = { params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('outfits');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, outfit.gcsDest);
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId(outfitId) });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('deletion failed: outfit not found with given outfit id');
        });

        it('should fail with missing outfit id', async () => {
            // perform action to test
            outfitId = '';

            const req = { params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to delete outfit: invalid or missing outfit id');
        });

        it('should fail with invalid outfit id', async () => {
            // perform action to test
            outfitId = 'not-valid-id';

            const req = { params: { outfitId: outfitId }, locals: { db: mockDb, bucket: mockBucket } };

            await outfits.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockCollection.deleteOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to delete outfit: invalid or missing outfit id');
        });
    });
});