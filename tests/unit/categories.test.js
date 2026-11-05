import { categories } from '../../routes/categories';
import { ObjectId } from 'mongodb';
import { unitHelpers } from './helpers';

describe('categories', () => {
    let err, mockRes, mockNext, mockCollection, mockDb, locals, mockCreateError
    beforeEach(() => {
        unitHelpers.beforeEach();
        ({
            mockRes,
            mockNext,
            mockCollection,
            mockDb,
            locals,
            mockCreateError,
        } = unitHelpers);
    });

    afterEach(() => {
        unitHelpers.afterEach();
    });

    describe('post', () => {
        let body, req;
        beforeEach(() => {
            body = { 
                name: 'Blazers',
                group: 'Formal',
                type: 'clothes',
                clientViewItems: true,
                clientAddItems: true,
                rmbgItems: true,
            };
            req = { body, locals };

            mockCollection.toArray.mockResolvedValue([]);
        });

        async function makeFunctionCall() {
            await categories.post(req, mockRes, mockNext);
        }

        it('should create new category', async () => {
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ name: body.name });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.insertOne).toHaveBeenCalledWith({ ...body });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should not allow add if view is not allowed', async () => {
            body.clientViewItems = false;
            body.clientAddItems = true;
            await makeFunctionCall();

            expect(mockCollection.insertOne).toHaveBeenCalledWith({ ...body, clientAddItems: false });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should fail if category name already exists', async () => {
            // simulate category already existing
            mockCollection.toArray.mockResolvedValueOnce([body.name]);

            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith(`a category with the name "${body.name}" already exists`, 400);
        });

        it('should handle find error', async () => {
            // simulate error in find
            err = new Error('Find error');
            mockCollection.find.mockImplementationOnce(() => { throw err });

            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ name: body.name });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle toArray error', async () => {
            // simulate error in toArray
            err = new Error('ToArray error')
            mockCollection.toArray.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle insertOne error', async () => {
            // simulate insertOne error
            err = new Error('InsertOne error');
            mockCollection.insertOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.insertOne).toHaveBeenCalledWith({ ...body });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should fail if nothing inserted into database', async () => {
            // simulate no insertion
            mockCollection.insertOne.mockResolvedValueOnce({ insertedId: '' });

            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('category was not inserted into database', 500);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('get', () => {
        let user, req;
        let cats;
        beforeEach(() => {
            user = {
                id: ObjectId().toString(),
                isAdmin: true,
                isSuperAdmin: true,
            };
            req = { user, locals };
            
            cats = [
                { _id: 0, name: 'Other', group: '1' },
                { _id: '1', name: 'T-Shirts', group: '2' },
                { _id: '2', name: 'Jeans', group: '1' }
            ];

            mockCollection.toArray.mockResolvedValue(cats);
        });

        async function makeFunctionCall() {
            await categories.get(req, mockRes, mockNext);
        }

        it('should get all categories', async () => {
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(cats);
        });

        it('should check user permissions', async () => {
            req.user.isSuperAdmin = false;
            req.user.isAdmin = false;
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalledWith({ clientViewItems: true });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(cats);
        });

        it('should handle find error', async () => {
            // simulate find error
            err = new Error('Find error');
            mockCollection.find.mockImplementationOnce(() => { throw err });
            
            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle toArray error', async () => {
            // perform action to test
            err = new Error('array transformation of categories failed');
            mockCollection.toArray.mockRejectedValueOnce(err);
            
            await makeFunctionCall();

            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });
    
    describe('patch', () => {
        let params, body, req;
        beforeEach(async () => {
            params = {
                categoryId: ObjectId().toString(),
            }
            body = {
                name: 'Blazers',
                group: 'Formal',
                type: 'clothes',
                clientViewItems: false,
                clientAddItems: false,
                rmbgItems: false,
            };
            req = { params, body, locals };

            mockCollection.findOne.mockResolvedValue({
                name: 'T-Shirts',
                group: 'Formal',
                type: 'clothes',
                clientViewItems: true,
                clientAddItems: true,
                rmbgItems: true,
            });
            mockCollection.toArray.mockResolvedValue([]);
        });

        async function makeFunctionCall() {
            await categories.patch(req, mockRes, mockNext);
        }

        it('should update category', async () => {
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockCollection.find).toHaveBeenCalledWith({ name: body.name });
            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should update group only', async () => {
            mockCollection.findOne.mockResolvedValueOnce({
                name: 'Blazers',
                group: 'Casual',
            });
            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockCollection.find).not.toHaveBeenCalled();
            expect(mockCollection.toArray).not.toHaveBeenCalled();
            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
        });

        it('should handle findOne error', async () => {
            // simulate findOne error
            err = new Error('FindOne error');
            mockCollection.findOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle find error', async () => {
            // simulate find error
            err = new Error('Find error');
            mockCollection.find.mockImplementationOnce(() => { throw err });

            await makeFunctionCall();

            expect(mockCollection.find).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle toArray error', async () => {
            // simulate toArray error
            err = new Error('ToArray error');
            mockCollection.toArray.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.toArray).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle updateOne error', async () => {
            // simulate updateOne error
            err = new Error('UpdateOne error');
            mockCollection.updateOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.updateOne).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should fail if category not updated', async () => {
            // simulate no category updated
            mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });

            await makeFunctionCall();

            expect(mockCreateError).toHaveBeenCalledWith('update failed: category not found with given category id', 404);
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });

    describe('delete', () => {
        let params, req;
        beforeEach(async () => {
            params = {
                categoryId: ObjectId().toString(),
            };
            req = { params, locals };
        });

        async function makeFunctionCall() {
            await categories.delete(req, mockRes, mockNext);
        }

        it('should delete category', async () => {
            await makeFunctionCall();

            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!'});
        });

        it('should handle deleteOne error', async () => {
            // simulate error in deleteOne
            err = new Error('DeleteOne error');
            mockCollection.deleteOne.mockRejectedValueOnce(err);

            await makeFunctionCall();

            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockNext).toHaveBeenCalledWith(err);
        });

        it('should handle no deletion', async () => {
            // simulate no deletion
            mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 0 });

            await makeFunctionCall();

            expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: params.categoryId });
            expect(mockCreateError).toHaveBeenCalledWith('deletion failed: category not found with given category id', 404)
            expect(mockNext).toHaveBeenCalledWith(unitHelpers.err);
        });
    });
});