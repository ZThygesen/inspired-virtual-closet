import { items } from '../../routes/items.js';
import { ObjectId } from 'mongodb';
import { unitHelpers } from './helpers.js';

describe('items', () => {
    let err, mockRes, mockNext, mockCollection, mockDb, mockBucket, locals, mockCreateError;
    let creditsResponse, bufferResponse, thumbnailResponse, gcsResponse, idResponse;
    let mockIsSuperAdmin, mockGetCredits, mockDeductCredits, mockRemoveBackground, mockb64ToBuffer, mockCreateImageThumbnail, mockUploadToGCS, mockDeleteFromGCS, mockParse, mockCreateId, mockGetViewableCategories;
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

            mockCategoryExists,
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
            mockGetViewableCategories,
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
            };
            body = {
                categoryId: ObjectId().toString(),
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
        });

        afterEach(() => {
            process.env.NODE_ENV = 'test';
        });

        async function makeFunctionCall() {
            await items.post(req, mockRes, mockNext);
        }

        it('should create new item', async () => {
            await makeFunctionCall();

            expect(mockCategoryExists).toHaveBeenCalledWith(mockDb, body.categoryId);
            expect(mockIsSuperAdmin).toHaveBeenCalledWith(mockDb, params.clientId);
            expect(mockGetCredits).toHaveBeenCalledWith(mockDb, params.clientId);
            expect(mockCreateId).toHaveBeenCalled();
            expect(mockRemoveBackground).toHaveBeenCalledWith(body.fileSrc, body.crop);
            expect(mockb64ToBuffer).not.toHaveBeenCalled();
            expect(mockCreateImageThumbnail).toHaveBeenCalledWith(bufferResponse, 300, 300);
            expect(mockParse).toHaveBeenCalledWith(body.fullFileName);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${idResponse}/full.png`, bufferResponse);
            expect(mockUploadToGCS).toHaveBeenCalledWith(mockBucket, `test/items/${idResponse}/small.png`, thumbnailResponse);
            expect(mockCollection.insertOne).toHaveBeenCalled();
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

        it('should handle categoryExists error', async () => {
            err = new Error('categoryExists error');
            mockCategoryExists.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCategoryExists).toHaveBeenCalledWith(mockDb, body.categoryId);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should fail if no category found', async () => {
            mockCategoryExists.mockResolvedValueOnce(false);
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith(`cannot add item: no categories with the id "${body.categoryId}" exist`, 404);
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

        it('should handle insertOne error', async () => {
            err = new Error('insertOne error');
            mockCollection.insertOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.insertOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle if nothing inserted', async () => {
            mockCollection.insertOne.mockResolvedValueOnce({ });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('item was not inserted into database', 500);
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
        let params, user, req;
        let mockItems;
        beforeEach(() => {
            const item = {
                clientId: ObjectId().toString(),
                categoryId: ObjectId().toString(),
                fileName: 'blaze-tastic',
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url',
                fullGcsDest: 'dev/items/id/full.png',
                smallGcsDest: 'dev/items/id/small.png',
                gcsId: idResponse,
                tags: [ObjectId().toString(), ObjectId().toString()],
            };
            mockItems = [item, item];

            params = {
                clientId: item.clientId,
            };

            user = {
                id: params.clientId,
                isAdmin: true,
                isSuperAdmin: true,
            };
            req = { params, user, locals };

            mockCollection.toArray.mockResolvedValue(mockItems);
            mockGetViewableCategories.mockResolvedValue([item.categoryId]);
        });

        async function makeFunctionCall() {
            await items.get(req, mockRes, mockNext);
        }

        it('should get items for client', async () => {
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockGetViewableCategories).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockItems);
        });

        it('should get items for non-admin client', async () => {
            user.isSuperAdmin = false;
            user.isAdmin = false;
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockGetViewableCategories).toHaveBeenCalledWith(mockDb);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockItems);
        });

        it('should filter items not accessible to non-admin client', async () => {
            user.isSuperAdmin = false;
            user.isAdmin = false;
            mockGetViewableCategories.mockResolvedValueOnce([]);
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockGetViewableCategories).toHaveBeenCalledWith(mockDb);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith([]);
        });

        it('should handle find error', async () => {
            err = new Error('find error');
            mockCollection.find.mockImplementationOnce(() => { throw err });
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle toArray error', async () => {
            err = new Error('toArray error');
            mockCollection.toArray.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle getViewableCategories error', async () => {
            user.isSuperAdmin = false;
            user.isAdmin = false;
            err = new Error('getViewableCategories error');
            mockGetViewableCategories.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockGetViewableCategories).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });
    
    describe('patchName', () => {
        let params, body, req;
        beforeEach(async () => {
            params = {
                itemId: ObjectId().toString(),
            }
            body = {
                name: 'Blaze-Tastic',
                tags: [ObjectId().toString()],
            };
            req = { params, body, locals };
        });

        async function makeFunctionCall() {
            await items.patchName(req, mockRes, mockNext);
        }

        it('should update item name', async () => {
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

        it('should fail if not item updated', async () => {
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('update of item failed: item not found with given item id', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('patchCategory', () => {
        let params, body, req;
        beforeEach(async () => {
            params = {
                itemId: ObjectId().toString(),
            };
            body = {
                newCategoryId: ObjectId().toString(),
            };
            req = { params, body, locals };
        });

        async function makeFunctionCall() {
            await items.patchCategory(req, mockRes, mockNext);
        }

        it('should update item category', async () => {
            await makeFunctionCall();

            expect(mockCategoryExists).toHaveBeenCalledWith(mockDb, body.newCategoryId);
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle categoryExists error', async () => {
            err = new Error('categoryExists error');
            mockCategoryExists.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCategoryExists).toHaveBeenCalledWith(mockDb, body.newCategoryId);
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should fail if no category found', async () => {
            mockCategoryExists.mockResolvedValueOnce(false);
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith(`cannot change item category: no categories with the id "${body.newCategoryId}" exist`, 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });

        it('should handle updateOne error', async () => {
            err = new Error('updateOne error');
            mockCollection.updateOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no update', async () => {
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockCreateError).toHaveBeenCalledWith('item category not updated', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('delete', () => {
        let params, req;
        beforeEach(async () => {
            params = {
                itemId: ObjectId().toString(),
            };
            req = { params, locals };

            mockCollection.findOne.mockResolvedValue({
                _id: ObjectId(params.itemId),
                fullGcsDest: 'full/gcs/dest.png',
                smallGcsDest: 'small/gcs/dest.png',
            });
        });

        async function makeFunctionCall() {
            await items.delete(req, mockRes, mockNext);
        }

        it('should delete item', async () => {
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.itemId });
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'full/gcs/dest.png');
            expect(mockDeleteFromGCS).toHaveBeenCalledWith(mockBucket, 'small/gcs/dest.png');
            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: params.itemId });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle findOne error', async () => {
            err = new Error('findOne error');
            mockCollection.findOne.mockRejectedValueOnce(err);
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.itemId });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no item found', async () => {
            mockCollection.findOne.mockResolvedValueOnce();
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('failed to retrieve item from database', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);           
        });

        it('should handle item without fullGcsDest', async () => {
            mockCollection.findOne.mockResolvedValueOnce({
                _id: ObjectId(params.itemId),
                smallGcsDest: 'small/gcs/dest.png',
            });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('item does not have both a full and small gcs path', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);           
        });

        it('should handle item without smallGcsDest', async () => {
            mockCollection.findOne.mockResolvedValueOnce({
                _id: ObjectId(params.itemId),
                fullGcsDest: 'full/gcs/dest.png',
            });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('item does not have both a full and small gcs path', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);           
        });

        it('should handle item without fullGcsDest and smallGcsDest', async () => {
            mockCollection.findOne.mockResolvedValueOnce({
                _id: ObjectId(params.itemId),
            });
            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('item does not have both a full and small gcs path', 500);
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

            expect(mockCreateError).toHaveBeenCalledWith('deletion of item failed: item not deleted from database', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });
});