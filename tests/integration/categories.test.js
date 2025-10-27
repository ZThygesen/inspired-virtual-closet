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
        await collection.insertOne({ _id: 0, name: 'Other', items: [] });
    }

    describe('post', () => {
        let params, body;
        beforeEach(() => {
            params = [];
            body = {
                name: 'Blazers',
                group: 'Formal',
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
                items: [],
            });
        });

        it('should fail if category name already exists', async () => {
            await collection.insertOne({ name: body.name });
            const response = await request(params, body);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a category with the name "${body.name}" already exists`);
        });

        integrationHelpers.testBody(schema.post.body.fields, request, () => params);
    });
    
    describe('get', () => {
        let category;
        let params, body;
        beforeEach(async () => {
            category = {
                _id: ObjectId(),
                name: 'Blazers',
                group: 'Formal',
                items: [],
            };
            await collection.insertOne(category);

            params = [];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('get', '/categories', params, body);

        it('should get categories', async () => {
            const response = await request(params, body);
            
            expect(response.status).toBe(200);

            const categories = response.body;
            expect(categories).toHaveLength(2);
            
            const category = categories[0];
            expect(category).not.toHaveProperty('items');
        });

        it('handle no categories', async () => {
            await integrationHelpers.clearCollection();
            const response = await request(params, body);
            
            expect(response.status).toBe(200);
            const categories = response.body;
            expect(categories).toHaveLength(0);
        });
    });
    
    describe('patch', () => {
        let data, params, body;
        beforeEach(async () => {
            data = {
                _id: ObjectId(),
                name: 'Blazers',
                group: 'Formal',
                items: [],
            };
            await collection.insertOne(data);

            params = [data._id.toString()];
            body = {
                name: 'T-Shirts',
                group: 'Casual',
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
                items: data.items,
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
                items: data.items,
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
    });

    describe('delete', () => {
        let params, body;
        let data;
        beforeEach(async () => {
            data = {
                _id: ObjectId(),
                name: 'Blazers',
                group: 'Formal',
                items: [{ item: 1 }, { item: 2 }, { item: 3 }],
            };
            await collection.insertOne(data);

            params = [data._id.toString()];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('delete', '/categories', params, body);

        it('should delete category', async () => {
            let otherCategory = await collection.findOne({ _id: 0, name: 'Other' });
            expect(otherCategory.items).toHaveLength(0);

            let category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(3);
            expect(category.items).toEqual(data.items);

            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            category = await collection.findOne({ _id: data._id });
            expect(category).toBeFalsy();

            otherCategory = await collection.findOne({ _id: 0, name: 'Other' });
            expect(otherCategory.items).toHaveLength(3);
            expect(otherCategory.items).toEqual(data.items);
        });

        it('should delete category with no files to move', async () => {
            await integrationHelpers.clearCollection();
            await insertOther();
            await collection.insertOne({ _id: data._id, name: data.name, items: [] });

            let otherCategory = await collection.findOne({ _id: 0, name: 'Other' });
            expect(otherCategory.items).toHaveLength(0);

            let category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(0);

            const response = await request(params, body);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            category = await collection.findOne({ _id: data._id });
            expect(category).toBeFalsy();

            otherCategory = await collection.findOne({ _id: 0, name: 'Other' });
            expect(otherCategory.items).toHaveLength(0);
        });

        it('should fail given category that does not exist', async () => {
            params = [ObjectId().toString()];
            const response = await request(params, body);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('category does not exist');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
        });

        integrationHelpers.testParams(schema.delete.params.fields, request, () => body, ['categoryId']);
    });
});