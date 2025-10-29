import { jest } from '@jest/globals';
import { bucket } from '../../server';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers';
import cuid2 from '@paralleldrive/cuid2';
import { integrationHelpers } from './helpers';
import { schema } from '../../schema/files.schema';

describe('files', () => {
    let user, client, db, collection, clientCollection;
    beforeAll(async () => { 
        await integrationHelpers.beforeAll('categories');

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
        } = integrationHelpers);
        await insertOther();
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
    });
    afterEach(async () => {
        await integrationHelpers.afterEach();
    });

    async function insertOther() {
        await collection.insertOne({ _id: 0, name: 'Other', items: [] });
    }

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
                items: [],
            };
            await collection.insertOne(category);

            params = [client._id.toString(), category._id.toString()];
            body = {
                fileSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==',
                fullFileName: 'Blazin Blazer.png',
                tags: [ObjectId().toString(), ObjectId().toString()],
                rmbg: false, // keep false by default to keep 429s from happening with Photoroom
                crop: true,
            };

            mockRemoveBackground = jest.spyOn(helpers, 'removeBackground');
        });

        const request = (params, body) => integrationHelpers.executeRequest('post', '/files', params, body);

        // it('should add new file', async () => {
        //     body.rmbg = true;
        //     const response = await request(params, body);

        //     expect(response.status).toBe(201);
        //     expect(response.body.message).toBe('Success!');
        //     expect(mockRemoveBackground).toHaveBeenCalledWith(body.fileSrc, body.crop);
    
        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(1);

        //     const file = cat.items[0];
        //     expect(file).toBeTruthy();
        //     expect(file).toHaveProperty('gcsId');
        //     const gcsId = file.gcsId;
        //     expect(file).toMatchObject({
        //         clientId: client._id,
        //         fileName: body.fullFileName.split('.')[0],
        //         fullFileUrl: `https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Ffull.png`,
        //         smallFileUrl: `https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Fsmall.png`,
        //         fullGcsDest: `test/items/${gcsId}/full.png`,
        //         smallGcsDest: `test/items/${gcsId}/small.png`,
        //         tags: body.tags,
        //         gcsId: gcsId,
        //     });

        //     const clientData = await clientCollection.findOne({ _id: client._id });
        //     expect(clientData.credits).toBe(client.credits - 1);

        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(2);
        // });

        // it('should add new file with no tags', async () => {
        //     body.tags = [];
        //     const response = await request(params, body);

        //     expect(response.status).toBe(201);
        //     expect(response.body.message).toBe('Success!');

        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(2);
        // });

        // it('should not deduct credits for super admin client', async () => {
        //     await clientCollection.updateOne({ _id: client._id }, { $set: { isSuperAdmin: true } });
        //     const response = await request(params, body);

        //     expect(response.status).toBe(201);
        //     expect(response.body.message).toBe('Success!');

        //     const clientData = await clientCollection.findOne({ _id: client._id });
        //     expect(clientData.credits).toBe(client.credits);

        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(1);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(2);
        // });

        // it('should allow super admin user to not rmbg', async () => {
        //     body.rmbg = false;
        //     const response = await request(params, body);

        //     expect(response.status).toBe(201);
        //     expect(response.body.message).toBe('Success!');

        //     expect(mockRemoveBackground).not.toHaveBeenCalled();

        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(1);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(2);
        // });

        // it('should allow super admin user to not crop', async () => {
        //     body.rmbg = true;
        //     body.crop = false;
        //     const response = await request(params, body);

        //     expect(response.status).toBe(201);
        //     expect(response.body.message).toBe('Success!');

        //     expect(mockRemoveBackground).toHaveBeenCalledWith(body.fileSrc, false);

        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(1);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(2);
        // });

        // it('should allow super admin user to not rmbg and crop', async () => {
        //     body.rmbg = false
        //     body.crop = false;
        //     const response = await request(params, body);

        //     expect(response.status).toBe(201);
        //     expect(response.body.message).toBe('Success!');

        //     expect(mockRemoveBackground).not.toHaveBeenCalled();

        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(1);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(2);
        // });

        // it('should allow admin user to not rmbg', async () => {
        //     await integrationHelpers.setUserAdmin();
        //     body.rmbg = false;
        //     const response = await request(params, body);

        //     expect(response.status).toBe(201);
        //     expect(response.body.message).toBe('Success!');

        //     expect(mockRemoveBackground).not.toHaveBeenCalled();

        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(1);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(2);
        // });

        // it('should allow admin user to not crop', async () => {
        //     await integrationHelpers.setUserAdmin();
        //     body.rmbg = true;
        //     body.crop = false;
        //     const response = await request(params, body);

        //     expect(response.status).toBe(201);
        //     expect(response.body.message).toBe('Success!');

        //     expect(mockRemoveBackground).toHaveBeenCalledWith(body.fileSrc, false);

        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(1);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(2);
        // });

        // it('should allow admin user to not rmbg and crop', async () => {
        //     await integrationHelpers.setUserAdmin();
        //     body.rmbg = false
        //     body.crop = false;
        //     const response = await request(params, body);

        //     expect(response.status).toBe(201);
        //     expect(response.body.message).toBe('Success!');

        //     expect(mockRemoveBackground).not.toHaveBeenCalled();

        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(1);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(2);
        // });

        // it('should fail if non-admin user does not rmbg', async () => {
        //     await integrationHelpers.setUserNormal();
        //     params = [user._id.toString(), category._id.toString()];
        //     body.rmbg = false;
        //     const response = await request(params, body);

        //     expect(response.status).toBe(403);
        //     expect(response.body.message).toBe('non-admins must remove background and crop image on file upload');

        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(0);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(0);
        // });

        // it('should fail if non-admin user does not crop', async () => {
        //     await integrationHelpers.setUserNormal();
        //     params = [user._id.toString(), category._id.toString()];
        //     body.rmbg = true;
        //     body.crop = false;
        //     const response = await request(params, body);

        //     expect(response.status).toBe(403);
        //     expect(response.body.message).toBe('non-admins must remove background and crop image on file upload');

        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(0);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(0);
        // });

        // it('should fail if non-admin user does not rmbg and crop', async () => {
        //     await integrationHelpers.setUserNormal();
        //     params = [user._id.toString(), category._id.toString()];
        //     body.rmbg = false;
        //     body.crop = false;
        //     const response = await request(params, body);

        //     expect(response.status).toBe(403);
        //     expect(response.body.message).toBe('non-admins must remove background and crop image on file upload');

        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(0);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(0);
        // });

        // it('should fail if category does not exist', async () => {
        //     const otherId = ObjectId().toString();
        //     params = [client._id.toString(), otherId];
        //     const response = await request(params, body);

        //     expect(response.status).toBe(404);
        //     expect(response.body.message).toBe(`cannot add file: no category or multiple categories with the id "${otherId}" exist`)
            
        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(0);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(0);
        // });

        // it('should fail if client does not exist', async () => {
        //     await integrationHelpers.removeClient();
        //     const response = await request(params, body);

        //     expect(response.status).toBe(404);
        //     expect(response.body.message).toBe('client not found')
            
        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(0);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(0);
        // });

        // it('should fail if client has no credits', async () => {
        //     await clientCollection.updateOne({ _id: client._id }, { $set: { credits: 0 } });
        //     const response = await request(params, body);

        //     expect(response.status).toBe(403);
        //     expect(response.body.message).toBe('client does not have any credits')

        //     const cat = await collection.findOne({ _id: category._id });
        //     expect(cat.items).toHaveLength(0);
        //     const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        //     expect(files).toHaveLength(0);
        // });

        // integrationHelpers.testParams(schema.post.params.fields, request, () => body, ['clientId', 'categoryId'], {
        //     checkPermissions: true,
        // });
        // integrationHelpers.testBody(schema.post.body.fields, request, () => params);
        integrationHelpers.testAuth({ checkPermissions: true }, request, () => params, () => body, 201);
    });
    
    // describe('get', () => {
    //     let category1, category2, category3;
    //     let params, body;
    //     beforeEach(async () => {
    //         category1 = {
    //             _id: ObjectId(),
    //             name: 'Blazers',
    //             items: [
    //                 { clientId: client._id.toString() },
    //                 { clientId: ObjectId().toString() },
    //                 { clientId: client._id.toString() },
    //             ],
    //         };
    //         category2 = {
    //             _id: ObjectId(),
    //             name: 'Suits',
    //             items: [
    //                 { clientId: client._id.toString() },
    //                 { clientId: ObjectId().toString() },
    //                 { clientId: ObjectId().toString() },
    //             ],
    //         };
    //         category3 = {
    //             _id: ObjectId(),
    //             name: 'Slacks',
    //             items: [
    //                 { clientId: ObjectId().toString() },
    //                 { clientId: ObjectId().toString() },
    //                 { clientId: ObjectId().toString() },
    //             ],
    //         };
    //         await collection.insertOne(category1);

    //         params = [client._id.toString()];
    //         body = {};
    //     });

    //     const request = (params, body) => integrationHelpers.executeRequest('get', '/files', params, body);

    //     it('should get files for client', async () => {
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(200);

    //         const categories = response.body;
    //         expect(categories).toHaveLength(2);

    //         const cat1 = categories.filter(category => category._id === category1._id.toString())[0];
    //         expect(cat1.items).toHaveLength(2);
    //         cat1.items.forEach(item => {
    //             expect(item.clientId).toBe(client._id.toString());
    //         });
    //     });

    //     it('should handle no files for client', async () => {
    //         const otherClientId = ObjectId();
    //         await clientCollection.insertOne({ _id: otherClientId });
    //         params = [otherClientId.toString()];

    //         const response = await request(params, body);
    //         const categories = response.body;
    //         expect(categories).toHaveLength(2);

    //         const cat1 = categories.filter(category => category._id === category1._id.toString())[0];
    //         expect(cat1.items).toHaveLength(0);
    //     });

    //     it('should work across multiple categories', async () => {
    //         await collection.insertMany([category2, category3]);
    //         const response = await request(params, body);

    //         expect(response.status).toBe(200);

    //         const categories = response.body;
    //         expect(categories).toHaveLength(4);

    //         const cat1 = categories.filter(category => category._id === category1._id.toString())[0];
    //         const cat2 = categories.filter(category => category._id === category2._id.toString())[0];
    //         const cat3 = categories.filter(category => category._id === category3._id.toString())[0];
    //         expect(cat1.items).toHaveLength(2);
    //         expect(cat2.items).toHaveLength(1);
    //         expect(cat3.items).toHaveLength(0);

    //         [cat1, cat2, cat3].forEach(cat => {
    //             cat.items.forEach(item => {
    //                 expect(item.clientId).toBe(client._id.toString());
    //             });
    //         });
    //     });

    //     it('should fail if client does not exist', async () => {
    //         await integrationHelpers.removeClient();
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(404);
    //         expect(response.body.message).toBe('client not found');
    //     });

    //     integrationHelpers.testParams(schema.get.params.fields, request, () => body, ['clientId'], {
    //         checkPermissions: true,
    //     });
    //     integrationHelpers.testAuth({ checkPermissions: true }, request, () => params, () => body);
    // });

    // describe('patchName', () => {
    //     let file, category;
    //     let params, body;
    //     beforeEach(async () => {
    //         file = {
    //             clientId: client._id.toString(),
    //             fileName: 'Blazin Blazer',
    //             tags: [ObjectId().toString()],
    //             gcsId: cuid2.createId(),
    //         };
    //         category = {
    //             _id: ObjectId(),
    //             name: 'Blazers',
    //             items: [
    //                 file,
    //                 { gcsId: cuid2.createId() },
    //                 { gcsId: cuid2.createId() },
    //             ],
    //         }
    //         await collection.insertOne(category);

    //         params = [client._id.toString(), category._id.toString(), file.gcsId];
    //         body = {
    //             name: 'Fantastic Fedora',
    //             tags: [file.tags[0], ObjectId().toString()],
    //         };
    //     });

    //     const request = (params, body) => integrationHelpers.executeRequest('patch', '/files', params, body);

    //     it('should update file', async () => {
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');
    
    //         const cat = await collection.findOne({ _id: category._id });
    //         expect(cat.items).toHaveLength(3);

    //         const updatedFile = cat.items.find(item => item.gcsId === file.gcsId);
    //         expect(updatedFile).toMatchObject({
    //             clientId: file.clientId,
    //             fileName: body.name,
    //             tags: body.tags,
    //             gcsId: file.gcsId,
    //         });
    //         expect(updatedFile.tags).toHaveLength(2);
    //     });

    //     it('should update file in other category', async () => {
    //         await integrationHelpers.clearCollection();
    //         await collection.insertOne({ _id: 0, name: 'Other', items: category.items });
    //         params = [client._id.toString(), 0, file.gcsId];
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');
    
    //         const cat = await collection.findOne({ _id: 0 });
    //         expect(cat.items).toHaveLength(3);

    //         const updatedFile = cat.items.find(item => item.gcsId === file.gcsId);
    //         expect(updatedFile).toMatchObject({
    //             clientId: file.clientId,
    //             fileName: body.name,
    //             tags: body.tags,
    //             gcsId: file.gcsId,
    //         });
    //         expect(updatedFile.tags).toHaveLength(2);
    //     });

    //     it('should remove all tags', async () => {
    //         body.tags = [];
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         const cat = await collection.findOne({ _id: category._id });
    //         const updatedFile = cat.items.find(item => item.gcsId === file.gcsId);
    //         expect(updatedFile.tags).toHaveLength(0);
    //     });

    //     it('should only update name', async () => {
    //         body.tags = file.tags;
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         const cat = await collection.findOne({ _id: category._id });
    //         const updatedFile = cat.items.find(item => item.gcsId === file.gcsId);
    //         expect(updatedFile).toMatchObject({
    //             fileName: body.name,
    //             tags: file.tags,
    //         });
    //     });

    //     it('should only update tags', async () => {
    //         body.name = file.fileName;
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         const cat = await collection.findOne({ _id: category._id });
    //         const updatedFile = cat.items.find(item => item.gcsId === file.gcsId);
    //         expect(updatedFile).toMatchObject({
    //             fileName: file.fileName,
    //             tags: body.tags,
    //         });
    //     });

    //     it('should fail if category does not exist', async () => {
    //         params = [client._id.toString(), ObjectId().toString(), file.gcsId];
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(404);
    //         expect(response.body.message).toBe('update of file name failed: category or file not found with given category or gcs id');

    //         const cat = await collection.findOne({ _id: category._id });
    //         expect(cat).toStrictEqual(category);
    //     });

    //     it('should fail if file does not exist', async () => {
    //         params = [client._id.toString(), category._id.toString(), 'invalid-gcs-id'];
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(404);
    //         expect(response.body.message).toBe('update of file name failed: category or file not found with given category or gcs id');

    //         const cat = await collection.findOne({ _id: category._id });
    //         expect(cat).toStrictEqual(category);
    //     });

    //     it('should fail if client does not exist', async () => {
    //         await integrationHelpers.removeClient();
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(404);
    //         expect(response.body.message).toBe('client not found');

    //         const cat = await collection.findOne({ _id: category._id });
    //         expect(cat).toStrictEqual(category);
    //     });
        
    //     integrationHelpers.testParams(schema.patchName.params.fields, request, () => body, ['clientId', 'categoryId', 'gcsId'], {
    //         checkPermissions: true,
    //     });
    //     integrationHelpers.testBody(schema.patchName.body.fields, request, () => params);
    //     integrationHelpers.testAuth({ checkPermissions: true }, request, () => params, () => body);
    // });

    // describe('patchCategory', () => {
    //     let file, category1, category2;
    //     let params, body;
    //     beforeEach(async () => {
    //         file = {
    //             clientId: client._id.toString(),
    //             fileName: 'Blazin Blazer',
    //             gcsId: cuid2.createId(),
    //         };
    //         category1 = {
    //             _id: ObjectId(),
    //             name: 'Blazers',
    //             items: [file],
    //         };
    //         category2 = {
    //             _id: ObjectId(),
    //             name: 'Suits',
    //             items: [],
    //         };
    //         await collection.insertMany([category1, category2]);

    //         params = [client._id.toString(), category1._id.toString(), file.gcsId];
    //         body = {
    //             newCategoryId: category2._id.toString(),
    //         };
    //     });

    //     const request = (params, body) => integrationHelpers.executeRequest('patch', '/files/category', params, body);

    //     it('should update file category', async () => {
    //         let oldCategory = await collection.findOne({ _id: category1._id });
    //         let newCategory = await collection.findOne({ _id: category2._id });
    //         expect(oldCategory.items).toHaveLength(1);
    //         expect(newCategory.items).toHaveLength(0);

    //         const response = await request(params, body);

    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         oldCategory = await collection.findOne({ _id: category1._id });
    //         newCategory = await collection.findOne({ _id: category2._id });
    //         expect(oldCategory.items).toHaveLength(0);
    //         expect(newCategory.items).toHaveLength(1);
    //         expect(newCategory.items[0]).toStrictEqual(file);
    //     });

    //     it('should not affect other files', async () => {
    //         await integrationHelpers.clearCollection();
    //         category1.items = [file, { file: 1 }, { file: 2 }];
    //         category2.items = [{ tag: 1 }, { tag: 2 }];
    //         await collection.insertMany([category1, category2]);

    //         let oldCategory = await collection.findOne({ _id: category1._id });
    //         let newCategory = await collection.findOne({ _id: category2._id });
    //         expect(oldCategory.items).toHaveLength(3);
    //         expect(newCategory.items).toHaveLength(2);

    //         const response = await request(params, body);

    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         oldCategory = await collection.findOne({ _id: category1._id });
    //         newCategory = await collection.findOne({ _id: category2._id });
    //         expect(oldCategory.items).toHaveLength(2);
    //         expect(newCategory.items).toHaveLength(3);

    //         const movedFile = newCategory.items.filter(movedFile => movedFile.gcsId === file.gcsId)[0];
    //         expect(movedFile).toStrictEqual(file);
    //     });

    //     it('should move file to other', async () => {
    //         let oldCategory = await collection.findOne({ _id: category1._id });
    //         let newCategory = await collection.findOne({ _id: 0 });
    //         expect(oldCategory.items).toHaveLength(1);
    //         expect(newCategory.items).toHaveLength(0);

    //         body.newCategoryId = 0;
    //         const response = await request(params, body);
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         oldCategory = await collection.findOne({ _id: category1._id });
    //         newCategory = await collection.findOne({ _id: 0 });
    //         expect(oldCategory.items).toHaveLength(0);
    //         expect(newCategory.items).toHaveLength(1);
    //         expect(newCategory.items[0]).toStrictEqual(file);
    //     });

    //     it('should move file from other', async () => {
    //         await integrationHelpers.clearCollection();
    //         category1.items = [];
    //         await collection.insertMany([category1, {
    //             _id: 0,
    //             name: 'Other',
    //             items: [file],
    //         }]);

    //         let oldCategory = await collection.findOne({ _id: 0 });
    //         let newCategory = await collection.findOne({ _id: category1._id });
    //         expect(oldCategory.items).toHaveLength(1);
    //         expect(newCategory.items).toHaveLength(0);

    //         params = [client._id.toString(), 0, file.gcsId];
    //         body.newCategoryId = category1._id.toString();
    //         const response = await request(params, body);

    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         oldCategory = await collection.findOne({ _id: 0 });
    //         newCategory = await collection.findOne({ _id: category1._id });
    //         expect(oldCategory.items).toHaveLength(0);
    //         expect(newCategory.items).toHaveLength(1);
    //         expect(newCategory.items[0]).toStrictEqual(file);
    //     });

    //     it('should fail with category that does not exist', async () => {
    //         params = [client._id.toString(), ObjectId().toString(), file.gcsId];
    //         const response = await request(params, body);

    //         expect(response.status).toBe(500);
    //         expect(response.body.message).toBe('failed to retrieve file from database');
    //     });

    //     it('should fail with new category that does not exist', async () => {
    //         body.newCategoryId = ObjectId().toString();
    //         const response = await request(params, body);

    //         expect(response.status).toBe(404);
    //         expect(response.body.message).toBe('update of file category failed: file not added to new category');
    //     });

    //     it('should fail with file that does not exist', async () => {
    //         params = [client._id.toString(), category1._id.toString(), cuid2.createId()];
    //         const response = await request(params, body);

    //         expect(response.status).toBe(500);
    //         expect(response.body.message).toBe('failed to retrieve file from database');
    //     });

    //     it('should fail with client that does not exist', async () => {
    //         await integrationHelpers.removeClient();
    //         const response = await request(params, body);

    //         expect(response.status).toBe(404);
    //         expect(response.body.message).toBe('client not found');
    //     });

    //     integrationHelpers.testParams(schema.patchCategory.params.fields, request, () => body, ['clientId', 'categoryId', 'gcsId'], {
    //         checkPermissions: true,
    //     });
    //     integrationHelpers.testBody(schema.patchCategory.body.fields, request, () => params);
    //     integrationHelpers.testAuth({ checkPermissions: true }, request, () => params, () => body);
    // });

    // describe('delete', () => {
    //     let category, file;
    //     let params, body;
    //     beforeEach(async () => {
    //         await clearBucket();

    //         const gcsId = cuid2.createId();
    //         const fullGcsDest = `test/items/${gcsId}/full.png`;
    //         const smallGcsDest = `test/items/${gcsId}/small.png`;
    //         const fileBuffer = await helpers.b64ToBuffer('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==');
    //         const fullFileUrl = await helpers.uploadToGCS(bucket, fullGcsDest, fileBuffer);
    //         const smallFileUrl = await helpers.uploadToGCS(bucket, smallGcsDest, fileBuffer);

    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(2);

    //         file = {
    //             clientId: client._id.toString(),
    //             fileName: 'Blazin Blazer',
    //             fullFileUrl: fullFileUrl,
    //             smallFileUrl: smallFileUrl,
    //             fullGcsDest: fullGcsDest,
    //             smallGcsDest: smallGcsDest,
    //             gcsId: gcsId,
    //         };
    //         category = {
    //             _id: ObjectId(),
    //             name: 'Blazers',
    //             items: [file],
    //         };
    //         await collection.insertOne(category);

    //         params = [client._id.toString(), category._id.toString(), file.gcsId];
    //         body = {};
    //     });

    //     afterAll(async () => {
    //         await clearBucket();
    //     });

    //     const request = (params, body) => integrationHelpers.executeRequest('delete', '/files', params, body);

    //     it('should delete file', async () => {
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         const cat = await collection.findOne({ _id: category._id });
    //         expect(cat.items).toHaveLength(0);

    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(0);
    //     });

    //     it('should delete file in other', async () => {
    //         await integrationHelpers.clearCollection();
    //         await collection.insertOne({
    //             _id: 0,
    //             name: 'Other',
    //             items: [file],
    //         });
    //         params = [client._id.toString(), 0, file.gcsId];
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         const cat = await collection.findOne({ _id: 0 });
    //         expect(cat.items).toHaveLength(0);

    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(0);
    //     });

    //     it('should delete file but not other files in category', async () => {
    //         await integrationHelpers.clearCollection();
    //         category.items = [file, { file: 1 }, { file: 2 }];
    //         await collection.insertOne(category);

    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         const cat = await collection.findOne({ _id: category._id });
    //         expect(cat.items).toHaveLength(2);

    //         const deletedFile = cat.items.filter(fileToCheck => fileToCheck.gcsId === file.gcsId)[0];
    //         expect(deletedFile).toBeFalsy();

    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(0);
    //     });

    //     it('should fail with category that does not exist', async () => {
    //         params = [client._id.toString(), ObjectId().toString(), file.gcsId];
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(500);
    //         expect(response.body.message).toBe('failed to retrieve file from database');
            
    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(2);
    //     });

    //     it('should fail with file that does not exist', async () => {
    //         params = [client._id.toString(), category._id.toString(), cuid2.createId()];
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(500);
    //         expect(response.body.message).toBe('failed to retrieve file from database');
            
    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(2);
    //     });

    //     it('should fail with client that does not exist', async () => {
    //         await integrationHelpers.removeClient();
    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(404);
    //         expect(response.body.message).toBe('client not found');
            
    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(2);
    //     });

    //     it('should fail file does not have fullGcsDest', async () => {
    //         await integrationHelpers.clearCollection();
    //         delete file.fullGcsDest;
    //         category.items = [file];
    //         await collection.insertOne(category);

    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(500);
    //         expect(response.body.message).toBe('file does not have both a full and small gcs path');
            
    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(2);
    //     });

    //     it('should fail file does not have smallGcsDest', async () => {
    //         await integrationHelpers.clearCollection();
    //         delete file.smallGcsDest;
    //         category.items = [file];
    //         await collection.insertOne(category);

    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(500);
    //         expect(response.body.message).toBe('file does not have both a full and small gcs path');
            
    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(2);
    //     });

    //     it('should fail file does not have both fullGcsDest and smallGcsDest', async () => {
    //         await integrationHelpers.clearCollection();
    //         delete file.fullGcsDest;
    //         delete file.smallGcsDest;
    //         category.items = [file];
    //         await collection.insertOne(category);

    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(500);
    //         expect(response.body.message).toBe('file does not have both a full and small gcs path');
            
    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(2);
    //     });

    //     it('should fail with invalid fullGcsDest', async () => {
    //         await integrationHelpers.clearCollection();
    //         file.fullGcsDest = 'invalid';
    //         category.items = [file];
    //         await collection.insertOne(category);

    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(500);
    //         expect(response.body.message).toBe('No such object: edie-styles-virtual-closet-test/invalid');
            
    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(2);
    //     });

    //     it('should fail with invalid smallGcsDest', async () => {
    //         await integrationHelpers.clearCollection();
    //         file.smallGcsDest = 'invalid';
    //         category.items = [file];
    //         await collection.insertOne(category);

    //         const response = await request(params, body);
            
    //         expect(response.status).toBe(500);
    //         expect(response.body.message).toBe('No such object: edie-styles-virtual-closet-test/invalid');
            
    //         const [files] = await bucket.getFiles({ prefix: 'test/items/' });
    //         expect(files).toHaveLength(1);
    //     });

    //     integrationHelpers.testParams(schema.delete.params.fields, request, () => body, ['clientId', 'categoryId', 'gcsId'], {
    //         checkPermissions: true,
    //     });
    //     integrationHelpers.testAuth({ checkPermissions: true }, request, () => params, () => body);
    // });
});