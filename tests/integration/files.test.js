import { jest } from '@jest/globals';
import { app, bucket } from '../../server';
import { agent } from 'supertest';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers';
import cuid2 from '@paralleldrive/cuid2';

describe('files', () => {
    async function clearCollection(collection) {
        await collection.deleteMany({ });
    }

    async function insertOther(collection) {
        await collection.insertOne({ _id: 0, name: 'Other', items: [] });
    }

    async function clearBucket() {
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
        await bucket.deleteFiles({ prefix: 'test/items/'});

        const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        expect(files).toHaveLength(0);
    }

    let mongoClient;
    let db;
    let collection;

    beforeAll(async () => {
        mongoClient = new MongoClient(process.env.DB_URI);
        await mongoClient.connect();
        db = mongoClient.db(process.env.DB_NAME_TEST);
        collection = db.collection('categories');

        expect(bucket.id).toBe('edie-styles-virtual-closet-test');

        const [files] = await bucket.getFiles({ prefix: 'test/items/' });
        expect(files).toHaveLength(0);
    });

    afterAll(async () => {
        await mongoClient.close();
        await clearBucket();
    });

    beforeEach(() => {
        expect(process.env.NODE_ENV).toBe('test');

        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
    });

    afterEach(async () => {
        await clearCollection(collection);
        await insertOther(collection);
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe('create', () => {
        afterAll(async () => {
            await clearBucket();
        });

        let mockRemoveBackground;
        let categoryId;
        let categoryData;
        let data;
        beforeEach(async () => {
            mockRemoveBackground = jest.spyOn(helpers, 'removeBackground');
            mockRemoveBackground.mockImplementation(async (fileSrc) => {
                return await helpers.b64ToBuffer(fileSrc);
            });

            categoryId = new ObjectId();
            categoryData = {
                _id: categoryId,
                name: 'Blazers',
                items: []
            };

            await collection.insertOne(categoryData);

            data = {
                fileSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==',
                fullFileName: 'Blazin Blazer.png',
                clientId: (new ObjectId()).toString(),
                categoryId: categoryId.toString(),
                rmbg: true
            };
        });

        it('should add new file - remove background', async () => {
            // perform action to test
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', data.fileSrc)
                .field('fullFileName', data.fullFileName)
                .field('clientId', data.clientId)
                .field('categoryId', data.categoryId)
                .field('rmbg', data.rmbg);

            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
    
            const category = await collection.findOne({ _id: ObjectId(data.categoryId) });
            expect(category.items).toHaveLength(1);

            const file = category.items[0];
            expect(file).toBeTruthy();
            expect(file.clientId).toBe(data.clientId);
            expect(file.fileName).toBe('Blazin Blazer');
            expect(file).toHaveProperty('gcsId');

            const gcsId = file.gcsId;
            expect(file.fullFileUrl).toBe(`https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Ffull.png`);
            expect(file.smallFileUrl).toBe(`https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Fsmall.png`);
            expect(file.fullGcsDest).toBe(`test/items/${gcsId}/full.png`);
            expect(file.smallGcsDest).toBe(`test/items/${gcsId}/small.png`);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should add new file - no remove background', async () => {
            // perform action to test
            data.rmbg = false;
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', data.fileSrc)
                .field('fullFileName', data.fullFileName)
                .field('clientId', data.clientId)
                .field('categoryId', data.categoryId)
                .field('rmbg', data.rmbg);

            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            expect(mockRemoveBackground).not.toHaveBeenCalled();
    
            const category = await collection.findOne({ _id: ObjectId(data.categoryId) });
            expect(category.items).toHaveLength(1);

            const file = category.items[0];
            expect(file).toBeTruthy();
            expect(file.clientId).toBe(data.clientId);
            expect(file.fileName).toBe('Blazin Blazer');
            expect(file).toHaveProperty('gcsId');

            const gcsId = file.gcsId;
            expect(file.fullFileUrl).toBe(`https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Ffull.png`);
            expect(file.smallFileUrl).toBe(`https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Fsmall.png`);
            expect(file.fullGcsDest).toBe(`test/items/${gcsId}/full.png`);
            expect(file.smallGcsDest).toBe(`test/items/${gcsId}/small.png`);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(4);
        });

        it('should add new file - Other category given', async () => {
            // perform action to test
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', data.fileSrc)
                .field('fullFileName', data.fullFileName)
                .field('clientId', data.clientId)
                .field('categoryId', 0)
                .field('rmbg', data.rmbg);

            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
    
            const category = await collection.findOne({ _id: 0 });
            expect(category.items).toHaveLength(1);

            const file = category.items[0];
            expect(file).toBeTruthy();
            expect(file.clientId).toBe(data.clientId);
            expect(file.fileName).toBe('Blazin Blazer');
            expect(file).toHaveProperty('gcsId');

            const gcsId = file.gcsId;
            expect(file.fullFileUrl).toBe(`https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Ffull.png`);
            expect(file.smallFileUrl).toBe(`https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Fsmall.png`);
            expect(file.fullGcsDest).toBe(`test/items/${gcsId}/full.png`);
            expect(file.smallGcsDest).toBe(`test/items/${gcsId}/small.png`);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(6);
        });

        it('should add new file - not full file name', async () => {
            // perform action to test
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', data.fileSrc)
                .field('fullFileName', 'Blazin Blazer')
                .field('clientId', data.clientId)
                .field('categoryId', data.categoryId)
                .field('rmbg', data.rmbg);

            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            expect(mockRemoveBackground).toHaveBeenCalledWith(data.fileSrc);
    
            const category = await collection.findOne({ _id: ObjectId(data.categoryId) });
            expect(category.items).toHaveLength(1);

            const file = category.items[0];
            expect(file).toBeTruthy();
            expect(file.clientId).toBe(data.clientId);
            expect(file.fileName).toBe('Blazin Blazer');
            expect(file).toHaveProperty('gcsId');

            const gcsId = file.gcsId;
            expect(file.fullFileUrl).toBe(`https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Ffull.png`);
            expect(file.smallFileUrl).toBe(`https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Fitems%2F${gcsId}%2Fsmall.png`);
            expect(file.fullGcsDest).toBe(`test/items/${gcsId}/full.png`);
            expect(file.smallGcsDest).toBe(`test/items/${gcsId}/small.png`);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(8);
        });

        it('should fail with missing file source', async () => {
            // perform action to test
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', '')
                .field('fullFileName', data.fullFileName)
                .field('clientId', data.clientId)
                .field('categoryId', data.categoryId)
                .field('rmbg', data.rmbg);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('file source is required to create file');
            expect(mockRemoveBackground).not.toHaveBeenCalled();
    
            const category = await collection.findOne({ _id: ObjectId(data.categoryId) });
            expect(category.items).toHaveLength(0);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(8);
        });

        it('should fail with invalid MIME file source', async () => {
            // perform action to test
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', 'data:image/gif;base64,invalid-file-source')
                .field('fullFileName', data.fullFileName)
                .field('clientId', data.clientId)
                .field('categoryId', data.categoryId)
                .field('rmbg', data.rmbg);

            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('not a valid base64 image string');
            expect(mockRemoveBackground).toHaveBeenCalled();
    
            const category = await collection.findOne({ _id: ObjectId(data.categoryId) });
            expect(category.items).toHaveLength(0);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(8);
        });

        it('should fail with invalid file source', async () => {
            // perform action to test
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', 'data:image/png;base64,')
                .field('fullFileName', data.fullFileName)
                .field('clientId', data.clientId)
                .field('categoryId', data.categoryId)
                .field('rmbg', data.rmbg);

            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('arrayBuffer not successfully converted to buffer');
            expect(mockRemoveBackground).toHaveBeenCalled();
    
            const category = await collection.findOne({ _id: ObjectId(data.categoryId) });
            expect(category.items).toHaveLength(0);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(8);
        });

        it('should fail with missing file name', async () => {
            // perform action to test
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', data.fileSrc)
                .field('fullFileName', '')
                .field('clientId', data.clientId)
                .field('categoryId', data.categoryId)
                .field('rmbg', data.rmbg);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('file name is required to create file');
            expect(mockRemoveBackground).not.toHaveBeenCalled();
    
            const category = await collection.findOne({ _id: ObjectId(data.categoryId) });
            expect(category.items).toHaveLength(0);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(8);
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', data.fileSrc)
                .field('fullFileName', data.fullFileName)
                .field('clientId', 'not-valid-id')
                .field('categoryId', data.categoryId)
                .field('rmbg', data.rmbg);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to add file: invalid or missing client id');
            expect(mockRemoveBackground).not.toHaveBeenCalled();
    
            const category = await collection.findOne({ _id: ObjectId(data.categoryId) });
            expect(category.items).toHaveLength(0);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(8);
        });

        it('should fail with invalid category id', async () => {
            // perform action to test
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', data.fileSrc)
                .field('fullFileName', data.fullFileName)
                .field('clientId', data.clientId)
                .field('categoryId', '')
                .field('rmbg', data.rmbg);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to add file: invalid or missing category id');
            expect(mockRemoveBackground).not.toHaveBeenCalled();
    
            const category = await collection.findOne({ _id: ObjectId(data.categoryId) });
            expect(category.items).toHaveLength(0);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(8);
        });

        it('should fail with missing rembg option', async () => {
            // perform action to test
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', data.fileSrc)
                .field('fullFileName', data.fullFileName)
                .field('clientId', data.clientId)
                .field('categoryId', data.categoryId);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('background removal option is required to create file');
            expect(mockRemoveBackground).not.toHaveBeenCalled();
    
            const category = await collection.findOne({ _id: ObjectId(data.categoryId) });
            expect(category.items).toHaveLength(0);

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(8);
        });

        it('should fail with nonexistent category id', async () => {
            // perform action to test
            await clearCollection(collection);
            await insertOther(collection);

            const response = await agent(app)
                .post('/files')
                .field('fileSrc', data.fileSrc)
                .field('fullFileName', data.fullFileName)
                .field('clientId', data.clientId)
                .field('categoryId', data.categoryId)
                .field('rmbg', data.rmbg);

            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(`cannot add file: no category or multiple categories with the id "${data.categoryId}" exist`);
            expect(mockRemoveBackground).not.toHaveBeenCalled();
    
            const category = await collection.findOne({ _id: ObjectId(data.categoryId) });
            expect(category).toBeFalsy();

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(8);
        });
    });
    
    describe('read', () => {
        function createFile(clientId) {
            return {
                clientId: clientId,
                fileName: 'Blazin Blazer',
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url',
                fullGcsDest: 'test/items/full.png',
                smallGcsDest: 'test/items/small.png',
                gcsId: cuid2.createId()
            };
        }

        let clientId1;
        let clientId2;
        let clientId3;
        let clientId4;
        let categoryId;
        let categoryData;
        let otherData;
        beforeEach(async () => {
            clientId1 = (new ObjectId()).toString();
            clientId2 = (new ObjectId()).toString();
            clientId3 = (new ObjectId()).toString();
            clientId4 = (new ObjectId()).toString();
            categoryId = new ObjectId();
            categoryData = {
                _id: categoryId,
                name: 'Blazers',
                items: [
                    createFile(clientId1),
                    createFile(clientId1),
                    createFile(clientId2),
                    createFile(clientId1),
                    createFile(clientId3),
                    createFile(clientId2)
                ]
            };

            otherData = {
                _id: 0,
                name: 'Other',
                items: [
                    createFile(clientId1),
                    createFile(clientId2),
                    createFile(clientId2),
                    createFile(clientId1),
                    createFile(clientId2),
                    createFile(clientId1)
                ]
            };

            await clearCollection(collection);
            await collection.insertOne(categoryData);
            await collection.insertOne(otherData);
        });

        it('should get files', async () => {
            await clearCollection(collection);

            const file = createFile(clientId1);
            await collection.insertOne({
                _id: categoryData._id,
                name: categoryData.name,
                items: [ file ]
            });

            // perform action to test
            let response = await agent(app)
                .get(`/files/${file.clientId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);

            const category = response.body[0];
            expect(category._id.toString()).toBe(categoryData._id.toString());
            expect(category.name).toBe(categoryData.name);
            expect(category.items).toHaveLength(1);

            const item = category.items[0];
            expect(item.clientId).toBe(file.clientId);
            expect(item.fileName).toBe(file.fileName);
            expect(item.fullFileUrl).toBe(file.fullFileUrl);
            expect(item.smallFileUrl).toBe(file.smallFileUrl);
            expect(item.fullGcsDest).toBe(file.fullGcsDest);
            expect(item.smallGcsDest).toBe(file.smallGcsDest);
            expect(item.gcsId).toBe(file.gcsId);
        });

        it('should handle no files for client', async () => {
            // perform action to test
            let response = await agent(app)
                .get(`/files/${clientId4}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].items).toHaveLength(0);
            expect(response.body[1].items).toHaveLength(0);
        });

        it('should only get client files', async () => {
            // perform action to test
            let response = await agent(app)
                .get(`/files/${clientId1}`);
            
            // perform checks
            expect(response.status).toBe(200);

            let categories = response.body;
            expect(categories).toHaveLength(2);

            let files = categories.map(category => category.items).flat();
            expect(files.length).toBe(6);
            files.forEach(file => expect(file.clientId).toBe(clientId1));



            // perform action to test
            response = await agent(app)
                .get(`/files/${clientId2}`);
            
            // perform checks
            expect(response.status).toBe(200);

            categories = response.body;
            expect(categories).toHaveLength(2);

            files = categories.map(category => category.items).flat();
            expect(files.length).toBe(5);
            files.forEach(file => expect(file.clientId).toBe(clientId2));
            


            // perform action to test
            response = await agent(app)
                .get(`/files/${clientId3}`);
            
            // perform checks
            expect(response.status).toBe(200);

            categories = response.body;
            expect(categories).toHaveLength(2);

            files = categories.map(category => category.items).flat();
            expect(files.length).toBe(1);
            files.forEach(file => expect(file.clientId).toBe(clientId3));
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            let response = await agent(app)
                .get(`/files/not-valid-id`);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to get files: invalid or missing client id')
        });
    });

    describe('update file name', () => {
        function createFile(clientId) {
            return {
                clientId: clientId,
                fileName: 'Blazin Blazer',
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url',
                fullGcsDest: 'test/items/full.png',
                smallGcsDest: 'test/items/small.png',
                gcsId: cuid2.createId()
            };
        }

        let clientId;
        let categoryId;
        let fileData;
        let data;
        let patchData;
        beforeEach(async () => {
            clientId = (new ObjectId()).toString();
            categoryId = new ObjectId();

            fileData = createFile(clientId);
            data = {
                _id: categoryId,
                name: 'Blazers',
                items: [ 
                    createFile((new ObjectId()).toString()), 
                    createFile((new ObjectId()).toString()), 
                    fileData, 
                    createFile((new ObjectId()).toString()) ]
            };
            await collection.insertOne(data);

            patchData = { newName: 'Blaze-tastic Blazer' };
        });

        it('should update file name', async () => {
            // perform action to test
            let response = await agent(app)
                .patch(`/files/${categoryId.toString()}/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const category = await collection.findOne({ _id: data._id });
            expect(category.name).toBe(data.name);
            expect(category.items).toHaveLength(4);
            const file = category.items.find(item => item.gcsId === fileData.gcsId);

            expect(file.clientId).toBe(fileData.clientId);
            expect(file.fileName).toBe(patchData.newName);
            expect(file.fullFileUrl).toBe(fileData.fullFileUrl);
            expect(file.smallFileUrl).toBe(fileData.smallFileUrl);
            expect(file.fullGcsDest).toBe(fileData.fullGcsDest);
            expect(file.smallGcsDest).toBe(fileData.smallGcsDest);
            expect(file.gcsId).toBe(fileData.gcsId);
        });

        it('should update file name given Other category', async () => {
            // perform action to test
            await clearCollection(collection);
            const otherCategory = { _id: 0, name: 'Other', items: data.items };
            data = otherCategory;
            await collection.insertOne(data);

            let response = await agent(app)
                .patch(`/files/0/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const category = await collection.findOne({ _id: data._id });
            expect(category.name).toBe(data.name);
            expect(category.items).toHaveLength(4);
            const file = category.items.find(item => item.gcsId === fileData.gcsId);

            expect(file.clientId).toBe(fileData.clientId);
            expect(file.fileName).toBe(patchData.newName);
            expect(file.fullFileUrl).toBe(fileData.fullFileUrl);
            expect(file.smallFileUrl).toBe(fileData.smallFileUrl);
            expect(file.fullGcsDest).toBe(fileData.fullGcsDest);
            expect(file.smallGcsDest).toBe(fileData.smallGcsDest);
            expect(file.gcsId).toBe(fileData.gcsId);
        });

        it('should fail with missing file name', async () => {
            // perform action to test
            delete patchData.newName;
            let response = await agent(app)
                .patch(`/files/${categoryId.toString()}/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('file name is required to update file name');

            const category = await collection.findOne({ _id: data._id });
            expect(category.name).toBe(data.name);
            const file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file.fileName).not.toBe(patchData.newName);
        });

        it('should fail with invalid category id', async () => {
            // perform action to test
            let response = await agent(app)
                .patch(`/files/not-valid-id/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update file name: invalid or missing category id');

            const category = await collection.findOne({ _id: data._id });
            expect(category.name).toBe(data.name);
            const file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file.fileName).not.toBe(patchData.newName);
        });

        it('should fail with nonexistent category id', async () => {
            // perform action to test
            await clearCollection(collection);
            let response = await agent(app)
                .patch(`/files/${categoryId.toString()}/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('update of file name failed: category or file not found with given category or gcs id');

            const category = await collection.findOne({ _id: data._id });
            expect(category).toBeFalsy();
        });

        it('should fail with nonexistent gcs id', async () => {
            // perform action to test
            let response = await agent(app)
                .patch(`/files/${categoryId.toString()}/not-valid-gcs-id`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('update of file name failed: category or file not found with given category or gcs id');

            const category = await collection.findOne({ _id: data._id });
            expect(category.name).toBe(data.name);
            const file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file.fileName).not.toBe(patchData.newName);
        });
    });

    describe('update file category', () => {
        function createFile(clientId) {
            return {
                clientId: clientId,
                fileName: 'Blazin Blazer',
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url',
                fullGcsDest: 'test/items/full.png',
                smallGcsDest: 'test/items/small.png',
                gcsId: cuid2.createId()
            };
        }

        let clientId;
        let categoryId;
        let fileData;
        let data;
        let newCategoryId;
        let newCategoryData;
        let patchData;
        beforeEach(async () => {
            clientId = (new ObjectId()).toString();
            categoryId = new ObjectId();

            fileData = createFile(clientId);
            data = {
                _id: categoryId,
                name: 'Blazers',
                items: [ 
                    createFile((new ObjectId()).toString()), 
                    createFile((new ObjectId()).toString()), 
                    fileData, 
                    createFile((new ObjectId()).toString()) ]
            };
            await collection.insertOne(data);

            newCategoryId = new ObjectId();
            newCategoryData = {
                _id: newCategoryId,
                name: 'T-Shirts',
                items: [ createFile((new ObjectId()).toString()) ]
            };
            await collection.insertOne(newCategoryData);

            patchData = { newCategoryId: newCategoryId.toString() };
        });

        it('should update file category', async () => {
            let currCategory = await collection.findOne({ _id: data._id });
            let currItems = currCategory.items;
            expect(currItems).toHaveLength(4);

            let newCategory = await collection.findOne({ _id: newCategoryData._id });
            let newItems = newCategory.items;
            expect(newItems).toHaveLength(1);

            // perform action to test
            let response = await agent(app)
                .patch(`/files/category/${data._id.toString()}/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            currCategory = await collection.findOne({ _id: data._id });
            currItems = currCategory.items;
            expect(currItems).toHaveLength(3);

            newCategory = await collection.findOne({ _id: newCategoryData._id });
            newItems = newCategory.items;
            expect(newItems).toHaveLength(2);

            const file = newItems.find(item => item.gcsId === fileData.gcsId);

            expect(file.clientId).toBe(fileData.clientId);
            expect(file.fileName).toBe(fileData.fileName);
            expect(file.fullFileUrl).toBe(fileData.fullFileUrl);
            expect(file.smallFileUrl).toBe(fileData.smallFileUrl);
            expect(file.fullGcsDest).toBe(fileData.fullGcsDest);
            expect(file.smallGcsDest).toBe(fileData.smallGcsDest);
            expect(file.gcsId).toBe(fileData.gcsId);
        });

        it('should update file category - current is Other', async () => {
            await collection.updateOne({ _id: 0 }, { $push: { items: fileData } });
            let currCategory = await collection.findOne({ _id: 0 });
            let currItems = currCategory.items;
            expect(currItems).toHaveLength(1);

            let newCategory = await collection.findOne({ _id: newCategoryData._id });
            let newItems = newCategory.items;
            expect(newItems).toHaveLength(1);

            // perform action to test
            let response = await agent(app)
                .patch(`/files/category/0/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            currCategory = await collection.findOne({ _id: 0 });
            currItems = currCategory.items;
            expect(currItems).toHaveLength(0);

            newCategory = await collection.findOne({ _id: newCategoryData._id });
            newItems = newCategory.items;
            expect(newItems).toHaveLength(2);

            const file = newItems.find(item => item.gcsId === fileData.gcsId);

            expect(file.clientId).toBe(fileData.clientId);
            expect(file.fileName).toBe(fileData.fileName);
            expect(file.fullFileUrl).toBe(fileData.fullFileUrl);
            expect(file.smallFileUrl).toBe(fileData.smallFileUrl);
            expect(file.fullGcsDest).toBe(fileData.fullGcsDest);
            expect(file.smallGcsDest).toBe(fileData.smallGcsDest);
            expect(file.gcsId).toBe(fileData.gcsId);
        });

        it('should update file category - new is Other', async () => {
            let currCategory = await collection.findOne({ _id: data._id });
            let currItems = currCategory.items;
            expect(currItems).toHaveLength(4);

            let newCategory = await collection.findOne({ _id: 0 });
            let newItems = newCategory.items;
            expect(newItems).toHaveLength(0);

            // perform action to test
            patchData.newCategoryId = 0;
            let response = await agent(app)
                .patch(`/files/category/${data._id.toString()}/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            currCategory = await collection.findOne({ _id: data._id });
            currItems = currCategory.items;
            expect(currItems).toHaveLength(3);

            newCategory = await collection.findOne({ _id: 0 });
            newItems = newCategory.items;
            expect(newItems).toHaveLength(1);

            const file = newItems.find(item => item.gcsId === fileData.gcsId);

            expect(file.clientId).toBe(fileData.clientId);
            expect(file.fileName).toBe(fileData.fileName);
            expect(file.fullFileUrl).toBe(fileData.fullFileUrl);
            expect(file.smallFileUrl).toBe(fileData.smallFileUrl);
            expect(file.fullGcsDest).toBe(fileData.fullGcsDest);
            expect(file.smallGcsDest).toBe(fileData.smallGcsDest);
            expect(file.gcsId).toBe(fileData.gcsId);
        });

        it('should update file category - same new and current', async () => {
            let currCategory = await collection.findOne({ _id: data._id });
            let currItems = currCategory.items;
            expect(currItems).toHaveLength(4);

            // perform action to test
            patchData.newCategoryId = data._id.toString();
            let response = await agent(app)
                .patch(`/files/category/${data._id.toString()}/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            currCategory = await collection.findOne({ _id: data._id });
            currItems = currCategory.items;
            expect(currItems).toHaveLength(4);

            const file = currItems.find(item => item.gcsId === fileData.gcsId);

            expect(file.clientId).toBe(fileData.clientId);
            expect(file.fileName).toBe(fileData.fileName);
            expect(file.fullFileUrl).toBe(fileData.fullFileUrl);
            expect(file.smallFileUrl).toBe(fileData.smallFileUrl);
            expect(file.fullGcsDest).toBe(fileData.fullGcsDest);
            expect(file.smallGcsDest).toBe(fileData.smallGcsDest);
            expect(file.gcsId).toBe(fileData.gcsId);
        });

        it('should fail with missing new category id', async () => {
            // perform action to test
            delete patchData.newCategoryId;
            let response = await agent(app)
                .patch(`/files/category/${data._id.toString()}/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update file category: invalid or missing new category id');

            const currCategory = await collection.findOne({ _id: data._id });
            const currItems = currCategory.items;
            expect(currItems).toHaveLength(4);
            const file = currItems.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            const newCategory = await collection.findOne({ _id: newCategoryData._id });
            const newItems = newCategory.items;
            expect(newItems).toHaveLength(1);
        });

        it('should fail with invalid new category id', async () => {
            // perform action to test
            patchData.newCategoryId = 'not-valid-id';
            let response = await agent(app)
                .patch(`/files/category/${data._id.toString()}/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update file category: invalid or missing new category id');

            const currCategory = await collection.findOne({ _id: data._id });
            const currItems = currCategory.items;
            expect(currItems).toHaveLength(4);
            const file = currItems.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            const newCategory = await collection.findOne({ _id: newCategoryData._id });
            const newItems = newCategory.items;
            expect(newItems).toHaveLength(1);
        });

        it('should fail with invalid category id', async () => {
            // perform action to test
            let response = await agent(app)
                .patch(`/files/category/not-valid-id/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update file category: invalid or missing category id');

            const currCategory = await collection.findOne({ _id: data._id });
            const currItems = currCategory.items;
            expect(currItems).toHaveLength(4);
            const file = currItems.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            const newCategory = await collection.findOne({ _id: newCategoryData._id });
            const newItems = newCategory.items;
            expect(newItems).toHaveLength(1);
        });

        it('should fail if current category doesn\'t exist', async () => {
            await collection.deleteOne({ _id: data._id });
            // perform action to test
            let response = await agent(app)
                .patch(`/files/category/${data._id.toString()}/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to retrieve file from database');

            const currCategory = await collection.findOne({ _id: data._id });
            expect(currCategory).toBeFalsy();
        });

        it('should fail if file doesn\'t exist', async () => {
            // perform action to test
            let response = await agent(app)
                .patch(`/files/category/${data._id.toString()}/not-valid-gcs-id`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to retrieve file from database');

            const currCategory = await collection.findOne({ _id: data._id });
            const currItems = currCategory.items;
            expect(currItems).toHaveLength(4);
            const file = currItems.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            const newCategory = await collection.findOne({ _id: newCategoryData._id });
            const newItems = newCategory.items;
            expect(newItems).toHaveLength(1);
        });

        it('should fail if new category doesn\'t exist', async () => {
            await collection.deleteOne({ _id: newCategoryData._id });
            // perform action to test
            let response = await agent(app)
                .patch(`/files/category/${data._id.toString()}/${fileData.gcsId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('cannot change file category: no category or multiple categories exist');

            const currCategory = await collection.findOne({ _id: data._id });
            const currItems = currCategory.items;
            expect(currItems).toHaveLength(4);
            const file = currItems.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            const newCategory = await collection.findOne({ _id: newCategoryData._id });
            expect(newCategory).toBeFalsy();
        });
    });

    describe('delete', () => {
        function createFile(clientId) {
            return {
                clientId: clientId,
                fileName: 'Blazin Blazer',
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url',
                fullGcsDest: 'test/items/full.png',
                smallGcsDest: 'test/items/small.png',
                gcsId: cuid2.createId()
            };
        }

        let b64str = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==';
        let gcsId;
        let fullGcsDest;
        let smallGcsDest;
        let fileBuffer;
        let fullFileUrl;
        let smallFileUrl;

        let clientId;
        let categoryId;
        let fileData;
        let data;
        beforeEach(async () => {
            expect(bucket.id).toBe('edie-styles-virtual-closet-test');
            let [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(0);

            gcsId = cuid2.createId();
            fullGcsDest = `test/items/${gcsId}/full.png`;
            smallGcsDest = `test/items/${gcsId}/small.png`;
            fileBuffer = await helpers.b64ToBuffer(b64str);

            fullFileUrl = await helpers.uploadToGCS(bucket, fullGcsDest, fileBuffer);
            smallFileUrl = await helpers.uploadToGCS(bucket, smallGcsDest, fileBuffer);

            [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);

            clientId = (new ObjectId()).toString();
            categoryId = new ObjectId();

            fileData = {
                clientId: clientId,
                fileName: 'Blazin Blazer',
                fullFileUrl: fullFileUrl,
                smallFileUrl: smallFileUrl,
                fullGcsDest: fullGcsDest,
                smallGcsDest: smallGcsDest,
                gcsId: gcsId
            };

            data = {
                _id: categoryId,
                name: 'Blazers',
                items: [
                    createFile((new ObjectId()).toString()), 
                    fileData,
                    createFile((new ObjectId()).toString()),
                    createFile((new ObjectId()).toString())
                ]
            };
            await collection.insertOne(data);
        });

        afterEach(async() => {
            await clearBucket();
        });

        it('should delete file', async () => {
            let category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(4);
            let file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            // perform action to test
            const response = await agent(app)
                .delete(`/files/${data._id.toString()}/${fileData.gcsId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(3);
            file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeFalsy();

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(0);
        });

        it('should delete file - Other category', async () => {
            await clearCollection(collection);
            await collection.insertOne({ _id: 0, name: 'Other', items: [ fileData ] });

            let category = await collection.findOne({ _id: 0 });
            expect(category.items).toHaveLength(1);
            let file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            // perform action to test
            const response = await agent(app)
                .delete(`/files/0/${fileData.gcsId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            category = await collection.findOne({ _id: 0 });
            expect(category.items).toHaveLength(0);
            file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeFalsy();

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(0);
        });

        it('should fail with invalid category id', async () => {
            let category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(4);
            let file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            // perform action to test
            const response = await agent(app)
                .delete(`/files/not-valid-id/${fileData.gcsId}`);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to delete file: invalid or missing category id');

            category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(4);
            file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail with nonexistent category', async () => {
            await clearCollection(collection);

            // perform action to test
            const response = await agent(app)
                .delete(`/files/${data._id.toString()}/${fileData.gcsId}`);
            
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to retrieve file from database');

            const category = await collection.findOne({ _id: data._id });
            expect(category).toBeFalsy();

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail with nonexistent gcs id', async () => {
            let category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(4);
            let file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            // perform action to test
            const response = await agent(app)
                .delete(`/files/${data._id.toString()}/not-valid-gcs-id`);
            
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to retrieve file from database');

            category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(4);
            file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail with no fullGcsDest', async () => {
            await clearCollection(collection);
            delete fileData.fullGcsDest;
            data.items = [ fileData ];
            await collection.insertOne(data);

            let category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(1);
            let file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            // perform action to test
            const response = await agent(app)
                .delete(`/files/${data._id.toString()}/${fileData.gcsId}`);
            
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to retrieve file from database');

            category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(1);
            file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail with no smallGcsDest', async () => {
            await clearCollection(collection);
            delete fileData.smallGcsDest;
            data.items = [ fileData ];
            await collection.insertOne(data);

            let category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(1);
            let file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            // perform action to test
            const response = await agent(app)
                .delete(`/files/${data._id.toString()}/${fileData.gcsId}`);
            
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to retrieve file from database');

            category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(1);
            file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail with invalid fullGcsDest', async () => {
            await clearCollection(collection);
            fileData.fullGcsDest = `test/items/invalid/gcs-dest.png`;
            data.items = [ fileData ];
            await collection.insertOne(data);

            let category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(1);
            let file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            // perform action to test
            const response = await agent(app)
                .delete(`/files/${data._id.toString()}/${fileData.gcsId}`);
            
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(`No such object: edie-styles-virtual-closet-test/${fileData.fullGcsDest}`);

            category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(1);
            file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(2);
        });

        it('should fail with invalid smallGcsDest', async () => {
            await clearCollection(collection);
            fileData.smallGcsDest = `test/items/${gcsId}/invalid-gcs-dest.png`;
            data.items = [ fileData ];
            await collection.insertOne(data);

            let category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(1);
            let file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            // perform action to test
            const response = await agent(app)
                .delete(`/files/${data._id.toString()}/${fileData.gcsId}`);
            
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(`No such object: edie-styles-virtual-closet-test/${fileData.smallGcsDest}`);

            category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(1);
            file = category.items.find(item => item.gcsId === fileData.gcsId);
            expect(file).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/items/' });
            expect(files).toHaveLength(1);
        });
    });
});