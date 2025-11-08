import { outfits } from '../../routes/outfits.js';
import { ObjectId } from 'mongodb';
import { unitHelpers } from './helpers.js';

describe('outfits', () => {
    let err, mockRes, mockNext, mockCollection, mockDb, mockBucket, locals, mockCreateError;
    let whiteBgResponse, bufferResponse, gcsResponse, idResponse;
    let mockb64ToBuffer, mockAddWhiteBackground, mockUploadToGCS, mockDeleteFromGCS, mockCreateId;

    beforeEach(() => {
        unitHelpers.beforeEach();
        ({
            mockRes,
            mockNext,
            mockCollection,
            mockDb,
            mockBucket,
            locals,
            mockCreateError,

            whiteBgResponse,
            bufferResponse,
            gcsResponse,
            idResponse,

            mockb64ToBuffer,
            mockAddWhiteBackground,
            mockUploadToGCS,
            mockDeleteFromGCS,
            mockCreateId,
        } = unitHelpers);
    });

    afterEach(() => {
        unitHelpers.afterEach();
    });

    describe('post', () => {
        let params, body, req;
        beforeEach(() => {
            params = {
                clientId: ObjectId().toString(),
            };
            body = {
                fileSrc: 'file source string',
                stageItems: '"state items string"',
                outfitName: 'Blazin Blazer Blast',
                filesUsed: ['file1', 'file2'],
            };
            req = { params, body, locals };
        });

        afterEach(() => {
            process.env.NODE_ENV = 'test';
        });

        async function makeFunctionCall() {
            await outfits.post(req, mockRes, mockNext);
        }

        it('should create new outfit', async () => {
            await makeFunctionCall();            

            expect(mockCreateId).toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(body.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(bufferResponse);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${idResponse}.png`, whiteBgResponse);
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                clientId: params.clientId.toString(),
                stageItems: body.stageItems,
                outfitName: body.outfitName,
                filesUsed: body.filesUsed,
                outfitUrl: gcsResponse,
                gcsDest: `test/outfits/${idResponse}.png`,
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should create correct file path for non-production environment', async () => {
            process.env.NODE_ENV = 'staging';
            await makeFunctionCall();    

            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/outfits/${idResponse}.png`, whiteBgResponse);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should create correct file path for production environment', async () => {
            process.env.NODE_ENV = 'production';
            await makeFunctionCall();    

            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `outfits/${idResponse}.png`, whiteBgResponse);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle createId error', async () => {
            err = new Error('createId error');
            mockCreateId.mockImplementationOnce(() => { throw err; });
            await makeFunctionCall();

            expect(mockCreateId).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle b64ToBuffer error', async () => {
            err = new Error('b64ToBuffer error');
            mockb64ToBuffer.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockb64ToBuffer).toHaveBeenCalledWith(body.fileSrc);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle addWhiteBackground error', async () => {
            err = new Error('addWhiteBackground error');
            mockAddWhiteBackground.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockAddWhiteBackground).toHaveBeenCalledWith(bufferResponse);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle uploadToGCS error', async () => {
            err = new Error('uploadToGCS error');
            mockUploadToGCS.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${idResponse}.png`, whiteBgResponse);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle insertOne error', async () => {
            err = new Error('insertOne error');
            mockCollection.insertOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.insertOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle if nothing inserted', async () => {
            mockCollection.insertOne.mockResolvedValueOnce({ insertedId: null });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('outfit was not inserted into database', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('get', () => {
        let params, req;
        let mockOutfits;
        beforeEach(() => {
            const outfit = {
                _id: ObjectId(),
                clientId: ObjectId().toString(),
                stageItems: { stage: 'items', as: 'json' },
                outfitName: 'Blazin Blazer Blast',
                filesUsed: ['file1', 'file2'],
                outfitUrl: 'outfit.file.url',
                gcsDest: 'dev/outfits/id.png',
            };
            mockOutfits = [outfit, outfit];

            params = {
                clientId: outfit.clientId,
            };
            req = { params, locals };

            mockCollection.toArray.mockResolvedValue(mockOutfits);
        });

        async function makeFunctionCall() {
            await outfits.get(req, mockRes, mockNext);
        }

        it('should get outfits for client', async () => {
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ clientId: params.clientId });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockOutfits);
        });

        it('should handle find error', async () => {
            err = new Error('find error');
            mockCollection.find.mockImplementationOnce(() => { throw err; });
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ clientId: params.clientId });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle toArray error', async () => {
            err = new Error('toArray error');
            mockCollection.toArray.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });
    
    describe('patchFull', () => {
        let params, body, req;
        beforeEach(async () => {
            params = {
                clientId: ObjectId().toString(),
                outfitId: ObjectId().toString(),
            }
            body = {
                fileSrc: 'file source string',
                stageItemsStr: 'stage items string',
                outfitName: 'Blazin Blazer Blast',
                filesUsed: ['file1', 'file2'],
                gcsDest: 'dev/outfits/id.png'
            };
            req = { params, body, locals };

            mockCollection.findOne.mockResolvedValue({
                _id: ObjectId(params.outfitId),
            });
        });

        afterEach(() => {
            process.env.NODE_ENV = 'test';
        });

        async function makeFunctionCall() {
            await outfits.patchFull(req, mockRes, mockNext);
        }

        it('should update outfit', async () => {
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.outfitId });
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(body.fileSrc);
            expect(mockAddWhiteBackground).toHaveBeenCalledWith(bufferResponse);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${idResponse}.png`, whiteBgResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, body.gcsDest);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should update outfit with correct file path for non-production environment', async () => {
            process.env.NODE_ENV = 'staging';
            await makeFunctionCall();

            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/outfits/${idResponse}.png`, whiteBgResponse);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should update outfit with correct file path for production environment', async () => {
            process.env.NODE_ENV = 'production';
            await makeFunctionCall();

            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `outfits/${idResponse}.png`, whiteBgResponse);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle createId error', async () => {
            err = new Error('createId error');
            mockCreateId.mockImplementationOnce(() => { throw err; });
            await makeFunctionCall();

            expect(mockCreateId).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle b64ToBuffer error', async () => {
            err = new Error('b64ToBuffer error');
            mockb64ToBuffer.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockb64ToBuffer).toHaveBeenCalledWith(body.fileSrc);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle addWhiteBackground error', async () => {
            err = new Error('addWhiteBackground error');
            mockAddWhiteBackground.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockAddWhiteBackground).toHaveBeenCalledWith(bufferResponse);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle uploadToGCS error', async () => {
            err = new Error('uploadToGCS error');
            mockUploadToGCS.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/outfits/${idResponse}.png`, whiteBgResponse);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle updateOne error', async () => {
            err = new Error('updateOne error');
            mockCollection.updateOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle if nothing updated', async () => {
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('update failed: outfit not found with given outfit id', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle deleteFromGCS error', async () => {
            err = new Error('deleteFromGCS error');
            mockDeleteFromGCS.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, body.gcsDest);
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('patchPartial', () => {
        let params, body, req;
        beforeEach(async () => {
            params = {
                clientId: ObjectId().toString(),
                outfitId: ObjectId().toString(),
            };
            body = { 
                outfitName: 'Blazin Blazer Blast',
            };
            req = { params, body, locals };
        });

        async function makeFunctionCall() {
            await outfits.patchPartial(req, mockRes, mockNext);
        }

        it('should update outfit', async () => {
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle updateOne error', async () => {
            err = new Error('updateOne error');
            mockCollection.updateOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should fail if outfit not updated', async () => {
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('update failed: outfit not found with given outfit id', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('delete', () => {
        let params, req;
        let outfit;
        beforeEach(async () => {
            params = {
                clientId: ObjectId().toString(),
                outfitId: ObjectId().toString(),
            };
            req = { params, locals };

            outfit = {
                _id: ObjectId(params.outfitId),
                gcsDest: 'dev/outfits/id.png',
            }
            mockCollection.findOne.mockResolvedValue(outfit);
        });

        async function makeFunctionCall() {
            await outfits.delete(req, mockRes, mockNext);
        }

        it('should delete outfit', async () => {
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.outfitId });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, outfit.gcsDest);
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: params.outfitId });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!'});
        });

        it('should handle findOne error', async () => {
            err = new Error('findOne error');
            mockCollection.findOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.outfitId });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no outfit found', async () => {
            mockCollection.findOne.mockResolvedValueOnce();
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('outfit not found with given outfit id or is missing gcs destination', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);           
        });

        it('should handle outfit without gcsDest', async () => {
            delete outfit.gcsDest;
            mockCollection.findOne.mockResolvedValueOnce(outfit);
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('outfit not found with given outfit id or is missing gcs destination', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);           
        });

        it('should handle deleteFromGcs error', async () => {
            err = new Error('deleteFromGcs error');
            mockDeleteFromGCS.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, outfit.gcsDest);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle deleteOne error', async () => {
            err = new Error('deleteOne error');
            mockCollection.deleteOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.deleteOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no deletion', async () => {
            mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 0 });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('deletion failed: outfit not found with given outfit id', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });
});