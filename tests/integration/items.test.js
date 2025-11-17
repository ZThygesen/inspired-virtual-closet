import { jest } from '@jest/globals';
import { bucket } from '../../server';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers';
import cuid2 from '@paralleldrive/cuid2';
import { integrationHelpers } from './helpers';
import { schema } from '../../schema/items.schema';

describe('items', () => {
    let user, client, db, collection, clientCollection, categoryCollection;
    beforeAll(async () => {
        await integrationHelpers.beforeAll('items');

        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
        const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        expect(files).toHaveLength(0);
    });
    afterAll(async () => { 
        await integrationHelpers.afterAll();
        await clearBucket();
    });
    beforeEach(async () => {
        await integrationHelpers.beforeEach();
        ({
            user,
            client,
            db,
            collection,
            clientCollection,
            categoryCollection,
        } = integrationHelpers);
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
    });
    afterEach(async () => {
        await integrationHelpers.afterEach();
    });

    async function clearBucket() {
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
        await bucket.deleteFiles({ prefix: 'test/items/'});

        const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        expect(files).toHaveLength(0);
    }

    describe('post', () => {
        let category;
        let params, body;
        let mockRemoveBackground;
        beforeEach(async () => {
            await clearBucket();
            category = {
                _id: ObjectId(),
                name: 'Blazers',
                group: 'Formal',
            };
            await categoryCollection.insertOne(category);

            params = [client._id.toString()];
            body = {
                categoryId: category._id.toString(),
                fileSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==',
                fullFileName: 'Blazin Blazer.png',
                tags: JSON.stringify([ObjectId().toString(), ObjectId().toString()]),
                rmbg: false, // keep false by default to keep 429s from happening with Photoroom
                crop: true,
            };

            mockRemoveBackground = jest.spyOn(helpers, 'removeBackground');
        });

        const request = (params, body) => integrationHelpers.executeRequest('post', '/items', params, body, {
            isFormData: true,
        });

        it('should add new item', async () => {
            body.rmbg = true;
            const response = await request(params, body);
            
            expect(response.body.message).toBe('Success!');
            expect(response.status).toBe(201);
            expect(mockRemoveBackground).toHaveBeenCalledWith(body.fileSrc, body.crop);
            
            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(1);
            const item = items[0];
            expect(item).toBeTruthy();
            expect(item).toHaveProperty('_id');
            expect(item).toHaveProperty('gcsId');
            const gcsId = item.gcsId;
            expect(item).toMatchObject({
                clientId: client._id.toString(),
                categoryId: category._id.toString(),
                fileName: body.fullFileName.split('.')[0],
                fullFileUrl: `https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Ffull.png`,
                smallFileUrl: `https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Fsmall.png`,
                fullGcsDest: `test/items/${gcsId}/full.png`,
                smallGcsDest: `test/items/${gcsId}/small.png`,
                tags: JSON.parse(body.tags),
                gcsId: gcsId,
            });

            const clientData = await clientCollection.findOne({ _id: client._id });
            expect(clientData.credits).toBe(client.credits - 1);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should add new item to Other category', async () => {
            await categoryCollection.insertOne({ _id: 0, name: 'Other' });
            body.categoryId = 0;
            const response = await request(params, body);
            
            expect(response.body.message).toBe('Success!');
            expect(response.status).toBe(201);
            
            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(1);
            const item = items[0];
            expect(item.categoryId).toBe(0);

            const clientData = await clientCollection.findOne({ _id: client._id });
            expect(clientData.credits).toBe(client.credits - 1);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should add new item with no tags', async () => {
            body.tags = JSON.stringify([]);
            const response = await request(params, body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should not deduct credits for super admin client', async () => {
            await clientCollection.updateOne({ _id: client._id }, { $set: { isSuperAdmin: true } });
            const response = await request(params, body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            const clientData = await clientCollection.findOne({ _id: client._id });
            expect(clientData.credits).toBe(client.credits);

            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(1);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should allow super admin user to not rmbg', async () => {
            body.rmbg = false;
            const response = await request(params, body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            expect(mockRemoveBackground).not.toHaveBeenCalled();

            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(1);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should allow super admin user to not crop', async () => {
            body.rmbg = true;
            body.crop = false;
            const response = await request(params, body);
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            expect(mockRemoveBackground).toHaveBeenCalledWith(body.fileSrc, false);

            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(1);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should allow super admin user to not rmbg and crop', async () => {
            body.rmbg = false
            body.crop = false;
            const response = await request(params, body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            expect(mockRemoveBackground).not.toHaveBeenCalled();

            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(1);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should allow admin user to not rmbg', async () => {
            await integrationHelpers.setUserAdmin();
            body.rmbg = false;
            const response = await request(params, body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            expect(mockRemoveBackground).not.toHaveBeenCalled();

            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(1);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should allow admin user to not crop', async () => {
            await integrationHelpers.setUserAdmin();
            body.rmbg = true;
            body.crop = false;
            const response = await request(params, body);
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            expect(mockRemoveBackground).toHaveBeenCalledWith(body.fileSrc, false);

            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(1);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should allow admin user to not rmbg and crop', async () => {
            await integrationHelpers.setUserAdmin();
            body.rmbg = false
            body.crop = false;
            const response = await request(params, body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            expect(mockRemoveBackground).not.toHaveBeenCalled();

            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(1);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail if non-admin user does not rmbg', async () => {
            await integrationHelpers.setUserNormal();
            params = [user._id.toString()];
            body.rmbg = false;
            const response = await request(params, body);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('non-admins must remove background and crop image on item upload');

            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(0);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(0);
        });

        it('should fail if non-admin user does not crop', async () => {
            await integrationHelpers.setUserNormal();
            params = [user._id.toString()];
            body.rmbg = true;
            body.crop = false;
            const response = await request(params, body);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('non-admins must remove background and crop image on item upload');

            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(0);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(0);
        });

        it('should fail if non-admin user does not rmbg and crop', async () => {
            await integrationHelpers.setUserNormal();
            params = [user._id.toString()];
            body.rmbg = false;
            body.crop = false;
            const response = await request(params, body);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('non-admins must remove background and crop image on item upload');

            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(0);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(0);
        });

        it('should fail if category does not exist', async () => {
            body.categoryId = ObjectId().toString();
            params = [client._id.toString()];
            const response = await request(params, body);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`cannot add item: no categories with the id "${body.categoryId}" exist`)
            
            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(0);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(0);
        });

        it('should fail if client does not exist', async () => {
            await integrationHelpers.removeClient();
            const response = await request(params, body);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found')
            
            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(0);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(0);
        });

        it('should fail if client has no credits', async () => {
            await clientCollection.updateOne({ _id: client._id }, { $set: { credits: 0 } });
            const response = await request(params, body);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('client does not have any credits')

            const items = await collection.find({ }).toArray();
            expect(items).toHaveLength(0);
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(0);
        });

        integrationHelpers.testParams(schema.post.params.fields, request, () => body, ['clientId'], {
            checkPermissions: true,
        });
        integrationHelpers.testBody(schema.post.body.fields, request, () => params, {
            isFormData: true,
        });
        integrationHelpers.testAuth({ checkPermissions: true }, request, () => params, () => body, 201);
    });
    
    describe('get', () => {
        let item1, item2, item3;
        let params, body;
        beforeEach(async () => {
            item1 = {
                _id: ObjectId(),
                clientId: client._id.toString(),
            };
            item2 = {
                _id: ObjectId(),
                clientId: client._id.toString(),
            };
            item3 = {
                _id: ObjectId(),
                clientId: ObjectId().toString(),
            };
            await collection.insertOne(item1);

            params = [client._id.toString()];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('get', '/items', params, body);

        it('should get items for client', async () => {
            const response = await request(params, body);
            
            expect(response.status).toBe(200);

            const items = response.body;
            expect(items).toHaveLength(1);

            const item = items[0];
            expect(item._id).toBe(item1._id.toString());
        });

        it('should handle no items for client', async () => {
            const otherClientId = ObjectId();
            await clientCollection.insertOne({ _id: otherClientId });
            params = [otherClientId.toString()];

            const response = await request(params, body);
            expect(response.status).toBe(200);

            const items = response.body;
            expect(items).toHaveLength(0);
        });

        it('should handle multiple items for client', async () => {
            await collection.insertOne(item2);

            const response = await request(params, body);
            
            expect(response.status).toBe(200);

            const items = response.body;
            expect(items).toHaveLength(2);
            expect(items[0]._id).toBe(item1._id.toString());
            expect(items[1]._id).toBe(item2._id.toString());
        });

        it('should only return items for client', async () => {
            await collection.insertOne(item3);

            const response = await request(params, body);
            
            expect(response.status).toBe(200);

            const items = response.body;
            expect(items).toHaveLength(1);
            expect(items[0]._id).toBe(item1._id.toString());
        });

        it('should fail if client does not exist', async () => {
            await integrationHelpers.removeClient();
            const response = await request(params, body);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');
        });

        integrationHelpers.testParams(schema.get.params.fields, request, () => body, ['clientId'], {
            checkPermissions: true,
        });
        integrationHelpers.testAuth({ checkPermissions: true }, request, () => params, () => body);
    });

    describe('patchName', () => {
        let item;
        let params, body;
        beforeEach(async () => {
            item = {
                _id: ObjectId(),
                clientId: client._id.toString(),
                categoryId: ObjectId().toString(),
                fileName: 'Blazin Blazer',
                tags: [ObjectId().toString()],
                gcsId: cuid2.createId(),
            };
            await collection.insertOne(item);

            params = [client._id.toString(), item._id.toString()];
            body = {
                name: 'Fantastic Fedora',
                tags: [item.tags[0], ObjectId().toString()],
            };
        });

        const request = (params, body) => integrationHelpers.executeRequest('patch', '/items', params, body);

        it('should update item', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedItem = await collection.findOne({ _id: item._id });
            expect(updatedItem).toMatchObject({
                _id: item._id,
                clientId: item.clientId,
                categoryId: item.categoryId,
                fileName: body.name,
                tags: body.tags,
                gcsId: item.gcsId,
            });
            expect(updatedItem.tags).toHaveLength(2);
        });

        it('should remove all tags', async () => {
            body.tags = [];
            const response = await request(params, body);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedItem = await collection.findOne({ _id: item._id });
            expect(updatedItem.tags).toHaveLength(0);
        });

        it('should only update name', async () => {
            body.tags = item.tags;
            const response = await request(params, body);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedItem = await collection.findOne({ _id: item._id });
            expect(updatedItem).toMatchObject({
                fileName: body.name,
                tags: item.tags,
            });
        });

        it('should only update tags', async () => {
            body.name = item.fileName;
            const response = await request(params, body);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedItem = await collection.findOne({ _id: item._id });
            expect(updatedItem).toMatchObject({
                fileName: item.fileName,
                tags: body.tags,
            });
        });

        it('should fail if item does not exist', async () => {
            params = [client._id.toString(), ObjectId().toString()];
            const response = await request(params, body);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('update of item failed: item not found with given item id');

            const updatedItem = await collection.findOne({ _id: item._id });
            expect(updatedItem).toStrictEqual(item);
        });

        it('should fail if client does not exist', async () => {
            await integrationHelpers.removeClient();
            const response = await request(params, body);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');

            const updatedItem = await collection.findOne({ _id: item._id });
            expect(updatedItem).toStrictEqual(item);
        });
        
        integrationHelpers.testParams(schema.patchName.params.fields, request, () => body, ['clientId', 'itemId'], {
            checkPermissions: true,
        });
        integrationHelpers.testBody(schema.patchName.body.fields, request, () => params);
        integrationHelpers.testAuth({ checkPermissions: true }, request, () => params, () => body);
    });

    describe('patchCategory', () => {
        let category1, category2, item;
        let params, body;
        beforeEach(async () => {
            category1 = {
                _id: ObjectId(),
                name: 'Blazers',
            };
            category2 = {
                _id: ObjectId(),
                name: 'Suits',
            };
            item = {
                _id: ObjectId(),
                clientId: client._id.toString(),
                categoryId: category1._id.toString(),
            };
            await categoryCollection.insertMany([category1, category2]);
            await collection.insertOne(item);

            params = [client._id.toString(), item._id.toString()];
            body = {
                newCategoryId: category2._id.toString(),
            };
        });

        const request = (params, body) => integrationHelpers.executeRequest('patch', '/items/category', params, body);

        it('should update item category', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedItem = await collection.findOne({ _id: item._id });
            expect(updatedItem.categoryId).toBe(body.newCategoryId);
        });

        it('should update item category to Other', async () => {
            body.newCategoryId = 0;
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedItem = await collection.findOne({ _id: item._id });
            expect(updatedItem.categoryId).toBe(0);
        });

        it('should fail with item that does not exist', async () => {
            params = [client._id.toString(), ObjectId().toString()];
            const response = await request(params, body);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('item category not updated');

            const updatedItem = await collection.findOne({ _id: item._id });
            expect(updatedItem).toStrictEqual(item);
        });

        it('should fail with new category that does not exist', async () => {
            body.newCategoryId = ObjectId().toString();
            const response = await request(params, body);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`cannot change item category: no categories with the id "${body.newCategoryId}" exist`);
            
            const updatedItem = await collection.findOne({ _id: item._id });
            expect(updatedItem).toStrictEqual(item);
        });

        it('should fail with client that does not exist', async () => {
            await integrationHelpers.removeClient();
            const response = await request(params, body);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');
        });

        integrationHelpers.testParams(schema.patchCategory.params.fields, request, () => body, ['clientId', 'itemId'], {
            checkPermissions: true,
        });
        integrationHelpers.testBody(schema.patchCategory.body.fields, request, () => params);
        integrationHelpers.testAuth({ checkPermissions: true }, request, () => params, () => body);
    });

    describe('delete', () => {
        let item;
        let params, body;
        beforeEach(async () => {
            await clearBucket();

            const gcsId = cuid2.createId();
            const fullGcsDest = `test/items/${gcsId}/full.png`;
            const smallGcsDest = `test/items/${gcsId}/small.png`;
            const fileBuffer = await helpers.b64ToBuffer('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==');
            const fullFileUrl = await helpers.uploadToGCS(bucket, fullGcsDest, fileBuffer);
            const smallFileUrl = await helpers.uploadToGCS(bucket, smallGcsDest, fileBuffer);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);

            item = {
                clientId: client._id.toString(),
                categoryId: ObjectId().toString(),
                fileName: 'Blazin Blazer',
                fullFileUrl: fullFileUrl,
                smallFileUrl: smallFileUrl,
                fullGcsDest: fullGcsDest,
                smallGcsDest: smallGcsDest,
                gcsId: gcsId,
            };
            await collection.insertOne(item);

            params = [client._id.toString(), item._id.toString()];
            body = {};
        });

        afterAll(async () => {
            await clearBucket();
        });

        const request = (params, body) => integrationHelpers.executeRequest('delete', '/items', params, body);

        it('should delete item', async () => {
            const response = await request(params, body);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const deletedItem = await collection.findOne({ _id: item._id });
            expect(deletedItem).toBeFalsy();

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(0);
        });

        it('should fail with item that does not exist', async () => {
            params = [client._id.toString(), ObjectId().toString()];
            const response = await request(params, body);
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to retrieve item from database');
            
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail with client that does not exist', async () => {
            await integrationHelpers.removeClient();
            const response = await request(params, body);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');
            
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail if item does not have fullGcsDest', async () => {
            await integrationHelpers.clearCollection();
            delete item.fullGcsDest;
            await collection.insertOne(item);

            const response = await request(params, body);
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('item does not have both a full and small gcs path');
            
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail if file does not have smallGcsDest', async () => {
            await integrationHelpers.clearCollection();
            delete item.smallGcsDest;
            await collection.insertOne(item);

            const response = await request(params, body);
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('item does not have both a full and small gcs path');
            
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail if item does not have both fullGcsDest and smallGcsDest', async () => {
            await integrationHelpers.clearCollection();
            delete item.fullGcsDest;
            delete item.smallGcsDest;
            await collection.insertOne(item);

            const response = await request(params, body);
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('item does not have both a full and small gcs path');
            
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail with invalid fullGcsDest', async () => {
            await integrationHelpers.clearCollection();
            item.fullGcsDest = 'invalid';
            await collection.insertOne(item);

            const response = await request(params, body);
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('No such object: edie-styles-virtual-closet-test/invalid');
            
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail with invalid smallGcsDest', async () => {
            await integrationHelpers.clearCollection();
            item.smallGcsDest = 'invalid';
            await collection.insertOne(item);

            const response = await request(params, body);
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('No such object: edie-styles-virtual-closet-test/invalid');
            
            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(1);
        });

        integrationHelpers.testParams(schema.delete.params.fields, request, () => body, ['clientId', 'itemId'], {
            checkPermissions: true,
        });
        integrationHelpers.testAuth({ checkPermissions: true }, request, () => params, () => body);
    });
});