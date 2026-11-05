import { ObjectId } from 'mongodb';
import { integrationHelpers } from './helpers';
import { schema } from '../../schema/categories.schema';

describe('categories', () => {
    let user, client, db, collection, clientCollection;
    beforeAll(async () => { await integrationHelpers.beforeAll('categories'); });
    afterAll(async () => { await integrationHelpers.afterAll(); });
    beforeEach(async () => {
        await integrationHelpers.beforeEach();
        ({
            user,
            client,
            db,
            collection,
            clientCollection,
        } = integrationHelpers);
        await insertOther();
    })
    afterEach(async () => {
        await integrationHelpers.afterEach();
    });

    async function insertOther() {
        await collection.insertOne({ 
            _id: 0, 
            name: 'Other',
            type: 'clothes',
            clientViewItems: true,
            clientAddItems: true,
            rmbgItems: true,
        });
    }

    describe('post', () => {
        let params, body;
        beforeEach(() => {
            params = [];
            body = {
                name: 'Blazers',
                group: 'Formal',
                type: 'clothes',
                clientViewItems: true,
                clientAddItems: true,
                rmbgItems: true,
            };
        });

        const request = (params, body) => integrationHelpers.executeRequest('post', '/categories', params, body);

        it('should create new category', async () => {
            const response = await request(params, body);
            
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
            const category = await collection.findOne({ name: body.name });
            expect(ObjectId.isValid(category._id)).toBe(true);
            expect(category).toMatchObject({
                name: body.name,
                group: body.group,
                type: body.type,
                clientViewItems: body.clientViewItems,
                clientAddItems: body.clientAddItems,
                rmbgItems: body.rmbgItems,
            });
        });

        it('should not allow add if view is not allowed', async () => {
            body.clientViewItems = false;
            body.clientAddItems = true;
            const response = await request(params, body);
            
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
            const category = await collection.findOne({ name: body.name });
            expect(ObjectId.isValid(category._id)).toBe(true);
            expect(category).toMatchObject({
                name: body.name,
                group: body.group,
                type: body.type,
                clientViewItems: body.clientViewItems,
                clientAddItems: false,
                rmbgItems: body.rmbgItems,
            });
        });

        it('should fail if category name already exists', async () => {
            await collection.insertOne({ name: body.name });
            const response = await request(params, body);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a category with the name "${body.name}" already exists`);
        });

        integrationHelpers.testBody(schema.post.body.fields, request, () => params);
        integrationHelpers.testAuth({ superAdmin: true }, request, () => params, () => body, 201);
    });
    
    describe('get', () => {
        let category;
        let params, body;
        beforeEach(async () => {
            category = {
                _id: ObjectId(),
                name: 'Blazers',
                group: 'Formal',
                type: 'clothes',
                clientViewItems: true,
                clientAddItems: true,
                rmbgItems: true,
            };
            await collection.insertOne(category);

            params = [];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('get', '/categories', params, body);

        it('should get all categories', async () => {
            const response = await request(params, body);
            
            expect(response.status).toBe(200);

            const categories = response.body;
            expect(categories).toHaveLength(2);
            
            const category = categories[0];
            expect(category).not.toHaveProperty('items');
        });

        it('should handle no categories', async () => {
            await integrationHelpers.clearCollection();
            const response = await request(params, body);
            
            expect(response.status).toBe(200);
            const categories = response.body;
            expect(categories).toHaveLength(0);
        });

        it('should only get viewable categories for non-admin', async () => {
            await integrationHelpers.setUserNormal();
            await integrationHelpers.clearCollection();
            await insertOther();
            category.clientViewItems = false;
            category.clientAddItems = false;
            await collection.insertOne(category);

            const response = await request(params, body);
            const categories = response.body;
            expect(categories).toHaveLength(1);
            expect(categories[0]._id).toBe(0);
        });

        integrationHelpers.testAuth({ noRequirements: true }, request, () => params, () => body);
    });
    
    describe('patch', () => {
        let data, params, body;
        beforeEach(async () => {
            data = {
                _id: ObjectId(),
                name: 'Blazers',
                group: 'Formal',
                type: 'clothes',
                clientViewItems: true,
                clientAddItems: true,
                rmbgItems: true,
            };
            await collection.insertOne(data);

            params = [data._id.toString()];
            body = {
                name: 'T-Shirts',
                group: 'Casual',
                type: 'profile',
                clientViewItems: true,
                clientAddItems: false,
                rmbgItems: false,
            };
        });

        const request = (params, body) => integrationHelpers.executeRequest('patch', '/categories', params, body);

        it('should update category', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedCategory = await collection.findOne({ _id: data._id });
            expect(updatedCategory).toMatchObject({
                _id: data._id,
                name: body.name,
                group: body.group,
                type: body.type,
                clientViewItems: body.clientViewItems,
                clientAddItems: body.clientAddItems,
                rmbgItems: body.rmbgItems,
            });
        });

        it('should work if category name is not different', async () => {
            body.name = data.name;
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedCategory = await collection.findOne({ _id: data._id });
            expect(updatedCategory).toMatchObject({
                _id: data._id,
                name: body.name,
                group: body.group,
                type: body.type,
                clientViewItems: body.clientViewItems,
                clientAddItems: body.clientAddItems,
                rmbgItems: body.rmbgItems,
            });
        });

        it('should not allow add if view is not allowed', async () => {
            body.clientViewItems = false;
            body.clientAddItems = true;
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedCategory = await collection.findOne({ _id: data._id });
            expect(updatedCategory).toMatchObject({
                _id: data._id,
                name: body.name,
                group: body.group,
                type: body.type,
                clientViewItems: body.clientViewItems,
                clientAddItems: false,
                rmbgItems: body.rmbgItems,
            });
        });

        it('should fail if category name already exists', async () => {
            await collection.insertOne({ name: body.name });
            const response = await request(params, body);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a category with the name "${body.name}" already exists`);

            const category = await collection.findOne({ _id: data._id });
            expect(category).toStrictEqual(data);
        });

        it('should fail with non-existent category id', async () => {
            params = [ObjectId().toString()];
            const response = await request(params, body);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('update failed: category not found with given category id');

            const category = await collection.findOne({ _id: data._id });
            expect(category).toStrictEqual(data);
        });

        integrationHelpers.testParams(schema.patch.params.fields, request, () => body, ['categoryId']);
        integrationHelpers.testBody(schema.patch.body.fields, request, () => params);
        integrationHelpers.testAuth({ superAdmin: true }, request, () => params, () => body);
    });

    describe('delete', () => {
        let params, body;
        let data;
        beforeEach(async () => {
            data = {
                _id: ObjectId(),
                name: 'Blazers',
                group: 'Formal',
                type: 'clothes',
                clientViewItems: true,
                clientAddItems: true,
                rmbgItems: true,
            };
            await collection.insertOne(data);

            params = [data._id.toString()];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('delete', '/categories', params, body);

        it('should delete category', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const category = await collection.findOne({ _id: data._id });
            expect(category).toBeFalsy();

            const otherCategory = await collection.findOne({ _id: 0, name: 'Other' });
            expect(otherCategory).toBeTruthy();
        });

        it('should fail given category that does not exist', async () => {
            params = [ObjectId().toString()];
            const response = await request(params, body);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('deletion failed: category not found with given category id');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
        });

        integrationHelpers.testParams(schema.delete.params.fields, request, () => body, ['categoryId']);
        integrationHelpers.testAuth({ superAdmin: true }, request, () => params, () => body);
    });
});