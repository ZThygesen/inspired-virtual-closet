import { jest } from '@jest/globals';
import { app } from '../../server';
import { agent as supertest } from 'supertest';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers.js';
import jwt from 'jsonwebtoken';

describe('auth', () => {
    let user;
    let token;
    let cookie;
    let invalidToken;
    let invalidCookie;
    async function createUser(db) {
        user = {
            _id: new ObjectId(),
            firstName: 'Jane',
            lastName: 'Deer',
            email: 'janedeer11@gmail.com',
            credits: 350,
            isAdmin: true,
            isSuperAdmin: true
        };

        const collection = db.collection('clients');
        await collection.insertOne(user);

        token = jwt.sign({ id: user._id, isAdmin: user.isAdmin, isSuperAdmin: user.isSuperAdmin }, process.env.JWT_SECRET);
        cookie = `token=${token}`;

        invalidToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin, isSuperAdmin: user.isSuperAdmin }, 'not-correct-secret');
        invalidCookie = `token=${invalidToken}`;
    }

    async function setUserSuper(db) {
        const collection = db.collection('clients');
        await collection.updateOne({ _id: user._id }, { $set: { isAdmin: true, isSuperAdmin: true } });
        token = jwt.sign({ id: user._id, isAdmin: true, isSuperAdmin: true }, process.env.JWT_SECRET);
        cookie = `token=${token}`;
    }

    async function setUserAdmin(db) {
        const collection = db.collection('clients');
        await collection.updateOne({ _id: user._id }, { $set: { isAdmin: true, isSuperAdmin: false } });
        token = jwt.sign({ id: user._id, isAdmin: true, isSuperAdmin: false }, process.env.JWT_SECRET);
        cookie = `token=${token}`;
    }

    async function setUserNormal(db) {
        const collection = db.collection('clients');
        await collection.updateOne({ _id: user._id }, { $set: { isAdmin: false, isSuperAdmin: false } });
        token = jwt.sign({ id: user._id, isAdmin: false, isSuperAdmin: false }, process.env.JWT_SECRET);
        cookie = `token=${token}`;
    }

    let clientId;
    let client;
    async function createClient(db) {
        clientId = new ObjectId();
        client = {
            _id: clientId,
            firstName: 'Jane',
            lastName: 'Deer',
            email: 'janedeer11@gmail.com',
            credits: 350,
            isAdmin: true,
            isSuperAdmin: true
        };

        const collection = db.collection('clients');
        await collection.insertOne(client);
    }

    async function setClientSuper(db) {
        const collection = db.collection('clients');
        await collection.updateOne({ _id: client._id }, { $set: { isAdmin: true, isSuperAdmin: true } });
    }

    async function setClientAdmin(db) {
        const collection = db.collection('clients');
        await collection.updateOne({ _id: client._id }, { $set: { isAdmin: true, isSuperAdmin: false } });
    }

    async function setClientNormal(db) {
        const collection = db.collection('clients');
        await collection.updateOne({ _id: client._id }, { $set: { isAdmin: false, isSuperAdmin: false } });
    }

    async function clearClients(db) {
        const collection = db.collection('clients');
        await collection.deleteMany({ });
    }

    beforeEach(async () => {
        expect(process.env.NODE_ENV).toBe('test');
    });

    afterEach(async () => {
        cookie = `token=${token}`;
        if (client) {
            client._id = clientId;
        }
        

        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    function agent(app) {
        return supertest(app).set('Cookie', cookie);
    }

    describe('clients', () => {

        let mongoClient;
        let db;
        let collection;
        beforeAll(async () => {
            mongoClient = new MongoClient(process.env.DB_URI);
            await mongoClient.connect();
            db = mongoClient.db(process.env.DB_NAME_TEST);
            collection = db.collection('clients');

            await createUser(db);
        });

        afterAll(async () => {
            await clearClients(db);
            await collection.deleteMany({ });
            await mongoClient.close();
        });

        describe('create', () => {
            let data;
            beforeAll(() => {
                data = {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'jdoe@gmail.com',
                    credits: 350,
                    isAdmin: false
                };
            });

            it('should succeed (super user)', async () => {
                await setUserSuper(db);
                // perform action to test
                const response = await agent(app)
                    .post('/api/clients')
                    .send(data);

                // perform checks
                expect(response.status).toBe(201);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (admin user)', async () => {
                await setUserAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .post('/api/clients')
                    .send(data);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only super admins are authorized for this action');
            });

            it('should fail (normal user)', async () => {
                await setUserNormal(db);
                // perform action to test
                const response = await agent(app)
                    .post('/api/clients')
                    .send(data);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only super admins are authorized for this action');
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .post('/api/clients')
                    .send(data);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .post('/api/clients')
                    .send(data);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });

        describe('read', () => {
            it('should succeed (super user)', async () => {
                await setUserSuper(db);
                // perform action to test
                const response = await agent(app)
                    .get('/api/clients');

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should succeed (admin user)', async () => {
                await setUserAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .get('/api/clients');

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should fail (normal user)', async () => {
                await setUserNormal(db);
                // perform action to test
                const response = await agent(app)
                    .get('/api/clients');

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action')
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .get('/api/clients');

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .get('/api/clients');

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });

        describe('read client', () => {
            let data;
            beforeAll(async () => {
                data = {
                    _id: new ObjectId(),
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'jdoe@gmail.com',
                    credits: 350,
                    isAdmin: false
                };
                await collection.insertOne(data);
            });

            it('should succeed (super user)', async () => {
                await setUserSuper(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/api/clients/${data._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should succeed (admin user)', async () => {
                await setUserAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/api/clients/${data._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should succeed (normal user)', async () => {
                await setUserNormal(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/api/clients/${data._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .get(`/api/clients/${data._id.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .get(`/api/clients/${data._id.toString()}`);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });

        describe('update', () => {
            let data;
            let patchData;
            beforeAll(async () => {
                data = {
                    _id: new ObjectId(),
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'jdoe@gmail.com',
                    credits: 350,
                    isAdmin: false
                };
                await collection.insertOne(data);

                patchData = {
                    newFirstName: 'Jane',
                    newLastName: 'Deer',
                    newEmail: 'jdeer@gmail.com',
                    newCredits: 450,
                    newIsAdmin: true
                };
            });

            it('should succeed (super user)', async () => {
                await setUserSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/api/clients/${data._id.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (admin user)', async () => {
                await setUserAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/api/clients/${data._id.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only super admins are authorized for this action');
            });

            it('should fail (normal user)', async () => {
                await setUserNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/api/clients/${data._id.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only super admins are authorized for this action');
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .patch(`/api/clients/${data._id.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .patch(`/api/clients/${data._id.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });

        describe('delete', () => {
            let data;
            beforeEach(async () => {
                data = {
                    _id: new ObjectId(),
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'jdoe@gmail.com',
                    credits: 350,
                    isAdmin: false
                };
                await collection.insertOne(data);
            });

            it('should succeed (super user)', async () => {
                await setUserSuper(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/api/clients/${data._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (admin user)', async () => {
                await setUserAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/api/clients/${data._id.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only super admins are authorized for this action');
            });

            it('should fail (normal user)', async () => {
                await setUserNormal(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/api/clients/${data._id.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only super admins are authorized for this action');
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .delete(`/api/clients/${data._id.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .delete(`/api/clients/${data._id.toString()}`);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });
    });

    describe('outfits', () => {
        let mongoClient;
        let db;
        let collection;
        beforeAll(async () => {
            mongoClient = new MongoClient(process.env.DB_URI);
            await mongoClient.connect();
            db = mongoClient.db(process.env.DB_NAME_TEST);
            collection = db.collection('outfits');

            await createUser(db);
            await createClient(db);
        });

        afterAll(async () => {
            await clearClients(db);
            await collection.deleteMany({ });
            await mongoClient.close();
        });

        describe('create', () => {
            let mockUploadToGCS;
            let data;
            beforeEach(async () => {
                mockUploadToGCS = jest.spyOn(helpers, 'uploadToGCS');
                mockUploadToGCS.mockResolvedValue('file.url');

                const categoryId = new ObjectId();
                await collection.insertOne({ _id: categoryId, name: 'Blazers', items: [] });

                data = {
                    fileSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==',
                    stageItemsStr: '{"stageItems":11.13}',
                    outfitName: 'Epic Party Outfit'
                };
            });

            it('should succeed (super user, super client)', async () => {
                await setUserSuper(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(201);
                expect(response.body.message).toBe('Success!');
                expect(mockUploadToGCS).toHaveBeenCalled();
            });

            it('should succeed (super user, admin client)', async () => {
                await setUserSuper(db);
                await setClientAdmin(db);

                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(201);
                expect(response.body.message).toBe('Success!');
                expect(mockUploadToGCS).toHaveBeenCalled();
            });

            it('should succeed (super user, normal client)', async () => {
                await setUserSuper(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(201);
                expect(response.body.message).toBe('Success!');
                expect(mockUploadToGCS).toHaveBeenCalled();
            });

            it('should fail (admin user, super client)', async () => {
                await setUserAdmin(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over super admins');
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail (admin user, admin client - other)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over other admins');
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should succeed (admin user, admin client - self)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                client._id = user._id;
                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(201);
                expect(response.body.message).toBe('Success!');
                expect(mockUploadToGCS).toHaveBeenCalled();
            });

            it('should succeed (admin user, normal client)', async () => {
                await setUserAdmin(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(201);
                expect(response.body.message).toBe('Success!');
                expect(mockUploadToGCS).toHaveBeenCalled();
            });

            it('should fail (normal user, super client)', async () => {
                await setUserNormal(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail (normal user, admin client)', async () => {
                await setUserNormal(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail (normal user, normal client - other)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail (normal user, normal client - same)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                client._id = user._id
                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .post(`/outfits/${client._id.toString()}`)
                    .field('fileSrc', data.fileSrc)
                    .field('stageItemsStr', data.stageItemsStr)
                    .field('outfitName', data.outfitName);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });
        });

        describe('read', () => {
            it('should succeed (super user, super client)', async () => {
                await setUserSuper(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should succeed (super user, admin client)', async () => {
                await setUserSuper(db);
                await setClientAdmin(db);

                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should succeed (super user, normal client)', async () => {
                await setUserSuper(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should fail (admin user, super client)', async () => {
                await setUserAdmin(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over super admins');
            });

            it('should fail (admin user, admin client - other)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over other admins');
            });

            it('should succeed (admin user, admin client - self)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                client._id = user._id;
                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should succeed (admin user, normal client)', async () => {
                await setUserAdmin(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should fail (normal user, super client)', async () => {
                await setUserNormal(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins have no permissions over any admins');
            });

            it('should fail (normal user, admin client)', async () => {
                await setUserNormal(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins have no permissions over any admins');
            });

            it('should fail (normal user, normal client - other)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins only have permissions over themselves');
            });

            it('should succeed (normal user, normal client - same)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                client._id = user._id
                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .get(`/outfits/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });

        describe('update full', () => {
            let mockUploadToGCS;
            let mockDeleteFromGCS;
            let outfitId;
            let patchData;
            beforeEach(async () => {
                mockUploadToGCS = jest.spyOn(helpers, 'uploadToGCS');
                mockUploadToGCS.mockResolvedValue('file.url');

                mockDeleteFromGCS = jest.spyOn(helpers, 'deleteFromGCS');
                mockDeleteFromGCS.mockResolvedValue();

                outfitId = new ObjectId();

                await collection.insertOne({ 
                    _id: outfitId,
                    clientId: client._id.toString(),
                    stageItems: { stageItems: 11.13 },
                    outfitName: 'Epic Party Outfit',
                    outfitUrl: 'outfit.url',
                    gcsDest: 'gcs/dest'
                });

                patchData = {
                    fileSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAD7AP8+AD8fAB9eAF99AH/0nKUYAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==',
                    stageItemsStr: '{"stageItems":{"anotherLayer":13.11}}',
                    outfitName: 'Formal Wedding Attire',
                    gcsDest: 'gcs/dest'
                };
            });

            it('should succeed (super user, super client)', async () => {
                await setUserSuper(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
                expect(mockDeleteFromGCS).toHaveBeenCalled();
                expect(mockUploadToGCS).toHaveBeenCalled();
            });

            it('should succeed (super user, admin client)', async () => {
                await setUserSuper(db);
                await setClientAdmin(db);

                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
                expect(mockDeleteFromGCS).toHaveBeenCalled();
                expect(mockUploadToGCS).toHaveBeenCalled();
            });

            it('should succeed (super user, normal client)', async () => {
                await setUserSuper(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
                expect(mockDeleteFromGCS).toHaveBeenCalled();
                expect(mockUploadToGCS).toHaveBeenCalled();
            });

            it('should fail (admin user, super client)', async () => {
                await setUserAdmin(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over super admins');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail (admin user, admin client - other)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over other admins');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should succeed (admin user, admin client - self)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                client._id = user._id;
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
                expect(mockDeleteFromGCS).toHaveBeenCalled();
                expect(mockUploadToGCS).toHaveBeenCalled();
            });

            it('should succeed (admin user, normal client)', async () => {
                await setUserAdmin(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
                expect(mockDeleteFromGCS).toHaveBeenCalled();
                expect(mockUploadToGCS).toHaveBeenCalled();
            });

            it('should fail (normal user, super client)', async () => {
                await setUserNormal(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail (normal user, admin client)', async () => {
                await setUserNormal(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail (normal user, normal client - other)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail (normal user, normal client - same)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                client._id = user._id
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/${client._id.toString()}/${outfitId.toString()}`)
                    .field('fileSrc', patchData.fileSrc)
                    .field('stageItemsStr', patchData.stageItemsStr)
                    .field('outfitName', patchData.outfitName)
                    .field('gcsDest', patchData.gcsDest);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
                expect(mockUploadToGCS).not.toHaveBeenCalled();
            });
        });

        describe('update partial', () => {
            let outfitId;
            let patchData;
            beforeEach(async () => {
                outfitId = new ObjectId();

                await collection.insertOne({ 
                    _id: outfitId,
                    clientId: client._id.toString(),
                    stageItems: { stageItems: 11.13 },
                    outfitName: 'Epic Party Outfit',
                    outfitUrl: 'outfit.url',
                    gcsDest: 'gcs/dest'
                });

                patchData = {
                    newName: 'Formal Wedding Attire'
                };
            });

            it('should succeed (super user, super client)', async () => {
                await setUserSuper(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (super user, admin client)', async () => {
                await setUserSuper(db);
                await setClientAdmin(db);

                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (super user, normal client)', async () => {
                await setUserSuper(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (admin user, super client)', async () => {
                await setUserAdmin(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over super admins');
            });

            it('should fail (admin user, admin client - other)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over other admins');
            });

            it('should succeed (admin user, admin client - self)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                client._id = user._id;
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (admin user, normal client)', async () => {
                await setUserAdmin(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (normal user, super client)', async () => {
                await setUserNormal(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, admin client)', async () => {
                await setUserNormal(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, normal client - other)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, normal client - same)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                client._id = user._id
                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .patch(`/outfits/name/${client._id.toString()}/${outfitId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });

        describe('delete', () => {
            let mockDeleteFromGCS;
            let outfitId;
            beforeEach(async () => {
                mockDeleteFromGCS = jest.spyOn(helpers, 'deleteFromGCS');
                mockDeleteFromGCS.mockResolvedValue();

                outfitId = new ObjectId();

                await collection.insertOne({ 
                    _id: outfitId,
                    clientId: client._id.toString(),
                    stageItems: { stageItems: 11.13 },
                    outfitName: 'Epic Party Outfit',
                    outfitUrl: 'outfit.url',
                    gcsDest: 'gcs/dest'
                });
            });

            it('should succeed (super user, super client)', async () => {
                await setUserSuper(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
                expect(mockDeleteFromGCS).toHaveBeenCalled();
            });

            it('should succeed (super user, admin client)', async () => {
                await setUserSuper(db);
                await setClientAdmin(db);

                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
                expect(mockDeleteFromGCS).toHaveBeenCalled();
            });

            it('should succeed (super user, normal client)', async () => {
                await setUserSuper(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
                expect(mockDeleteFromGCS).toHaveBeenCalled();
            });

            it('should fail (admin user, super client)', async () => {
                await setUserAdmin(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over super admins');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            });

            it('should fail (admin user, admin client - other)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over other admins');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            });

            it('should succeed (admin user, admin client - self)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                client._id = user._id;
                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
                expect(mockDeleteFromGCS).toHaveBeenCalled();
            });

            it('should succeed (admin user, normal client)', async () => {
                await setUserAdmin(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
                expect(mockDeleteFromGCS).toHaveBeenCalled();
            });

            it('should fail (normal user, super client)', async () => {
                await setUserNormal(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            });

            it('should fail (normal user, admin client)', async () => {
                await setUserNormal(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            });

            it('should fail (normal user, normal client - other)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            });

            it('should fail (normal user, normal client - same)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                client._id = user._id
                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .delete(`/outfits/${client._id.toString()}/${outfitId.toString()}`);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
                expect(mockDeleteFromGCS).not.toHaveBeenCalled();
            });
        });
    });

    describe('shopping', () => {
        let mongoClient;
        let db;
        let collection;
        beforeAll(async () => {
            mongoClient = new MongoClient(process.env.DB_URI);
            await mongoClient.connect();
            db = mongoClient.db(process.env.DB_NAME_TEST);
            collection = db.collection('shopping');

            await createUser(db);
            await createClient(db);
        });

        afterAll(async () => {
            await clearClients(db);
            await collection.deleteMany({ });
            await mongoClient.close();
        });

        describe('create', () => {
            let data;
            beforeEach(async () => {
                data = {
                    itemName: 'Cool New Shirt',
                    itemLink: 'cool-new-shirt.link',
                    imageLink: 'cool-new-shirt-image.link',
                    notes: 'Size: M, Color: Red'
                };
            });

            it('should succeed (super user, super client)', async () => {
                await setUserSuper(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(201);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (super user, admin client)', async () => {
                await setUserSuper(db);
                await setClientAdmin(db);

                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(201);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (super user, normal client)', async () => {
                await setUserSuper(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(201);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (admin user, super client)', async () => {
                await setUserAdmin(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over super admins');
            });

            it('should fail (admin user, admin client - other)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over other admins');
            });

            it('should succeed (admin user, admin client - self)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                client._id = user._id;
                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(201);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (admin user, normal client)', async () => {
                await setUserAdmin(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(201);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (normal user, super client)', async () => {
                await setUserNormal(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, admin client)', async () => {
                await setUserNormal(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, normal client - other)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, normal client - same)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                client._id = user._id
                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .post(`/shopping/${client._id.toString()}`)
                    .send(data);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });

        describe('read', () => {
            it('should succeed (super user, super client)', async () => {
                await setUserSuper(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should succeed (super user, admin client)', async () => {
                await setUserSuper(db);
                await setClientAdmin(db);

                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should succeed (super user, normal client)', async () => {
                await setUserSuper(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should fail (admin user, super client)', async () => {
                await setUserAdmin(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over super admins');
            });

            it('should fail (admin user, admin client - other)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over other admins');
            });

            it('should succeed (admin user, admin client - self)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                client._id = user._id;
                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should succeed (admin user, normal client)', async () => {
                await setUserAdmin(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should fail (normal user, super client)', async () => {
                await setUserNormal(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins have no permissions over any admins');
            });

            it('should fail (normal user, admin client)', async () => {
                await setUserNormal(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins have no permissions over any admins');
            });

            it('should fail (normal user, normal client - other)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins only have permissions over themselves');
            });

            it('should succeed (normal user, normal client - same)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                client._id = user._id
                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .get(`/shopping/${client._id.toString()}`);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });

        describe('update full', () => {
            let shoppingId;
            let patchData;
            beforeEach(async () => {
                shoppingId = new ObjectId();

                await collection.insertOne({ 
                    _id: shoppingId,
                    clientId: client._id.toString(),
                    itemName: 'Cool New Shirt',
                    itemLink: 'cool-new-shirt.link',
                    imageLink: 'cool-new-shirt-image.link',
                    notes: 'Size: M, Color: Red',
                    purchased: false
                });

                patchData = {
                    newItemName: 'Cool Shirt',
                    newItemLink: 'cool-shirt.link',
                    newImageLink: 'cool-shirt-image.link',
                    newNotes: 'Size: L, Color: Blue',
                    newPurchased: true
                };
            });

            it('should succeed (super user, super client)', async () => {
                await setUserSuper(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (super user, admin client)', async () => {
                await setUserSuper(db);
                await setClientAdmin(db);

                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (super user, normal client)', async () => {
                await setUserSuper(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (admin user, super client)', async () => {
                await setUserAdmin(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over super admins');
            });

            it('should fail (admin user, admin client - other)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over other admins');
            });

            it('should succeed (admin user, admin client - self)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                client._id = user._id;
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (admin user, normal client)', async () => {
                await setUserAdmin(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (normal user, super client)', async () => {
                await setUserNormal(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, admin client)', async () => {
                await setUserNormal(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, normal client - other)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, normal client - same)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                client._id = user._id
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });

        describe('update purchased', () => {
            let shoppingId;
            let patchData;
            beforeEach(async () => {
                shoppingId = new ObjectId();

                await collection.insertOne({ 
                    _id: shoppingId,
                    clientId: client._id.toString(),
                    itemName: 'Cool New Shirt',
                    itemLink: 'cool-new-shirt.link',
                    imageLink: 'cool-new-shirt-image.link',
                    notes: 'Size: M, Color: Red',
                    purchased: false
                });

                patchData = { newPurchased: true };
            });

            it('should succeed (super user, super client)', async () => {
                await setUserSuper(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (super user, admin client)', async () => {
                await setUserSuper(db);
                await setClientAdmin(db);

                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (super user, normal client)', async () => {
                await setUserSuper(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (admin user, super client)', async () => {
                await setUserAdmin(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over super admins');
            });

            it('should fail (admin user, admin client - other)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over other admins');
            });

            it('should succeed (admin user, admin client - self)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                client._id = user._id;
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (admin user, normal client)', async () => {
                await setUserAdmin(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (normal user, super client)', async () => {
                await setUserNormal(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins have no permissions over any admins');
            });

            it('should fail (normal user, admin client)', async () => {
                await setUserNormal(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins have no permissions over any admins');
            });

            it('should fail (normal user, normal client - other)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins only have permissions over themselves');
            });

            it('should succeed (normal user, normal client - same)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                client._id = user._id
                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .patch(`/shopping/purchased/${client._id.toString()}/${shoppingId.toString()}`)
                    .send(patchData);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });

        describe('delete', () => {
            let shoppingId;
            beforeEach(async () => {
                shoppingId = new ObjectId();

                await collection.insertOne({ 
                    _id: shoppingId,
                    clientId: client._id.toString(),
                    itemName: 'Cool New Shirt',
                    itemLink: 'cool-new-shirt.link',
                    imageLink: 'cool-new-shirt-image.link',
                    notes: 'Size: M, Color: Red',
                    purchased: false
                });
            });

            it('should succeed (super user, super client)', async () => {
                await setUserSuper(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (super user, admin client)', async () => {
                await setUserSuper(db);
                await setClientAdmin(db);

                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (super user, normal client)', async () => {
                await setUserSuper(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (admin user, super client)', async () => {
                await setUserAdmin(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over super admins');
            });

            it('should fail (admin user, admin client - other)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over other admins');
            });

            it('should succeed (admin user, admin client - self)', async () => {
                await setUserAdmin(db);
                await setClientAdmin(db);
                client._id = user._id;
                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should succeed (admin user, normal client)', async () => {
                await setUserAdmin(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Success!');
            });

            it('should fail (normal user, super client)', async () => {
                await setUserNormal(db);
                await setClientSuper(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, admin client)', async () => {
                await setUserNormal(db);
                await setClientAdmin(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, normal client - other)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail (normal user, normal client - same)', async () => {
                await setUserNormal(db);
                await setClientNormal(db);
                client._id = user._id
                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only admins are authorized for this action');
            });

            it('should fail with missing token', async () => {
                cookie = '';

                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('token required to authenticate JWT');
            });

            it('should fail with invalid token', async () => {
                cookie = invalidCookie;

                // perform action to test
                const response = await agent(app)
                    .delete(`/shopping/${client._id.toString()}/${shoppingId.toString()}`);

                // perform checks
                expect(response.status).toBe(500);
                expect(response.body.message).toBe('invalid signature');
            });
        });
    });
});