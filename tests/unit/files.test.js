import { files } from '../../routes/files.js';
import { ObjectId } from 'mongodb';
import { unitHelpers } from './helpers.js';

describe('files', () => {
    let err, mockRes, mockNext, mockCollection, mockDb, mockBucket, locals, mockCreateError;
    let creditsResponse, bufferResponse, thumbnailResponse, gcsResponse, idResponse;
    let mockIsSuperAdmin, mockGetCredits, mockDeductCredits, mockRemoveBackground, mockb64ToBuffer, mockCreateImageThumbnail, mockUploadToGCS, mockDeleteFromGCS, mockParse, mockCreateId;
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

            creditsResponse,
            bufferResponse,
            thumbnailResponse,
            gcsResponse,
            idResponse,

            mockIsSuperAdmin,
            mockGetCredits,
            mockDeductCredits,
            mockRemoveBackground,
            mockb64ToBuffer,
            mockCreateImageThumbnail,
            mockUploadToGCS,
            mockDeleteFromGCS,
            mockParse,
            mockCreateId,
        } = unitHelpers);
    });

    afterEach(() => {
        unitHelpers.afterEach();
    });

    describe('post', () => {
        let params, body, user, req;
        beforeEach(() => {
            params = {
                clientId: ObjectId().toString(),
                categoryId: ObjectId().toString(),
            };
            body = {
                fileSrc: 'file source string',
                fullFileName: 'blaze-tastic.png',
                tags: [ObjectId().toString(), ObjectId().toString()],
                rmbg: true,
                crop: true,
            };
            user = {
                id: params.clientId,
                isAdmin: false,
                isSuperAdmin: false,
            };
            req = { params, body, user, locals };

            mockCollection.toArray.mockResolvedValue([{ category: '1' }]);
        });

        afterEach(() => {
            process.env.NODE_ENV = 'test';
        });

        async function makeFunctionCall() {
            await files.post(req, mockRes, mockNext);
        }

        it('should create new file', async () => {
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockIsSuperAdmin).toHaveBeenCalledWith(mockDb, params.clientId);
            expect(mockGetCredits).toHaveBeenCalledWith(mockDb, params.clientId);
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(body.fileSrc, body.crop);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(bufferResponse, 300, 300);
            expect(mockParse).toHaveBeenCalledWith(body.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${idResponse}/full.png`, bufferResponse);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${idResponse}/small.png`, thumbnailResponse);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockDeductCredits).toHaveBeenCalledWith(mockDb, params.clientId, creditsResponse);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should create correct file path for non-production environment', async () => {
            process.env.NODE_ENV = 'staging';
            await makeFunctionCall();

            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/items/${idResponse}/full.png`, bufferResponse);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `dev/items/${idResponse}/small.png`, thumbnailResponse);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should create correct file path for production environment', async () => {
            process.env.NODE_ENV = 'production';
            await makeFunctionCall();

            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `items/${idResponse}/full.png`, bufferResponse);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `items/${idResponse}/small.png`, thumbnailResponse);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should not deduct credits for super admin client', async () => {
            mockIsSuperAdmin.mockResolvedValueOnce(true);
            await makeFunctionCall();

            expect(mockDeductCredits).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should allow super admin user to not rmbg', async () => {
            req.user.isSuperAdmin = true;
            req.body.rmbg = false;
            await makeFunctionCall();

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should allow super admin user to not crop', async () => {
            req.user.isSuperAdmin = true;
            req.body.crop = false;
            await makeFunctionCall();

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should allow super admin user to not rmbg and crop', async () => {
            req.user.isSuperAdmin = true;
            req.body.rmbg = false;
            req.body.crop = false;
            await makeFunctionCall();

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should allow admin user to not crop', async () => {
            req.user.isAdmin = true;
            req.body.rmbg = false;
            await makeFunctionCall();

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should allow admin user to not crop', async () => {
            req.user.isAdmin = true;
            req.body.crop = false;
            await makeFunctionCall();

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should allow admin user to not rmbg and crop', async () => {
            req.user.isAdmin = true;
            req.body.rmbg = false;
            req.body.crop = false;
            await makeFunctionCall();

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should not rmbg', async () => {
            req.user.isSuperAdmin = true;
            req.body.rmbg = false;
            await makeFunctionCall();

            expect(mockRemoveBackground).not.toHaveBeenCalled();
            expect(mockb64ToBuffer).toHaveBeenCalledWith(body.fileSrc);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should not crop', async () => {
            req.user.isSuperAdmin = true;
            req.body.crop = false;
            await makeFunctionCall();

            expect(mockRemoveBackground).toHaveBeenCalledWith(body.fileSrc, false);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should fail if non-admin user does not rmbg', async () => {
            req.body.rmbg = false;
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('non-admins must remove background and crop image on file upload', 403);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should fail if non-admin user does not crop', async () => {
            req.body.crop = false;
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('non-admins must remove background and crop image on file upload', 403);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should fail if non-admin user does not rmbg and crop', async () => {
            req.body.rmbg = false;
            req.body.crop = false;
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('non-admins must remove background and crop image on file upload', 403);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle find error', async () => {
            err = new Error('Find error');
            mockCollection.find.mockImplementationOnce(() => { throw err });
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle toArray error', async () => {
            err = new Error('ToArray error');
            mockCollection.toArray.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should fail if no category found', async () => {
            mockCollection.toArray.mockResolvedValueOnce([]);
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith(`cannot add file: no category or multiple categories with the id "${params.categoryId.toString()}" exist`, 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should fail if multiple categories found', async () => {
            mockCollection.toArray.mockResolvedValueOnce([{ category: '1' }, { category: '2' }]);
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith(`cannot add file: no category or multiple categories with the id "${params.categoryId.toString()}" exist`, 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle isSuperAdmin error', async () => {
            err = new Error('IsSuperAdmin error');
            mockIsSuperAdmin.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockIsSuperAdmin).toHaveBeenCalledWith(mockDb, params.clientId);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle getCredits error', async () => {
            err = new Error('GetCredits error');
            mockGetCredits.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockGetCredits).toHaveBeenCalledWith(mockDb, params.clientId);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should fail if insufficient credits', async () => {
            mockGetCredits.mockResolvedValueOnce(0);
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('client does not have any credits', 403);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle createId error', async () => {
            err = new Error('CreateId error');
            mockCreateId.mockImplementationOnce(() => { throw err });
            await makeFunctionCall();

            expect(mockCreateId).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle removeBackground error', async () => {
            err = new Error('RemoveBackground error');
            mockRemoveBackground.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockRemoveBackground).toHaveBeenCalledWith(body.fileSrc, body.crop);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle b64ToBuffer error', async () => {
            req.user.isAdmin = true;
            req.body.rmbg = false;
            err = new Error('b64ToBuffer error');
            mockb64ToBuffer.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockb64ToBuffer).toHaveBeenCalledWith(body.fileSrc);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle createImageThumbnail error', async () => {
            err = new Error('createImageThumbnail error');
            mockCreateImageThumbnail.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(bufferResponse, 300, 300);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle parse error', async () => {
            err = new Error('parse error');
            mockParse.mockImplementationOnce(() => { throw err });
            await makeFunctionCall();

            expect(mockParse).toHaveBeenCalledWith(body.fullFileName);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should fail if file is not parsed properly', async () => {
            mockParse.mockReturnValueOnce({ Name: 'blaze-tastic', extension: 'png' });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('error parsing file name', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle uploadToGCS error (large file)', async () => {
            err = new Error('uploadToGCS error');
            mockUploadToGCS.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${idResponse}/full.png`, bufferResponse);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle uploadToGCS error (small file)', async () => {
            err = new Error('uploadToGCS error');
            mockUploadToGCS.mockResolvedValueOnce();
            mockUploadToGCS.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${idResponse}/full.png`, bufferResponse);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${idResponse}/small.png`, thumbnailResponse);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle updateOne error', async () => {
            err = new Error('updateOne error');
            mockCollection.updateOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle if nothing inserted', async () => {
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('insertion of file failed: category not found with given category id', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle deductCredits error', async () => {
            err = new Error('deductCredits error');
            mockDeductCredits.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockDeductCredits).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('get', () => {
        let params, req;
        let mockFiles;
        beforeEach(() => {
            const file = {
                clientId: ObjectId().toString(),
                fileName: 'blaze-tastic',
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url',
                fullGcsDest: 'dev/items/id/full.png',
                smallGcsDest: 'dev/items/id/small.png',
                gcsId: idResponse,
                tags: [ObjectId().toString(), ObjectId().toString()],
            };
            mockFiles = [file, file];

            params = {
                clientId: file.clientId,
            };
            req = { params, locals };

            mockCollection.toArray.mockResolvedValue(mockFiles);
        });

        async function makeFunctionCall() {
            await files.get(req, mockRes, mockNext);
        }

        it('should get files for client', async () => {
            await makeFunctionCall();

            expect(mockCollection.aggregate).toHaveBeenCalled();
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockFiles);
        });

        it('should handle aggregate error', async () => {
            err = new Error('aggregate error');
            mockCollection.aggregate.mockImplementationOnce(() => { throw err });
            await makeFunctionCall();

            expect(mockCollection.aggregate).toHaveBeenCalled();
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
    
    describe('patchName', () => {
        let params, body, req;
        beforeEach(async () => {
            params = {
                categoryId: ObjectId().toString(),
                gcsId: idResponse,
            }
            body = {
                name: 'Blaze-Tastic',
                tags: [ObjectId().toString()],
            };
            req = { params, body, locals };
        });

        async function makeFunctionCall() {
            await files.patchName(req, mockRes, mockNext);
        }

        it('should update file name', async () => {
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

        it('should fail if not file updated', async () => {
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('update of file name failed: category or file not found with given category or gcs id', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('patchCategory', () => {
        let params, body, req;
        beforeEach(async () => {
            params = {
                categoryId: ObjectId().toString(),
                gcsId: idResponse,
            };
            body = {
                newCategoryId: ObjectId().toString(),
            };
            req = { params, body, locals };

            mockCollection.findOne.mockResolvedValue({ 
                _id: ObjectId(params.categoryId),
                items: [
                    { gcsId: params.gcsId },
                ],
            });
        });

        async function makeFunctionCall() {
            await files.patchCategory(req, mockRes, mockNext);
        }

        it('should update file category', async () => {
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle findOne error', async () => {
            err = new Error('findOne error');
            mockCollection.findOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no file found', async () => {
            mockCollection.findOne.mockResolvedValueOnce();
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('failed to retrieve file from database', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle first updateOne error', async () => {
            err = new Error('updateOne error');
            mockCollection.updateOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no first update', async () => {
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
            expect(mockCreateError).toHaveBeenCalledWith('update of file category failed: file not added to new category', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle second updateOne error', async () => {
            err = new Error('updateOne error');
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
            mockCollection.updateOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no second update', async () => {
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
            expect(mockCreateError).toHaveBeenCalledWith('update of file category failed: file not removed from current category', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('delete', () => {
        let params, req;
        beforeEach(async () => {
            params = {
                categoryId: ObjectId().toString(),
                gcsId: idResponse,
            };
            req = { params, locals };

            mockCollection.findOne.mockResolvedValue({
                _id: ObjectId(params.categoryId),
                items: [
                    { 
                        gcsId: params.gcsId, 
                        fullGcsDest: 'full/gcs/dest.png',
                        smallGcsDest: 'small/gcs/dest.png',
                    },
                ],
            });
        });

        async function makeFunctionCall() {
            await files.delete(req, mockRes, mockNext);
        }

        it('should delete file', async () => {
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'full/gcs/dest.png');
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'small/gcs/dest.png');
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle findOne error', async () => {
            err = new Error('findOne error');
            mockCollection.findOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no file found', async () => {
            mockCollection.findOne.mockResolvedValueOnce();
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('failed to retrieve file from database', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);           
        });

        it('should handle file without fullGcsDest', async () => {
            mockCollection.findOne.mockResolvedValueOnce({
                _id: ObjectId(params.categoryId),
                items: [
                    {
                        gcsId: idResponse,
                        smallGcsDest: 'small/gcs/dest.png',
                    },
                ],
            });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('file does not have both a full and small gcs path', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);           
        });

        it('should handle file without smallGcsDest', async () => {
            mockCollection.findOne.mockResolvedValueOnce({
                _id: ObjectId(params.categoryId),
                items: [
                    {
                        gcsId: idResponse,
                        fullGcsDest: 'full/gcs/dest.png',
                    },
                ],
            });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('file does not have both a full and small gcs path', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);           
        });

        it('should handle file without fullGcsDest and smallGcsDest', async () => {
            mockCollection.findOne.mockResolvedValueOnce({
                _id: ObjectId(params.categoryId),
                items: [
                    {
                        gcsId: idResponse,
                    },
                ],
            });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('file does not have both a full and small gcs path', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);           
        });

        it('should handle first deleteFromGcs error', async () => {
            err = new Error('deleteFromGcs error');
            mockDeleteFromGCS.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'full/gcs/dest.png');
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle second deleteFromGcs error', async () => {
            err = new Error('deleteFromGcs error');
            mockDeleteFromGCS.mockResolvedValueOnce();
            mockDeleteFromGCS.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'full/gcs/dest.png');
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'small/gcs/dest.png');
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle updateOne error', async () => {
            err = new Error('updateOne error');
            mockCollection.updateOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no deletion', async () => {
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('deletion of file failed: file not deleted from database', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });
});