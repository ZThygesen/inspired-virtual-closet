import { jest } from '@jest/globals';
import { app, bucket } from '../../server';
import { agent } from 'supertest';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers';
import cuid2 from '@paralleldrive/cuid2';

describe('outfits', () => {
    async function clearCollection(collection) {
        await collection.deleteMany({ });
    }

    async function clearBucket() {
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
        await bucket.deleteFiles({ prefix: 'test/outfits/'});

        const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
        expect(files).toHaveLength(0);
    }

    let mongoClient;
    let db;
    let collection;
    let clientCollection;

    beforeAll(async () => {
        mongoClient = new MongoClient(process.env.DB_URI);
        await mongoClient.connect();
        db = mongoClient.db(process.env.DB_NAME_TEST);
        collection = db.collection('outfits');
        clientCollection = db.collection('clients');

        expect(bucket.id).toBe('edie-styles-virtual-closet-test');

        const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
        expect(files).toHaveLength(0);
    });

    afterAll(async () => {
        await mongoClient.close();
        await clearBucket();
    });

    let clientId;
    let clientData;
    beforeEach(async () => {
        expect(process.env.NODE_ENV).toBe('test');

        expect(bucket.id).toBe('edie-styles-virtual-closet-test');

        clientId = (new ObjectId()).toString();
        clientData = {
            _id: ObjectId(clientId),
            firstName: 'John',
            lastName: 'Doe',
            email: 'jdoe@gmail.com',
            isAdmin: false
        };
        
        await clientCollection.insertOne(clientData);
    });

    afterEach(async () => {
        await clearCollection(collection);
        await clearCollection(clientCollection);
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe('create', () => {
        afterAll(async () => {
            await clearBucket();
        });

        let data;
        beforeEach(() => {
            data = {
                fileSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==',
                stageItemsStr: '{"stageItems":11.13}',
                outfitName: 'Epic Party Outfit',
                clientId: clientId
            };
        });

        it('should create new outfit', async () => {    
            // perform action to test
            const response = await agent(app)
                .post('/outfits')
                .field('fileSrc', data.fileSrc)
                .field('stageItemsStr', data.stageItemsStr)
                .field('outfitName', data.outfitName)
                .field('clientId', data.clientId);
    
            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
    
            const outfit = await collection.findOne({ clientId: clientId, outfitName: 'Epic Party Outfit' });
            expect(outfit).toBeTruthy();
            expect(outfit).toHaveProperty('_id');
            expect(outfit.clientId).toBe(data.clientId);
            expect(outfit.stageItems).toEqual(JSON.parse(data.stageItemsStr));
            expect(outfit.outfitName).toBe(data.outfitName);
            expect(outfit.outfitUrl).toEqual(expect.stringContaining('https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Foutfits%2F'));
            expect(outfit.gcsDest).toEqual(expect.stringContaining('test/outfits/'));

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail with missing file source', async () => {    
            // perform action to test
            const response = await agent(app)
                .post('/outfits')
                .field('fileSrc', '')
                .field('stageItemsStr', data.stageItemsStr)
                .field('outfitName', data.outfitName)
                .field('clientId', data.clientId);
    
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('file source is required to create outfit');

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail with invalid MIME file source', async () => {    
            // perform action to test
            const response = await agent(app)
                .post('/outfits')
                .field('fileSrc', 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==')
                .field('stageItemsStr', data.stageItemsStr)
                .field('outfitName', data.outfitName)
                .field('clientId', data.clientId);
    
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('not a valid base64 image string');

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail with invalid file source', async () => {    
            // perform action to test
            const response = await agent(app)
                .post('/outfits')
                .field('fileSrc', 'data:image/png;base64,')
                .field('stageItemsStr', data.stageItemsStr)
                .field('outfitName', data.outfitName)
                .field('clientId', data.clientId);
    
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('arrayBuffer not successfully converted to buffer');

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail with missing stage items string', async () => {    
            // perform action to test
            const response = await agent(app)
                .post('/outfits')
                .field('fileSrc', data.fileSrc)
                .field('stageItemsStr', '')
                .field('outfitName', data.outfitName)
                .field('clientId', data.clientId);
    
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('stage items string is missing or invalid');

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail with valid stage items string but invalid json', async () => {    
            // perform action to test
            const response = await agent(app)
                .post('/outfits')
                .field('fileSrc', data.fileSrc)
                .field('stageItemsStr', '{"stageItems":11.13')
                .field('outfitName', data.outfitName)
                .field('clientId', data.clientId);
    
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toEqual(expect.stringContaining('Expected \',\' or \'}\' after property value in JSON'));

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail with missing outfit name', async () => {    
            // perform action to test
            const response = await agent(app)
                .post('/outfits')
                .field('fileSrc', data.fileSrc)
                .field('stageItemsStr', data.stageItemsStr)
                .field('outfitName', '')
                .field('clientId', data.clientId);
    
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('outfit name is required to create outfit');

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail with missing client id', async () => {    
            // perform action to test
            const response = await agent(app)
                .post('/outfits')
                .field('fileSrc', data.fileSrc)
                .field('stageItemsStr', data.stageItemsStr)
                .field('outfitName', data.outfitName)
                .field('clientId', '');
    
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update outfit: invalid or missing client id');

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail with invalid client id', async () => {    
            // perform action to test
            const response = await agent(app)
                .post('/outfits')
                .field('fileSrc', data.fileSrc)
                .field('stageItemsStr', data.stageItemsStr)
                .field('outfitName', data.outfitName)
                .field('clientId', 'not-valid-id');
    
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update outfit: invalid or missing client id');

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail if client doesn\'t exist', async () => {    
            // perform action to test
            await clearCollection(clientCollection);
            const response = await agent(app)
                .post('/outfits')
                .field('fileSrc', data.fileSrc)
                .field('stageItemsStr', data.stageItemsStr)
                .field('outfitName', data.outfitName)
                .field('clientId', data.clientId);
    
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`cannot create outfit: no client or multiple clients with the id "${data.clientId}" exist`);

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });
    });
    
    describe('read', () => {
        let data;
        beforeEach(async () => {
            data = {
                _id: new ObjectId(),
                clientId: clientId,
                stageItems: { stageItems: 11.13 },
                outfitName: 'Epic Party Outfit',
                outfitUrl: 'outfit.url',
                gcsDest: 'test/outfits/gcsdest.png'
            };
            await collection.insertOne(data);
        });

        it('should get outfits', async () => {
            // perform action to test
            const response = await agent(app)
                .get(`/outfits/${data.clientId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);

            const outfit = response.body[0];
            expect(outfit._id.toString()).toBe(data._id.toString());
            expect(outfit.clientId).toBe(data.clientId);
            expect(outfit.stageItems).toEqual(data.stageItems);
            expect(outfit.outfitName).toBe(data.outfitName);
            expect(outfit.outfitUrl).toBe(data.outfitUrl);
            expect(outfit.gcsDest).toBe(data.gcsDest);
        });

        it('should handle multiple outfits', async () => {
            // perform action to test
            data._id = new ObjectId();
            await collection.insertOne(data);

            const response = await agent(app)
                .get(`/outfits/${data.clientId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
        });

        it('should handle no outfits', async () => {
            // perform action to test
            await clearCollection(collection);
            const response = await agent(app)
                .get(`/outfits/${data.clientId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(0);
        });

        it('should only return client\'s outfits', async () => {
            // perform action to test
            const otherOutfit = { ...data };
            const otherClient = { ...clientData };

            otherOutfit._id = new ObjectId();
            otherOutfit.clientId = (new ObjectId()).toString();
            otherClient._id = ObjectId(otherOutfit.clientId);

            await collection.insertOne(otherOutfit);
            await clientCollection.insertOne(otherClient);

            let response = await agent(app)
                .get(`/outfits/${data.clientId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            
            let outfit = response.body[0];
            expect(outfit._id.toString()).toBe(data._id.toString());
            expect(outfit.clientId).toBe(data.clientId);

            response = await agent(app)
                .get(`/outfits/${otherOutfit.clientId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            
            outfit = response.body[0];
            expect(outfit._id.toString()).toEqual(otherOutfit._id.toString());
            expect(outfit.clientId).toBe(otherOutfit.clientId);
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            const response = await agent(app)
                .get(`/outfits/not-valid-id`);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to get outfits: invalid or missing client id');
        });

        it('should fail if client doesn\'t exist', async () => {
            // perform action to test
            await clearCollection(clientCollection);
            const response = await agent(app)
                .get(`/outfits/${data.clientId}`);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`cannot get outfits: no client or multiple clients with the id "${data.clientId}" exist`);
        });
    });
    
    describe('update full', () => {
        let fileSrc;
        let fileBuffer;
        let gcsId;
        let gcsDest;
        let url;
        beforeAll(async () => {
            expect(bucket.id).toBe('edie-styles-virtual-closet-test');

            let [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(0);

            fileSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==',
            fileBuffer = await helpers.b64ToBuffer(fileSrc);
            gcsId = cuid2.createId();
            gcsDest = `test/outfits/${gcsId}.png`

            const file = bucket.file(gcsDest);
            await file.save(fileBuffer);
            url = await file.publicUrl();

            [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(gcsDest);
            expect(files[0].metadata.contentType).toBe('image/png');
        });

        afterAll(async () => {
            await clearBucket();
        });

        let data;
        let patchData;
        beforeEach(async () => {
            data = {
                _id: new ObjectId(),
                clientId: (new ObjectId()).toString(),
                stageItems: { stageItems: 11.13 },
                outfitName: 'Epic Party Outfit',
                outfitUrl: url,
                gcsDest: gcsDest
            };
            await collection.insertOne(data);

            patchData = {
                fileSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAD7AP8+AD8fAB9eAF99AH/0nKUYAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==',
                stageItemsStr: '{"stageItems":{"anotherLayer":13.11}}',
                outfitName: 'Formal Wedding Attire',
                gcsDest: data.gcsDest
            };
        });

        let newGcsDest;

        it('should update outfit content', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/outfits/${data._id.toString()}`)
                .field('fileSrc', patchData.fileSrc)
                .field('stageItemsStr', patchData.stageItemsStr)
                .field('outfitName', patchData.outfitName)
                .field('gcsDest', patchData.gcsDest);

            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();
            expect(outfit._id.toString()).toBe(data._id.toString());
            expect(outfit.clientId).toBe(data.clientId);
            expect(outfit.stageItems).toEqual(JSON.parse(patchData.stageItemsStr));
            expect(outfit.outfitName).toBe(patchData.outfitName);
            expect(outfit.outfitUrl).not.toBe(data.outfitUrl);
            expect(outfit.outfitUrl).toEqual(expect.stringContaining('https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Foutfits%2F'));
            expect(outfit.gcsDest).not.toBe(data.gcsDest);
            expect(outfit.gcsDest).toEqual(expect.stringContaining('test/outfits'));

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).not.toBe(gcsDest);
            expect(files[0].metadata.contentType).toBe('image/png');

            newGcsDest = files[0].name;
            expect(outfit.gcsDest).toBe(newGcsDest);
        });  

        it('should fail with missing file source', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/outfits/${data._id.toString()}`)
                .field('fileSrc', '')
                .field('stageItemsStr', patchData.stageItemsStr)
                .field('outfitName', patchData.outfitName)
                .field('gcsDest', patchData.gcsDest);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('file source is required to update outfit');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(newGcsDest);
        });  

        it('should fail with invalid file source', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/outfits/${data._id.toString()}`)
                .field('fileSrc', 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAD7AP8+AD8fAB9eAF99AH/0nKUYAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==')
                .field('stageItemsStr', patchData.stageItemsStr)
                .field('outfitName', patchData.outfitName)
                .field('gcsDest', patchData.gcsDest);

            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('not a valid base64 image string');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(newGcsDest);
        });  

        it('should fail with missing stage items string', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/outfits/${data._id.toString()}`)
                .field('fileSrc', patchData.fileSrc)
                .field('stageItemsStr', '')
                .field('outfitName', patchData.outfitName)
                .field('gcsDest', patchData.gcsDest);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('stage items string is required to update outfit');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(newGcsDest);
        });  

        it('should fail with missing outfit name', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/outfits/${data._id.toString()}`)
                .field('fileSrc', patchData.fileSrc)
                .field('stageItemsStr', patchData.stageItemsStr)
                .field('outfitName', '')
                .field('gcsDest', patchData.gcsDest);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('outfit name is required to update outfit');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(newGcsDest);
        });  

        it('should fail with missing gcs dest', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/outfits/${data._id.toString()}`)
                .field('fileSrc', patchData.fileSrc)
                .field('stageItemsStr', patchData.stageItemsStr)
                .field('outfitName', patchData.outfitName)
                .field('gcsDest', '');

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('gcsDest is required to update outfit');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(newGcsDest);
        });  

        it('should fail with invalid gcs dest', async () => {
            // perform action to test
            const invalidGcsDest = `test/outfits/${gcsId}.jpg`
            const response = await agent(app)
                .patch(`/outfits/${data._id.toString()}`)
                .field('fileSrc', patchData.fileSrc)
                .field('stageItemsStr', patchData.stageItemsStr)
                .field('outfitName', patchData.outfitName)
                .field('gcsDest', invalidGcsDest);

            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(`No such object: edie-styles-virtual-closet-test/${invalidGcsDest}`);

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(newGcsDest);
        });  

        it('should fail with nonexistent gcs dest', async () => {
            // perform action to test
            const invalidGcsDest = 'test/outfits/not-valid-gcs-dest.png'
            const response = await agent(app)
                .patch(`/outfits/${data._id.toString()}`)
                .field('fileSrc', patchData.fileSrc)
                .field('stageItemsStr', patchData.stageItemsStr)
                .field('outfitName', patchData.outfitName)
                .field('gcsDest', invalidGcsDest);

            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(`No such object: edie-styles-virtual-closet-test/${invalidGcsDest}`);

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(newGcsDest);
        });  

        it('should fail with invalid outfit id', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/outfits/not-valid-id`)
                .field('fileSrc', patchData.fileSrc)
                .field('stageItemsStr', patchData.stageItemsStr)
                .field('outfitName', patchData.outfitName)
                .field('gcsDest', patchData.gcsDest);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update outfit content: invalid or missing outfit id');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(newGcsDest);
        });  

        it('should fail with nonexistent outfit id', async () => {
            // perform action to test
            const newId = (new ObjectId()).toString();
            const response = await agent(app)
                .patch(`/outfits/${newId}`)
                .field('fileSrc', patchData.fileSrc)
                .field('stageItemsStr', patchData.stageItemsStr)
                .field('outfitName', patchData.outfitName)
                .field('gcsDest', patchData.gcsDest);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`cannot create outfit: no outfit or multiple outfits with the id "${newId}" exist`);

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(newGcsDest);
        });
    });

    describe('update partial', () => {  
        let outfitId; 
        let data;
        let patchData;
        beforeEach(async () => {
            outfitId = new ObjectId();
            data = {
                _id: outfitId,
                clientId: clientId,
                stageItems: { stageItems: 11.13 },
                outfitName: 'Epic Party Outfit',
                outfitUrl: 'outfit.url',
                gcsDest: 'test/outfits/gcsdest.png'
            };
            await collection.insertOne(data);

            patchData = {
                newName: 'Formal Wedding Attire'
            };
        });

        it('should update outfit name', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/outfits/name/${data._id.toString()}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit._id.toString()).toBe(data._id.toString());
            expect(outfit.clientId).toBe(data.clientId);
            expect(outfit.stageItems).toEqual(data.stageItems);
            expect(outfit.outfitName).toBe(patchData.newName);
            expect(outfit.outfitUrl).toBe(data.outfitUrl);
            expect(outfit.gcsDest).toBe(data.gcsDest);
        });

        it('should fail with missing outfit name', async () => {
            // perform action to test
            patchData.newName = '';
            const response = await agent(app)
                .patch(`/outfits/name/${data._id.toString()}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('outfit name is required to update outfit');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit.outfitName).toBe(data.outfitName);
        });

        it('should fail with invalid outfit id', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/outfits/name/not-valid-id`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update outfit name: invalid or missing outfit id');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit.outfitName).toBe(data.outfitName);
        });

        it('should fail with nonexistent outfit id', async () => {
            // perform action to test
            const newId = (new ObjectId()).toString();
            const response = await agent(app)
                .patch(`/outfits/name/${newId}`)
                .send(patchData);
            
            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('update failed: outfit not found with given outfit id');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit.outfitName).toBe(data.outfitName);
        });
    });

    describe('delete', () => {
        let fileSrc;
        let fileBuffer;
        let gcsId;
        let gcsDest;
        let url;
        beforeAll(async () => {
            expect(bucket.id).toBe('edie-styles-virtual-closet-test');

            let [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(0);

            fileSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==',
            fileBuffer = await helpers.b64ToBuffer(fileSrc);
            gcsId = cuid2.createId();
            gcsDest = `test/outfits/${gcsId}.png`

            const file = bucket.file(gcsDest);
            await file.save(fileBuffer);
            url = await file.publicUrl();

            [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(gcsDest);
            expect(files[0].metadata.contentType).toBe('image/png');
        });

        afterAll(async () => {
            await clearBucket();
        });

        let data;
        beforeEach(async () => {
            data = {
                _id: new ObjectId(),
                clientId: clientId,
                stageItems: { stageItems: 11.13 },
                outfitName: 'Epic Party Outfit',
                outfitUrl: url,
                gcsDest: gcsDest
            };
            await collection.insertOne(data);
        });

        it('should delete outfit', async () => {
            // perform action to test
            const response = await agent(app)
                .delete(`/outfits/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeFalsy();

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(0);
        });

        it('should fail with invalid outfit id', async () => {
            // perform action to test
            const response = await agent(app)
                .delete(`/outfits/not-valid-id`);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to delete outfit: invalid or missing outfit id');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();
        });

        it('should fail with nonexistent outfit id', async () => {
            // perform action to test
            const newId = (new ObjectId()).toString();
            const response = await agent(app)
                .delete(`/outfits/${newId}`);
            
            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('outfit not found with given outfit id or is missing gcs destination');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();
        });

        it('should fail if outfit has no gcs dest', async () => {
            // perform action to test
            await clearCollection(collection);

            const newOutfit = { ...data };
            delete newOutfit.gcsDest;
            await collection.insertOne(newOutfit);

            const response = await agent(app)
                .delete(`/outfits/${newOutfit._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('outfit not found with given outfit id or is missing gcs destination');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();
        });

        it('should fail if outfit has invalid gcs dest', async () => {
            // perform action to test
            await clearCollection(collection);

            const newOutfit = { ...data };
            newOutfit.gcsDest = 'invalid-gest-dest';
            await collection.insertOne(newOutfit);

            const response = await agent(app)
                .delete(`/outfits/${newOutfit._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('No such object: edie-styles-virtual-closet-test/invalid-gest-dest');

            const outfit = await collection.findOne({ _id: data._id });
            expect(outfit).toBeTruthy();
        });
    });
});