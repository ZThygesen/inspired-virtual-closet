import { jest } from '@jest/globals';
import { bucket } from '../../server';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers';
import cuid2 from '@paralleldrive/cuid2';
import { integrationHelpers } from './helpers';
import { schema } from '../../schema/outfits.schema';

describe('outfits', () => {
    let user, client, db, collection, clientCollection;
    beforeAll(async () => {
        await integrationHelpers.beforeAll('outfits');

        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
        const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
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
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
    });
    afterEach(async () => {
        await integrationHelpers.afterEach();
    });

    async function clearBucket() {
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
        await bucket.deleteFiles({ prefix: 'test/outfits/'});

        const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
        expect(files).toHaveLength(0);
    }

    describe('post', () => {
        let params, body;
        beforeEach(async () => {
            await clearBucket();
            params = [client._id.toString()];
            body = {
                fileSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==',
                stageItems: JSON.stringify({ "stageItems": 11.13 }),
                outfitName: 'Epic Party Outfit',
                itemsUsed: JSON.stringify([cuid2.createId(), cuid2.createId()]),
            };
        });

        const request = (params, body) => integrationHelpers.executeRequest('post', '/outfits', params, body, {
            isFormData: true,
        });

        it('should create new outfit', async () => {    
            const response = await request(params, body);

            expect(response.body.message).toBe('Success!');
            expect(response.status).toBe(201);
    
            const outfit = await collection.findOne({ clientId: client._id.toString(), outfitName: body.outfitName });
            expect(outfit).toBeTruthy();
            expect(outfit).toHaveProperty('_id');
            expect(outfit).toMatchObject({
                clientId: client._id.toString(),
                stageItems: JSON.parse(body.stageItems),
                outfitName: body.outfitName,
                itemsUsed: JSON.parse(body.itemsUsed),
            });
            expect(outfit.outfitUrl).toEqual(expect.stringContaining('https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Foutfits%2F'));
            expect(outfit.gcsDest).toEqual(expect.stringContaining('test/outfits/'));

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should create new outfit with no files used', async () => {    
            body.itemsUsed = JSON.stringify([]);
            const response = await request(params, body);

            expect(response.body.message).toBe('Success!');
            expect(response.status).toBe(201);

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail if client does not exist', async () => {
            await integrationHelpers.removeClient();
            const response = await request(params, body);

            expect(response.body.message).toBe('client not found');
            expect(response.status).toBe(404);

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(0);
        });

        integrationHelpers.testParams(schema.post.params.fields, request, () => body, ['clientId'], {
            checkPermissions: true,
        });
        integrationHelpers.testBody(schema.post.body.fields, request, () => params, {
            isFormData: true,
        });
        integrationHelpers.testAuth({ admin: true, checkPermissions: true }, request, () => params, () => body, 201);
    });
    
    describe('get', () => {
        let outfit1, outfit2, outfit3;
        let params, body;
        beforeEach(async () => {
            outfit1 = {
                _id: ObjectId(),
                clientId: client._id.toString(),
                stageItems: { stageItems: 11.13 },
                outfitName: 'Epic Party Outfit',
                itemsUsed: [cuid2.createId(), cuid2.createId()],
                outfitUrl: 'outfit.url',
                gcsDest: 'test/outfits/gcsdest.png',
            };
            outfit2 = {
                ...outfit1,
                _id: ObjectId(),
            };
            outfit3 = {
                ...outfit1,
                _id: ObjectId(),
                clientId: ObjectId().toString(),
            };
            await collection.insertOne(outfit1);

            params = [client._id.toString()];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('get', '/outfits', params, body);

        it('should get outfits for client', async () => {
            const response = await request(params, body);
            
            expect(response.status).toBe(200);

            const outfits = response.body;
            expect(outfits).toHaveLength(1);

            const outfit = outfits[0];
            expect(outfit._id).toBe(outfit1._id.toString());
        });

        it('should handle no outfits for client', async () => {
            const otherClientId = ObjectId();
            await clientCollection.insertOne({ _id: otherClientId });
            params = [otherClientId.toString()];

            const response = await request(params, body);

            expect(response.status).toBe(200);

            const outfits = response.body;
            expect(outfits).toHaveLength(0);
        });

        it('should handle multiple outfits for client', async () => {
            await collection.insertOne(outfit2);

            const response = await request(params, body);
            
            expect(response.status).toBe(200);

            const outfits = response.body;
            expect(outfits).toHaveLength(2);
            expect(outfits[0]._id).toBe(outfit1._id.toString());
            expect(outfits[1]._id).toBe(outfit2._id.toString());
        });

        it('should only return outfits for client', async () => {
            await collection.insertOne(outfit3);

            const response = await request(params, body);
            
            expect(response.status).toBe(200);

            const outfits = response.body;
            expect(outfits).toHaveLength(1);
            expect(outfits[0]._id).toBe(outfit1._id.toString());
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
    
    describe('patchFull', () => {
        let outfit;
        let params, body;
        beforeEach(async () => {
            await clearBucket();

            // upload existing file into GCS
            const fileSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==';
            const fileBuffer = await helpers.b64ToBuffer(fileSrc);
            const gcsId = cuid2.createId();
            const gcsDest = `test/outfits/${gcsId}.png`;
            const file = bucket.file(gcsDest);
            await file.save(fileBuffer);
            const url = await file.publicUrl();
            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(gcsDest);
            expect(files[0].metadata.contentType).toBe('image/png');

            outfit = {
                _id: ObjectId(),
                clientId: client._id.toString(),
                stageItems: { stageItems: 11.13 },
                outfitName: 'Epic Party Outfit',
                itemsUsed: [cuid2.createId(), cuid2.createId()],
                outfitUrl: url,
                gcsDest: gcsDest,
            };
            await collection.insertOne(outfit);

            params = [client._id.toString(), outfit._id.toString()];
            body = {
                fileSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAD7AP8+AD8fAB9eAF99AH/0nKUYAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==',
                stageItems: JSON.stringify({ stageItems: { anotherLayer: 13.11 } }),
                outfitName: 'Formal Wedding Attire',
                itemsUsed: JSON.stringify([cuid2.createId(), cuid2.createId()]),
                gcsDest: outfit.gcsDest,
            };
        });

        const request = (params, body) => integrationHelpers.executeRequest('patch', '/outfits', params, body, {
            isFormData: true,
        });

        it('should update outfit', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const newOutfit = await collection.findOne({ _id: outfit._id });
            expect(newOutfit).toMatchObject({
                _id: outfit._id,
                clientId: outfit.clientId,
                stageItems: JSON.parse(body.stageItems),
                outfitName: body.outfitName,
                itemsUsed: JSON.parse(body.itemsUsed),
            });
            expect(newOutfit.outfitUrl).not.toBe(outfit.outfitUrl);
            expect(newOutfit.outfitUrl).toEqual(expect.stringContaining('https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Foutfits%2F'));
            expect(newOutfit.gcsDest).not.toBe(outfit.gcsDest);
            expect(newOutfit.gcsDest).toEqual(expect.stringContaining('test/outfits'));

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).not.toBe(outfit.gcsDest);
            expect(files[0].name).toBe(newOutfit.gcsDest);
            expect(files[0].metadata.contentType).toBe('image/png');
        });

        it('should fail if outfit does not exist', async () => {
            const badOutfitId = ObjectId().toString();
            params = [client._id.toString(), badOutfitId];
            const response = await request(params, body);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`cannot update outfit: no outfit with the id "${badOutfitId}" exists`);

            const newOutfit = await collection.findOne({ _id: outfit._id });
            expect(newOutfit).toStrictEqual(outfit);

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(outfit.gcsDest);
        }); 

        it('should fail if client does not exist', async () => {
            await integrationHelpers.removeClient();
            const response = await request(params, body);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');

            const newOutfit = await collection.findOne({ _id: outfit._id });
            expect(newOutfit).toStrictEqual(outfit);

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(outfit.gcsDest);
        }); 

        it('should fail to delete old file if gcsDest does not exist', async () => {
            body.gcsDest = 'invalid-gcs-dest';
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe(`No such object: edie-styles-virtual-closet-test/${body.gcsDest}`);

            // still succeeds in db
            const newOutfit = await collection.findOne({ _id: outfit._id });
            expect(newOutfit).toMatchObject({
                _id: outfit._id,
                clientId: outfit.clientId,
                stageItems: JSON.parse(body.stageItems),
                outfitName: body.outfitName,
                itemsUsed: JSON.parse(body.itemsUsed),
            });
            expect(newOutfit.outfitUrl).not.toBe(outfit.outfitUrl);
            expect(newOutfit.outfitUrl).toEqual(expect.stringContaining('https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Foutfits%2F'));
            expect(newOutfit.gcsDest).not.toBe(outfit.gcsDest);
            expect(newOutfit.gcsDest).toEqual(expect.stringContaining('test/outfits'));

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(2);
        }); 

        integrationHelpers.testParams(schema.patchFull.params.fields, request, () => body, ['clientId', 'outfitId'], {
            checkPermissions: true,
        });
        integrationHelpers.testBody(schema.patchFull.body.fields, request, () => params, {
            isFormData: true,
        });
        integrationHelpers.testAuth({ admin: true, checkPermissions: true }, request, () => params, () => body);
    });

    describe('updatePartial', () => {  
        let outfit;
        let params, body;
        beforeEach(async () => {
            outfit = {
                _id: ObjectId(),
                clientId: client._id.toString(),
                stageItems: { stageItems: 11.13 },
                outfitName: 'Epic Party Outfit',
                itemsUsed: [cuid2.createId(), cuid2.createId()],
                outfitUrl: 'outfit.url',
                gcsDest: 'test/outfits/gcsdest.png',
            };
            await collection.insertOne(outfit);

            params = [client._id.toString(), outfit._id.toString()];
            body = {
                outfitName: 'Formal Wedding Attire',
            };
        });

        const request = (params, body) => integrationHelpers.executeRequest('patch', '/outfits/name', params, body);

        it('should update outfit name', async () => {
            const response = await request(params, body);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const newOutfit = await collection.findOne({ _id: outfit._id });
            expect(newOutfit).toMatchObject({
                _id: outfit._id,
                clientId: outfit.clientId,
                stageItems: outfit.stageItems,
                outfitName: body.outfitName,
                itemsUsed: outfit.itemsUsed,
                outfitUrl: outfit.outfitUrl,
                gcsDest: outfit.gcsDest,
           });
        });

        it('should fail if outfit does not exist', async () => {
            params = [client._id.toString(), ObjectId().toString()];
            const response = await request(params, body);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('update failed: outfit not found with given outfit id');

            const newOutfit = await collection.findOne({ _id: outfit._id });
            expect(newOutfit).toMatchObject(outfit);
        });

        it('should fail if client does not exist', async () => {
            await integrationHelpers.removeClient();
            const response = await request(params, body);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');

            const newOutfit = await collection.findOne({ _id: outfit._id });
            expect(newOutfit).toMatchObject(outfit);
        });

        integrationHelpers.testParams(schema.patchPartial.params.fields, request, () => body, ['clientId', 'outfitId'], {
            checkPermissions: true,
        });
        integrationHelpers.testBody(schema.patchPartial.body.fields, request, () => params);
        integrationHelpers.testAuth({ admin: true, checkPermissions: true }, request, () => params, () => body);
    });

    describe('delete', () => {
        let outfit;
        let params, body;
        beforeEach(async () => {
            await clearBucket();

            // upload existing file into GCS
            const fileSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==';
            const fileBuffer = await helpers.b64ToBuffer(fileSrc);
            const gcsId = cuid2.createId();
            const gcsDest = `test/outfits/${gcsId}.png`;
            const file = bucket.file(gcsDest);
            await file.save(fileBuffer);
            const url = await file.publicUrl();
            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe(gcsDest);
            expect(files[0].metadata.contentType).toBe('image/png');

            outfit = {
                _id: ObjectId(),
                clientId: client._id.toString(),
                stageItems: { stageItems: 11.13 },
                outfitName: 'Epic Party Outfit',
                itemsUsed: [cuid2.createId(), cuid2.createId()],
                outfitUrl: url,
                gcsDest: gcsDest,
            };
            await collection.insertOne(outfit);

            params = [client._id.toString(), outfit._id.toString()];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('delete', '/outfits', params, body);

        it('should delete outfit', async () => {
            const response = await request(params, body);
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const deletedOutfit = await collection.findOne({ _id: outfit._id });
            expect(deletedOutfit).toBeFalsy();

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(0);
        });

        it('should fail if outfit does not exist', async () => {
            params = [client._id.toString(), ObjectId().toString()];
            const response = await request(params, body);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('outfit not found with given outfit id or is missing gcs destination');

            const deletedOutfit = await collection.findOne({ _id: outfit._id });
            expect(deletedOutfit).toMatchObject(outfit);

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail if outfit has no gcsDest', async () => {
            await integrationHelpers.clearCollection();
            delete outfit.gcsDest;
            await collection.insertOne(outfit);
            const response = await request(params, body);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('outfit not found with given outfit id or is missing gcs destination');

            const deletedOutfit = await collection.findOne({ _id: outfit._id });
            expect(deletedOutfit).toMatchObject(outfit);

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail if gcsDest does not exist', async () => {
            await integrationHelpers.clearCollection();
            outfit.gcsDest = 'invalid-gcs-dest';
            await collection.insertOne(outfit);
            const response = await request(params, body);
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(`No such object: edie-styles-virtual-closet-test/${outfit.gcsDest}`);

            const deletedOutfit = await collection.findOne({ _id: outfit._id });
            expect(deletedOutfit).toMatchObject(outfit);

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        it('should fail if client does not exist', async () => {
            await integrationHelpers.removeClient();
            const response = await request(params, body);
            
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');

            const deletedOutfit = await collection.findOne({ _id: outfit._id });
            expect(deletedOutfit).toMatchObject(outfit);

            const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
            expect(files).toHaveLength(1);
        });

        integrationHelpers.testParams(schema.delete.params.fields, request, () => body, ['clientId', 'outfitId'], {
            checkPermissions: true,
        });
        integrationHelpers.testAuth({ admin: true, checkPermissions: true }, request, () => params, () => body);
    });
});