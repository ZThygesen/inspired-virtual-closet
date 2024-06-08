import { jest } from '@jest/globals';
import { files } from '../../routes/files.js';
import cuid2 from '@paralleldrive/cuid2';
import path from 'path';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers.js';

describe('files', () => {
    let mockRes;
    let mockNext;
    let err;

    let mockCollection;
    let mockDb;
    let mockBucket;

    let mockCreateError;
    let mockCreateId;
    let createIdResponse = '4n_1d_f0r_f1l35';
    let mockRemoveBackground;
    let mockb64ToBuffer;
    let mockCreateImageThumbnail;
    let imageThumbnailResponse = Buffer.from('image thumbnail data');
    let mockUploadToGCS;
    let uploadToGCSResponse = 'file.url';
    let mockParse;
    let parseResponse = { name: 'blaze-tastic', extension: 'png' };
    let mockDeleteFromGCS;
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
            find: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockResolvedValue(),
            toArray: jest.fn().mockResolvedValue(),
            updateOne: jest.fn().mockResolvedValue(),
            aggregate: jest.fn().mockReturnThis()
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

        mockRemoveBackground = jest.spyOn(helpers, 'removeBackground');
        mockRemoveBackground.mockImplementation((fileSrc) => {
            return Buffer.from(fileSrc);
        });

        mockb64ToBuffer = jest.spyOn(helpers, 'b64ToBuffer');
        mockb64ToBuffer.mockImplementation((fileSrc) => {
            return Buffer.from(fileSrc);
        });

        mockCreateImageThumbnail = jest.spyOn(helpers, 'createImageThumbnail');
        mockCreateImageThumbnail.mockImplementation(() => imageThumbnailResponse);

        mockUploadToGCS = jest.spyOn(helpers, 'uploadToGCS');
        mockUploadToGCS.mockImplementation(() => uploadToGCSResponse);

        mockParse = jest.spyOn(path, 'parse');
        mockParse.mockImplementation(() => parseResponse);

        mockDeleteFromGCS = jest.spyOn(helpers, 'deleteFromGCS');
        mockDeleteFromGCS.mockResolvedValue();
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
                fullFileName: 'blaze-tastic.png',
                clientId: (new ObjectId()).toString(),
                categoryId: (new ObjectId()).toString(),
                rmbg: 'true'
            };

            mockCollection.toArray.mockResolvedValue([{ category: 'exists' }]);
        });

        afterEach(() => {
            process.env.NODE_ENV = 'test';
        });

        it('should create new file - test environment, remove background', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/full.png`, Buffer.from(data.fileSrc));
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/small.png`, imageThumbnailResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should create new file - non-production environment, no remove background', async () => {
            // perform action to test
            data.rmbg = 'false';
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/full.png`, Buffer.from(data.fileSrc));
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/small.png`, imageThumbnailResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should create new file - non-production environment, remove background', async () => {
            // perform action to test
            process.env.NODE_ENV = 'dev';
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/items/${createIdResponse}/full.png`, Buffer.from(data.fileSrc));
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/items/${createIdResponse}/small.png`, imageThumbnailResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should create new file - non-production environment, no remove background', async () => {
            // perform action to test
            process.env.NODE_ENV = 'dev';
            data.rmbg = 'false';
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/items/${createIdResponse}/full.png`, Buffer.from(data.fileSrc));
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/items/${createIdResponse}/small.png`, imageThumbnailResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should create new file - production environment, remove background', async () => {
            // perform action to test
            process.env.NODE_ENV = 'production';
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `items/${createIdResponse}/full.png`, Buffer.from(data.fileSrc));
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `items/${createIdResponse}/small.png`, imageThumbnailResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should create new file - production environment, no remove background', async () => {
            // perform action to test
            process.env.NODE_ENV = 'production';
            data.rmbg = 'false';
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `items/${createIdResponse}/full.png`, Buffer.from(data.fileSrc));
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `items/${createIdResponse}/small.png`, imageThumbnailResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should create new file - Other category given', async () => {
            // perform action to test
            data.categoryId = 0;
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: 0 });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/full.png`, Buffer.from(data.fileSrc));
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/small.png`, imageThumbnailResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle find failure', async () => {
            // perform action to test
            const findError = new Error('find failed');
            findError.status = 500;
            mockCollection.find.mockImplementation(() => { throw findError });

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
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

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('toArray failed');
        });

        it('should fail if no category found', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([]);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe(`cannot add file: no category or multiple categories with the id "${data.categoryId}" exist`);
        });

        it('should handle createId failure', async () => {
            // perform action to test
            const createIdError = new Error('createId failed');
            createIdError.status = 500;
            mockCreateId.mockImplementation(() => { throw createIdError });

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('createId failed');
        });

        it('should handle remove background failure', async () => {
            // perform action to test
            const rmbgError = new Error('removal of background failed');
            rmbgError.status = 500;
            mockRemoveBackground.mockRejectedValue(rmbgError);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('removal of background failed');
        });

        it('should handle b64ToBuffer failure', async () => {
            // perform action to test
            data.rmbg = false;
            const bufferError = new Error('conversion from b64 to buffer failed');
            bufferError.status = 500;
            mockb64ToBuffer.mockRejectedValue(bufferError);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(data.fileSrc);
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('conversion from b64 to buffer failed');
        });

        it('should handle createImageThumbnail failure', async () => {
            // perform action to test
            const thumbError = new Error('createImageThumbnail failed');
            thumbError.status = 500;
            mockCreateImageThumbnail.mockRejectedValue(thumbError);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('createImageThumbnail failed');
        });

        it('should handle parse failure (function throws error)', async () => {
            // perform action to test
            const parseError = new Error('parse file name failed');
            parseError.status = 500;
            mockParse.mockImplementation(() => { throw parseError });

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('parse file name failed');
        });

        it('should handle parse failure (returns invalid data)', async () => {
            // perform action to test
            mockParse.mockImplementation(() => {
                return { extension: 'png' };
            });

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('error parsing file name');
        });

        it('should handle uploadToGCS failure (large file)', async () => {
            // perform action to test
            const uploadError = new Error('uploadToGCS failed');
            uploadError.status = 500;
            mockUploadToGCS.mockRejectedValueOnce(uploadError);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/full.png`, Buffer.from(data.fileSrc));
            expect(mockUploadToGCS).toHaveBeenCalledTimes(1);
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('uploadToGCS failed');
        });

        it('should handle uploadToGCS failure (small file)', async () => {
            // perform action to test
            mockUploadToGCS.mockResolvedValueOnce();
            const uploadError = new Error('uploadToGCS failed');
            uploadError.status = 500;
            mockUploadToGCS.mockRejectedValueOnce(uploadError);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/full.png`, Buffer.from(data.fileSrc));
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/small.png`, imageThumbnailResponse);
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('uploadToGCS failed');
        });

        it('should handle insertion (update) failure', async () => {
            // perform action to test
            const updateError = new Error('insertion of file failed');
            updateError.status = 500;
            mockCollection.updateOne.mockRejectedValue(updateError);

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/full.png`, Buffer.from(data.fileSrc));
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/small.png`, imageThumbnailResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('insertion of file failed');
        });

        it('should fail if nothing inserted', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(data.categoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(Buffer.from(data.fileSrc), 300, 300);
            expect(mockParse).toHaveBeenCalledWith(data.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/full.png`, Buffer.from(data.fileSrc));
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${createIdResponse}/small.png`, imageThumbnailResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('insertion of file failed: category not found with given category id');
        });

        it('should fail with missing file source', async () => {
            // perform action to test
            data.fileSrc = null;

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('file source is required to create file');
        });

        it('should fail with missing file name', async () => {
            // perform action to test
            delete data.fullFileName;

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('file name is required to create file');
        });

        it('should fail with missing client id', async () => {
            // perform action to test
            data.clientId = undefined;

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to add file: invalid or missing client id');
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            data.clientId = 'not-valid-id';

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to add file: invalid or missing client id');
        });

        it('should fail with missing category id', async () => {
            // perform action to test
            data.categoryId = '';

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to add file: invalid or missing category id');
        });

        it('should fail with invalid category id', async () => {
            // perform action to test
            data.categoryId = 'not-valid-id';

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to add file: invalid or missing category id');
        });

        it('should fail with missing remove background option', async () => {
            // perform action to test
            delete data.rmbg;

            const req = { fields: data, locals: { db: mockDb, bucket: mockBucket } };

            await files.post(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCreateId).not.toHaveBeenCalled();
            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).not.toHaveBeenCalled();
            expect(mockParse).not.toHaveBeenCalled();
            expect(mockUploadToGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('background removal option is required to create file');
        });
    });

    describe('read', () => {
        let clientId;
        let data;
        beforeEach(() => {
            clientId = (new ObjectId()).toString();
            data = {
                clientId: clientId,
                fileName: 'blaze-tastic',
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url',
                fullGcsDest: 'dev/items/id/full.png',
                smallGcsDest: 'dev/items/id/small.png',
                gcsId: cuid2.createId()
            };
        });

        it('should get files for client', async () => {
            // perform action to test
            const mockFiles = [data, data];
            mockCollection.toArray.mockResolvedValue(mockFiles);

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await files.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.aggregate).toHaveBeenCalled();
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockFiles);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle aggregate failure', async () => {
            // perform action to test
            const aggregateError = new Error('aggregation of files failed');
            aggregateError.status = 500;
            mockCollection.aggregate.mockImplementation(() => { throw aggregateError });

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await files.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.aggregate).toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('aggregation of files failed');
        });

        it('should handle toArray failure', async () => {
            // perform action to test
            const toArrayError = new Error('array transformation of files failed');
            toArrayError.status = 500;
            mockCollection.toArray.mockRejectedValue(toArrayError);

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await files.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.aggregate).toHaveBeenCalled();
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('array transformation of files failed');
        });

        it('should fail with missing client id', async () => {
            // perform action to test
            clientId = '';

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await files.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.aggregate).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to get files: invalid or missing client id');
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            clientId = 'not-valid-id';

            const req = { params: { clientId: clientId }, locals: { db: mockDb } };

            await files.get(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.aggregate).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to get files: invalid or missing client id');
        });
    });
    
    describe('update file name', () => {
        let data;
        let categoryId;
        let gcsId;
        beforeEach(async () => {
            data = { newName: 'blaze-tastic' };

            categoryId = (new ObjectId()).toString();
            gcsId = cuid2.createId();
        });

        it('should update file name', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchName(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should update file name given Other category', async () => {
            // perform action to test
            categoryId = 0;
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchName(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle update failure', async () => {
            // perform action to test
            const updateError = new Error('update of file name failed');
            updateError.status = 500;
            mockCollection.updateOne.mockRejectedValue(updateError);

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchName(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update of file name failed');
        });

        it('should fail if no file found with given category and gcs id', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });
            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchName(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('update of file name failed: category or file not found with given category or gcs id');
        });

        it('should fail with missing file name', async () => {
            // perform action to test
            data.newName = null;
            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchName(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('file name is required to update file name');
        });

        it('should fail with missing category id', async () => {
            // perform action to test
            categoryId = '';
            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchName(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update file name: invalid or missing category id');
        });

        it('should fail with invalid category id', async () => {
            // perform action to test
            categoryId = 'not-valid-id';
            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchName(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update file name: invalid or missing category id');
        });

        it('should fail with missing gcs id', async () => {
            // perform action to test
            const req = { body: data, params: { categoryId: categoryId }, locals: { db: mockDb } };

            await files.patchName(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('gcs id is required to update file name');
        });
    });

    describe('update category', () => {
        let data;
        let newCategoryId;
        let categoryId;
        let gcsId;
        beforeEach(async () => {
            newCategoryId = (new ObjectId()).toString();
            categoryId = (new ObjectId()).toString();
            gcsId = cuid2.createId();

            data = { newCategoryId: newCategoryId };

            mockCollection.findOne.mockResolvedValue({
                _id: ObjectId(categoryId),
                name: 'Blazers',
                items: [
                    { gcsId: 'not this one' },
                    { gcsId: 'nope' },
                    { gcsId: gcsId },
                    { gcsId: 'not this one either' }
                ]
            });

            mockCollection.toArray.mockResolvedValue([{ file: 'exists' }]);
        });

        it('should update file category', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should update file category - current Other category', async () => {
            // perform action to test
            categoryId = '0';
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 0 });
            expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should update file category - new Other category', async () => {
            // perform action to test
            data.newCategoryId = 0;
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: 0 });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle find error', async () => {
            // perform action to test
            const findError = new Error('find failed');
            findError.status = 500;
            mockCollection.find.mockImplementation(() => { throw findError });

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('find failed');
        });

        it('should handle toArray error', async () => {
            // perform action to test
            const toArrayError = new Error('toArray failed');
            toArrayError.status = 500;
            mockCollection.toArray.mockRejectedValue(toArrayError);

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('toArray failed');
        });

        it('should fail if new category not found', async () => {
            // perform action to test
            mockCollection.toArray.mockResolvedValue([]);

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('cannot change file category: no category or multiple categories exist');
        });

        it('should handle findOne error', async () => {
            // perform action to test
            const findError = new Error('findOne failed');
            findError.status = 500;
            mockCollection.findOne.mockRejectedValue(findError);

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('findOne failed');
        });

        it('should handle update error (remove from current category)', async () => {
            // perform action to test
            const updateError = new Error('update failed');
            updateError.status = 500;
            mockCollection.updateOne.mockRejectedValue(updateError);

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update failed');
        });

        it('should handle update error (add to new category)', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

            const updateError = new Error('update failed');
            updateError.status = 500;
            mockCollection.updateOne.mockRejectedValueOnce(updateError);

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update failed');
        });

        it('should fail if no removal from category occurs', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('update of file category failed: file not removed from current category');
        });

        it('should fail if no insertion to new category occurs', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('update of file category failed: file not added to new category');
        });

        it('should fail if findOne returns nothing', async () => {
            // perform action to test
            mockCollection.findOne.mockResolvedValue();

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('failed to retrieve file from database');
        });

        it('should fail if findOne returns object without items', async () => {
            // perform action to test
            mockCollection.findOne.mockResolvedValue({ _id: ObjectId(categoryId), name: 'Blazers' });

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('failed to retrieve file from database');
        });

        it('should fail if findOne returns items without matching gcsId', async () => {
            // perform action to test
            mockCollection.findOne.mockResolvedValue({ _id: ObjectId(categoryId), name: 'Blazers', 
                items: [{ gcsId: 'nope' }, { gcsId: 'not this one' }, { gcsId: 'no dice' }]
            });

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.find).toHaveBeenCalledWith({ _id: ObjectId(newCategoryId) });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('failed to retrieve file from database');
        });

        it('should fail with missing new category id', async () => {
            // perform action to test
            data.newCategoryId = null;

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update file category: invalid or missing new category id');
        });

        it('should fail with invalid new category id', async () => {
            // perform action to test
            data.newCategoryId = 'not-valid-id';

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update file category: invalid or missing new category id');
        });

        it('should fail with missing category id', async () => {
            // perform action to test
            const req = { body: data, params: { gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update file category: invalid or missing category id');
        });

        it('should fail with invalid category id', async () => {
            // perform action to test
            categoryId = 'not-valid-id'
            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to update file category: invalid or missing category id');
        });

        it('should fail with missing gcs id', async () => {
            // perform action to test
            gcsId = '';

            const req = { body: data, params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb } };

            await files.patchCategory(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('gcs id is required to update file category');
        });
    });

    describe('delete', () => {
        let categoryId;
        let gcsId;
        beforeEach(async () => {
            categoryId = (new ObjectId()).toString();
            gcsId = cuid2.createId();

            mockCollection.findOne.mockResolvedValue({
                _id: ObjectId(categoryId),
                name: 'Blazers',
                items: [
                    { gcsId: 'not this one' },
                    { gcsId: 'nope' },
                    { gcsId: gcsId, fullGcsDest: 'full/gcs/dest.png', smallGcsDest: 'small/gcs/dest.png' },
                    { gcsId: 'not this one either' }
                ]
            });
        });

        it('should delete file', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'full/gcs/dest.png');
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'small/gcs/dest.png');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should delete file given Other category', async () => {
            // perform action to test
            categoryId = '0';
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 0 });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'full/gcs/dest.png');
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'small/gcs/dest.png');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle findOne error', async () => {
            // perform action to test
            const findError = new Error('findOne failed');
            findError.status = 500;
            mockCollection.findOne.mockRejectedValue(findError);

            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('findOne failed');
        });

        it('should handle deleteFromGCS error (full file)', async () => {
            // perform action to test
            const deleteError = new Error('deleteFromGCS failed');
            deleteError.status = 500;
            mockDeleteFromGCS.mockRejectedValue(deleteError);

            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'full/gcs/dest.png');
            expect(mockDeleteFromGCS).toHaveBeenCalledTimes(1);
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('deleteFromGCS failed');
        });

        it('should handle deleteFromGCS error (small file)', async () => {
            // perform action to test
            mockDeleteFromGCS.mockResolvedValueOnce();

            const deleteError = new Error('deleteFromGCS failed');
            deleteError.status = 500;
            mockDeleteFromGCS.mockRejectedValue(deleteError);

            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'full/gcs/dest.png');
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'small/gcs/dest.png');
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('deleteFromGCS failed');
        });

        it('should handle update error', async () => {
            // perform action to test
            const updateError = new Error('update failed');
            updateError.status = 500;
            mockCollection.updateOne.mockRejectedValue(updateError);

            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'full/gcs/dest.png');
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'small/gcs/dest.png');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('update failed');
        });

        it('should fail if no file deletion occurs', async () => {
            // perform action to test
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'full/gcs/dest.png');
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'small/gcs/dest.png');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(404);
            expect(err.message).toBe('deletion of file failed: file not deleted from database');
        });

        it('should fail if findOne returns nothing', async () => {
            // perform action to test
            mockCollection.findOne.mockResolvedValue();

            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('failed to retrieve file from database');
        });

        it('should fail if findOne returns object without items', async () => {
            // perform action to test
            mockCollection.findOne.mockResolvedValue({ _id: ObjectId(categoryId), name: 'Blazers' });

            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('failed to retrieve file from database');
        });

        it('should fail if findOne returns items without matching gcsId', async () => {
            // perform action to test
            mockCollection.findOne.mockResolvedValue({ _id: ObjectId(categoryId), name: 'Blazers', 
                items: [{ gcsId: 'nope'}, { gcsId: 'not this one' }, { gcsId: 'no dice' }]
            });

            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('failed to retrieve file from database');
        });

        it('should fail if findOne returns matching item without fullGcsDest', async () => {
            // perform action to test
            mockCollection.findOne.mockResolvedValue({ _id: ObjectId(categoryId), name: 'Blazers', 
                items: [{ gcsId: 'nope' }, { gcsId: gcsId, smallGcsDest: 'small/gcs/dest.png' }, { gcsId: 'no dice' }]
            });

            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('failed to retrieve file from database');
        });

        it('should fail if findOne returns matching item without smallGcsDest', async () => {
            // perform action to test
            mockCollection.findOne.mockResolvedValue({ _id: ObjectId(categoryId), name: 'Blazers', 
                items: [{ gcsId: 'nope' }, { gcsId: gcsId, fullGcsDest: 'full/gcs/dest.png' }, { gcsId: 'no dice' }]
            });

            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).toHaveBeenCalledWith('categories');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
            expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('failed to retrieve file from database');
        });

        it('should fail with missing category id', async () => {
            // perform action to test
            categoryId = '';
            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to delete file: invalid or missing category id');
        });

        it('should fail with invalid category id', async () => {
            // perform action to test
            categoryId = 'not-valid-id';
            const req = { params: { categoryId: categoryId, gcsId: gcsId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to delete file: invalid or missing category id');
        });

        it('should fail with missing gcs id', async () => {
            // perform action to test
            const req = { params: { categoryId: categoryId }, locals: { db: mockDb, bucket: mockBucket } };

            await files.delete(req, mockRes, mockNext);

            // perform checks
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('gcs id is required to delete file');
        });
    });
});