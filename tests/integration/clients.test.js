import { jest } from '@jest/globals';
import { app } from '../../server';
import { agent as supertest } from 'supertest';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

describe('clients', () => {
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
        }

        const collection = db.collection('clients');
        await collection.insertOne(user);

        token = jwt.sign({ id: user._id, isAdmin: user.isAdmin, isSuperAdmin: user.isSuperAdmin }, process.env.JWT_SECRET);
        cookie = `token=${token}`;
        invalidToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin, isSuperAdmin: user.isSuperAdmin }, 'not-correct-secret');
        invalidCookie = `token=${invalidToken}`;
    }

    async function setNonSuperAdmin(db) {
        const collection = db.collection('clients');
        await collection.updateOne({ _id: user._id }, { $set: { isSuperAdmin: false } });
        token = jwt.sign({ id: user._id, isAdmin: true, isSuperAdmin: false }, process.env.JWT_SECRET);
        cookie = `token=${token}`;
    }

    async function setNonAdmin(db) {
        const collection = db.collection('clients');
        await collection.updateOne({ _id: user._id }, { $set: { isAdmin: false, isSuperAdmin: false } });
        token = jwt.sign({ id: user._id, isAdmin: false, isSuperAdmin: false }, process.env.JWT_SECRET);
        cookie = `token=${token}`;
    }

    async function clearCollection(collection) {
        await collection.deleteMany({});
    }

    let mongoClient;
    let db;
    let collection;

    beforeAll(async () => {
        mongoClient = new MongoClient(process.env.DB_URI);
        await mongoClient.connect();
        db = mongoClient.db(process.env.DB_NAME_TEST);
        collection = db.collection('clients');
    });

    afterAll(async () => {
        await mongoClient.close();
    });

    beforeEach(async () => {
        expect(process.env.NODE_ENV).toBe('test');

        await createUser(db);
    });

    afterEach(async () => {
        await clearCollection(collection);
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    function agent(app) {
        return supertest(app).set('Cookie', cookie);
    }

    describe('create', () => {
        let data;
        beforeEach(() => {
            data = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'jdoe@gmail.com',
                credits: 350,
                isAdmin: false
            };
        });

        it('should create new client', async () => {
            // perform action to test
            const response = await agent(app)
                .post('/api/clients')
                .send(data);
            
            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ firstName: 'John', lastName: 'Doe' });
            expect(client).toBeTruthy();
            expect(client).toHaveProperty('_id');
            expect(client.firstName).toBe(data.firstName);
            expect(client.lastName).toBe(data.lastName);
            expect(client.email).toBe(data.email);
            expect(client.credits).toBe(data.credits);
            expect(client.isAdmin).toBe(data.isAdmin);
        });

        it('should fail if user not super admin', async () => {
            await setNonSuperAdmin(db);

            const response = await agent(app)
                .post('/api/clients')
                .send(data);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('only super admins are authorized for this action');
            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
        });

        it('should fail if user not admin', async () => {
            await setNonAdmin(db);

            const response = await agent(app)
                .post('/api/clients')
                .send(data);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('only super admins are authorized for this action');
            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
        });

        it('should fail with missing token', async () => {
            cookie = '';

            const response = await agent(app)
                .post('/api/clients')
                .send(data);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('token required to authenticate JWT');
            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
        });

        it('should fail with invalid token', async () => {
            cookie = invalidCookie;

            const response = await agent(app)
                .post('/api/clients')
                .send(data);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('invalid signature');
            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
        });

        it('should fail with missing first name', async () => {
            data.firstName = '';

            const response = await agent(app)
                .post('/api/clients')
                .send(data);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('both first name and last name fields are required for client creation');
            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
        });

        it('should fail with missing last name', async () => {
            delete data.lastName;

            const response = await agent(app)
                .post('/api/clients')
                .send(data);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('both first name and last name fields are required for client creation');
            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
        });

        it('should fail with missing email', async () => {
            data.email = '';
            const response = await agent(app)
                .post('/api/clients')
                .send(data);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('an email is required for client creation');
            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
        });

        it('should fail with missing credits', async () => {
            delete data.credits;
            const response = await agent(app)
                .post('/api/clients')
                .send(data);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('credits missing or must be of type number to create client');
            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
        });

        it('should fail with invalid credits', async () => {
            data.credits = 'not a number';
            const response = await agent(app)
                .post('/api/clients')
                .send(data);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('credits missing or must be of type number to create client');
            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
        });

        it('should fail with missing admin status', async () => {
            delete data.isAdmin;
            const response = await agent(app)
                .post('/api/clients')
                .send(data);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('a role status is required for client creation');
            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
        });
    });
    
    describe('read', () => {        
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

        it('should get client', async () => {
            // perform action to test
            const response = await agent(app)
                .get('/api/clients');
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);

            const client = response.body[1];
            expect(client._id).toBe(data._id.toString());
            expect(client.firstName).toBe(data.firstName);
            expect(client.lastName).toBe(data.lastName);
            expect(client.email).toBe(data.email);
            expect(client.credits).toBe(data.credits);
            expect(client.isAdmin).toBe(data.isAdmin);
        });

        it('should get multiple clients', async () => {
            data._id = new ObjectId();
            await collection.insertOne(data);
            data._id = new ObjectId();
            await collection.insertOne(data);

            const response = await agent(app)
                .get('/api/clients');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(4);
        });

        it('should handle no clients', async () => {
            await clearCollection(collection);
            const response = await agent(app)
                .get('/api/clients');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(0);
        });

        it('should fail if not admin', async () => {
            await setNonAdmin(db);

            const response = await agent(app)
                .get('/api/clients');

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('only admins are authorized for this action');
        });

        it('should fail with missing token', async () => {
            cookie = '';

            const response = await agent(app)
                .get('/api/clients');

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('token required to authenticate JWT');
        });

        it('should fail with invalid token', async () => {
            cookie = invalidCookie;

            const response = await agent(app)
                .get('/api/clients');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('invalid signature');
        });
    });

    describe('read client', () => {        
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

        it('should get client', async () => {
            // perform action to test
            const response = await agent(app)
                .get(`/api/clients/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(200);

            const client = response.body;
            expect(client).toBeTruthy();
            expect(client._id.toString()).toBe(data._id.toString());
            expect(client.firstName).toBe(data.firstName);
            expect(client.lastName).toBe(data.lastName);
            expect(client.email).toBe(data.email);
            expect(client.credits).toBe(data.credits);
            expect(client.isAdmin).toBe(data.isAdmin);
        });

        it('should get client - non-admin', async () => {
            // perform action to test
            await setNonAdmin(db);

            const response = await agent(app)
                .get(`/api/clients/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(200);

            const client = response.body;
            expect(client).toBeTruthy();
            expect(client._id.toString()).toBe(data._id.toString());
            expect(client.firstName).toBe(data.firstName);
            expect(client.lastName).toBe(data.lastName);
            expect(client.email).toBe(data.email);
            expect(client.credits).toBe(data.credits);
            expect(client.isAdmin).toBe(data.isAdmin);
        });

        it('should fail with invalid id', async () => {
            const response = await agent(app)
                .get('/api/clients/not-valid-id');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to get client: invalid or missing client id');
        });

        it('should fail if client doesn\'t exist', async () => {
            await clearCollection(collection);
            const response = await agent(app)
                .get(`/api/clients/${data._id.toString()}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');
        });

        it('should fail with missing token', async () => {
            cookie = '';

            const response = await agent(app)
                .get('/api/clients');

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('token required to authenticate JWT');
        });

        it('should fail with invalid token', async () => {
            cookie = invalidCookie;

            const response = await agent(app)
                .get('/api/clients');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('invalid signature');
        });
    });
    
    describe('update', () => {
        let data;
        let patchData;
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

            patchData = {
                newFirstName: 'Jane',
                newLastName: 'Deer',
                newEmail: 'jdeer@gmail.com',
                newCredits: 450,
                newIsAdmin: true
            };
        });

        it('should update client', async () => {
            let client = await collection.findOne({ _id: data._id });
            expect(client).toBeTruthy();
            expect(client._id).toEqual(data._id);
            expect(client.firstName).toBe(data.firstName);
            expect(client.lastName).toBe(data.lastName);
            expect(client.email).toBe(data.email);
            expect(client.credits).toBe(data.credits);
            expect(client.isAdmin).toBe(data.isAdmin);

            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            client = await collection.findOne({ _id: data._id });
            expect(client).toBeTruthy();
            expect(client._id).toEqual(data._id);
            expect(client.firstName).toBe(patchData.newFirstName);
            expect(client.lastName).toBe(patchData.newLastName);
            expect(client.email).toBe(patchData.newEmail);
            expect(client.credits).toBe(patchData.newCredits);
            expect(client.isAdmin).toBe(patchData.newIsAdmin);
        }); 

        it('should fail if not super admin', async () => {
            await setNonSuperAdmin(db);

            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('only super admins are authorized for this action');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });  

        it('should fail if not admin', async () => {
            await setNonAdmin(db);

            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('only super admins are authorized for this action');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });  

        it('should fail with missing token', async () => {
            cookie = '';

            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('token required to authenticate JWT');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        }); 

        it('should fail with invalid token', async () => {
            cookie = invalidCookie;

            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('invalid signature');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        }); 

        it('should fail with invalid client id in request', async () => {
            const response = await agent(app)
                .patch(`/api/clients/not-valid-id`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update client: invalid or missing client id');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });  

        it('should fail if no client found', async () => {
            const response = await agent(app)
                .patch(`/api/clients/${(new ObjectId).toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('update failed: client not found with given client id or nothing was updated');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });

        it('should fail if no new updates', async () => {
            patchData.newFirstName = data.firstName;
            patchData.newLastName = data.lastName;
            patchData.newEmail = data.email;
            patchData.newCredits = data.credits;
            patchData.newIsAdmin = data.isAdmin;

            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('update failed: client not found with given client id or nothing was updated');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        }); 

        it('should fail with no first name', async () => {
            patchData.newFirstName = '';
            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('both first name and last name fields are required for client update');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });  

        it('should fail with no last name', async () => {
            patchData.newLastName = undefined;
            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('both first name and last name fields are required for client update');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });  

        it('should fail with no email', async () => {
            delete patchData.newEmail;
            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('an email is required for client update');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });

        it('should fail with missing credits', async () => {
            patchData.newCredits = null;
            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('credits missing or must be of type number to update client');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });

        it('should fail with invalid credits', async () => {
            patchData.newCredits = 'not a number';
            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('credits missing or must be of type number to update client');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });

        it('should fail with no role status', async () => {
            patchData.newIsAdmin = null;
            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('a role status is required for client update');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
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

        it('should delete client', async () => {
            // perform action to test
            const response = await agent(app)
                .delete(`/api/clients/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toBeFalsy();
        });

        it('should fail if not super admin', async () => {
            await setNonSuperAdmin(db);

            // perform action to test
            const response = await agent(app)
                .delete(`/api/clients/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('only super admins are authorized for this action');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });

        it('should fail if not admin', async () => {
            await setNonAdmin(db);

            // perform action to test
            const response = await agent(app)
                .delete(`/api/clients/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('only super admins are authorized for this action');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });

        it('should fail with missing token', async () => {
            cookie = '';

            // perform action to test
            const response = await agent(app)
                .delete(`/api/clients/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('token required to authenticate JWT');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });

        it('should fail with invalid token', async () => {
            cookie = invalidCookie;

            // perform action to test
            const response = await agent(app)
                .delete(`/api/clients/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('invalid signature');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });

        it('should fail with invalid client id in request', async () => {
            // perform action to test
            const response = await agent(app)
                .delete(`/api/clients/not-valid-id`);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to delete client: invalid or missing client id');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });

        it('should fail if no client found', async () => {
            // perform action to test
            const response = await agent(app)
                .delete(`/api/clients/${(new ObjectId).toString()}`);
            
            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('deletion failed: client not found with given client id');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
            const client = await collection.findOne({ _id: data._id });
            expect(client).toStrictEqual(data);
        });
    });
});