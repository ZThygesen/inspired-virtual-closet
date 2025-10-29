import { jest } from '@jest/globals';
import { app } from '../../server';
import { agent as supertest } from 'supertest';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { testHelpers } from '../helpers';

export const integrationHelpers = {
    user: null,
    client: null,
    cookie: null,
    invalidCookie: null,
    mongoClient: null,
    db: null,
    collection: null,
    clientCollection: null,

    async createUser(_id = ObjectId()) {
        this.user = {
            _id: _id,
            firstName: 'Jane',
            lastName: 'Deer',
            email: 'janedeer11@gmail.com',
            credits: 350,
            isAdmin: true,
            isSuperAdmin: true,
        };
        const collection = this.db.collection('clients');
        await collection.insertOne(this.user);

        const token = jwt.sign({ 
            id: this.user._id, 
            isAdmin: this.user.isAdmin, 
            isSuperAdmin: this.user.isSuperAdmin, 
        }, process.env.JWT_SECRET);
        const invalidToken = jwt.sign({
            id: this.user._id, 
            isAdmin: this.user.isAdmin, 
            isSuperAdmin: this.user.isSuperAdmin,
        }, 'invalid-secret');
        
        this.cookie = `token=${token}`;
        this.invalidCookie = `token=${invalidToken}`;
    },

    async setUserAsClient() {
        const token = jwt.sign({
            id: this.client._id,
            isAdmin: this.client.isAdmin,
            isSuperAdmin: this.client.isSuperAdmin,
        }, process.env.JWT_SECRET);
        this.cookie = `token=${token}`;
    },

    async removeUser() {
        const collection = this.db.collection('clients');
        await collection.deleteOne({ _id: this.user._id });
    },

    async setUserSuper() {
        this.user.isAdmin = true;
        this.user.isSuperAdmin = true;
        const collection = this.db.collection('clients');
        await collection.updateOne({ _id: this.user._id }, { $set: { isAdmin: true, isSuperAdmin: true } });
        const token = jwt.sign({ id: this.user._id, isAdmin: true, isSuperAdmin: true }, process.env.JWT_SECRET);
        this.cookie = `token=${token}`;
    },

    async setUserAdmin() {
        this.user.isAdmin = true;
        this.user.isSuperAdmin = false;
        const collection = this.db.collection('clients');
        await collection.updateOne({ _id: this.user._id }, { $set: { isAdmin: true, isSuperAdmin: false } });
        const token = jwt.sign({ id: this.user._id, isAdmin: true, isSuperAdmin: false }, process.env.JWT_SECRET);
        this.cookie = `token=${token}`;
    },

    async setUserNormal() {
        this.user.isAdmin = false;
        this.user.isSuperAdmin = false;
        const collection = this.db.collection('clients');
        await collection.updateOne({ _id: this.user._id }, { $set: { isAdmin: false, isSuperAdmin: false } });
        const token = jwt.sign({ id: this.user._id, isAdmin: false, isSuperAdmin: false }, process.env.JWT_SECRET);
        this.cookie = `token=${token}`;
    },

    async createClient(isAdmin = false, isSuperAdmin = false) {
        this.client = {
            _id: ObjectId(),
            firstName: 'Jane',
            lastName: 'Deer',
            email: 'janedeer11@gmail.com',
            credits: 350,
            isAdmin: isAdmin,
            isSuperAdmin: isAdmin
        };

        const collection = this.db.collection('clients');
        await collection.insertOne(this.client);
    },

    async removeClient() {
        const collection = this.db.collection('clients');
        await collection.deleteOne({ _id: this.client._id });
    },

    async setClientSuper() {
        this.client.isAdmin = true;
        this.client.isSuperAdmin = true;
        const collection = this.db.collection('clients');
        await collection.updateOne({ _id: this.client._id }, { $set: { isAdmin: true, isSuperAdmin: true }});
    },

    async setClientAdmin() {
        this.client.isAdmin = true;
        this.client.isSuperAdmin = false;
        const collection = this.db.collection('clients');
        await collection.updateOne({ _id: this.client._id }, { $set: { isAdmin: true, isSuperAdmin: false }});
    },

    async setClientNormal() {
        this.client.isAdmin = false;
        this.client.isSuperAdmin = false;
        const collection = this.db.collection('clients');
        await collection.updateOne({ _id: this.client._id }, { $set: { isAdmin: false, isSuperAdmin: false }});
    },

    async clearCollection() {
        await this.collection.deleteMany({});
    },

    async clearClientCollection() {
        await this.clientCollection.deleteMany({});
    },

    async beforeAll(collectionToUse) {
        this.mongoClient = new MongoClient(process.env.DB_URI);
        await this.mongoClient.connect();
        this.db = this.mongoClient.db(process.env.DB_NAME_TEST);
        this.collection = this.db.collection(collectionToUse);
        this.clientCollection = this.db.collection('clients');
        await this.clearCollection();
        await this.clearClientCollection();
    },

    async afterAll() {
        await this.mongoClient.close();
    },

    async beforeEach() {
        expect(process.env.NODE_ENV).toBe('test');
        await this.createUser();
        await this.createClient();
    },

    async afterEach() {
        await this.clearCollection();
        await this.clearClientCollection();
        jest.resetAllMocks();
        jest.restoreAllMocks();
    },

    agent() {
        return supertest(app).set('Cookie', this.cookie);
    },

    executeRequest(method, path, params, body) {
        if (params.length) {
            path += '/' + params.join('/');
        }
        return this.agent()[method](path).send(body);
    },

    testParams(fields, request, body, paramsOrder, options = {}) {
        const { checkPermissions } = options;
        const resolveBody = typeof body === 'function' ? body : () => body;
        for (const [field, fieldData] of Object.entries(fields)) {
            // everything passed as a param gets interpolated as a string
            // this means all the "bad string data" passes, rendering testing it useless
            if (fieldData.type === 'string') {
                continue;
            }

            const badValues = testHelpers.generateBadData(fieldData, {
                isIntegrationParams: true,
            });
            badValues.forEach(async (value) => {
                const params = {};
                for (const [otherField, otherFieldData] of Object.entries(fields)) {
                    if (otherField !== field) {
                        const otherValue = testHelpers.generateGoodData(otherFieldData)[0];
                        params[otherField] = otherValue;
                    }
                }
                
                params[field] = value;
                const message = testHelpers.getErrorMessage(field, fieldData, value, {
                    isIntegrationParams: true, 
                    checkPermissions: checkPermissions,
                });
                it(`params: should fail with invalid ${field}: ${JSON.stringify(params)}: ${message}`, async () => {
                    const orderedParams = [];
                    paramsOrder.forEach(param => {
                        // typically a clientId in params gets passed through checkPermissions
                        // which needs a valid, existing client instead of a random id
                        if (param === 'clientId' && field !== 'clientId') {
                            orderedParams.push(this.client._id.toString());
                        }
                        else {
                            orderedParams.push(params[param]);
                        }
                    });
                    const response = await request(orderedParams, resolveBody());
                    expect(response.status).toBe(400);
                    expect(response.body.message).toMatch(message);
                });
            });
        }
    },

    testBody(fields, request, params) {
        const resolveParams = typeof params === 'function' ? params : () => params;
        for (const [field, fieldData] of Object.entries(fields)) {
            const badValues = testHelpers.generateBadData(fieldData);
            badValues.forEach((value) => {
                const body = {};
                for (const [otherField, otherFieldData] of Object.entries(fields)) {
                    if (otherField !== field) {
                        const otherValue = testHelpers.generateGoodData(otherFieldData)[0];
                        body[otherField] = otherValue;
                    }
                }
                body[field] = value;
                const message = testHelpers.getErrorMessage(field, fieldData, value, {});
                it(`body: should fail with invalid ${field}: ${JSON.stringify(body)}: ${message}`, async () => {
                    const response = await request(resolveParams(), body);
                    expect(response.status).toBe(400);
                    expect(response.body.message).toMatch(message);
                });
            });

            const body = {};
            for (const [otherField, otherFieldData] of Object.entries(fields)) {
                if (otherField !== field) {
                    const otherValue = testHelpers.generateGoodData(otherFieldData)[0];
                    body[otherField] = otherValue;
                }
            }
            if (fieldData.optional) {
                it(`body: should not fail due to missing ${field}: ${JSON.stringify(body)}`, async () => {
                    const response = await request(resolveParams(), body);
                    expect(response.body.message).not.toMatch(/field/);
                });
            }
            else {
                it(`body: should fail with missing ${field}: ${JSON.stringify(body)}`, async () => {
                    const response = await request(resolveParams(), body);
                    expect(response.status).toBe(400);
                    expect(response.body.message).toBe(`"${field}" is required`);
                });
            }
            
        }
    },

    testAuth(requirements, request, params, body, successStatus = 200) {
        const resolveParams = typeof params === 'function' ? params : () => params;
        const resolveBody = typeof body === 'function' ? body : () => body;
        const { noRequirements, superAdmin, admin, checkPermissions } = requirements;
        if (noRequirements) {
            it('auth: should succeed (super user)', async () => {
                await this.setUserSuper();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(successStatus);
            });
            it('auth: should succeed (admin user)', async () => {
                await this.setUserAdmin();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(successStatus);
            });
            it('auth: should succeed (normal user)', async () => {
                await this.setUserNormal();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(successStatus);
            });
        }
        if (superAdmin) {
            it('auth: should succeed (super user)', async () => {
                await this.setUserSuper();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(successStatus);
            });
            it('auth: should fail (admin user)', async () => {
                await this.setUserAdmin();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only super admins are authorized for this action')
            });
            it('auth: should fail (normal user)', async () => {
                await this.setUserNormal();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(401);
                expect(response.body.message).toBe('only super admins are authorized for this action')
            });
        }

        if (checkPermissions) {
            it('auth: should succeed (super user, super client)', async () => {
                await this.setUserSuper();
                await this.setClientSuper();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(successStatus);
            });
            it('auth: should succeed (super user, admin client)', async () => {
                await this.setUserSuper();
                await this.setClientAdmin();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(successStatus);
            });
            it('auth: should succeed (super user, normal client)', async () => {
                await this.setUserSuper();
                await this.setClientNormal();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(successStatus);
            });
            it('auth: should fail (admin user, super client)', async () => {
                await this.setUserAdmin();
                await this.setClientSuper();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over super admins');
            });
            it('auth: should fail (admin user, admin client: other)', async () => {
                await this.setUserAdmin();
                await this.setClientAdmin();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('admins have no permissions over other admins');
            });
            it('auth: should succeed (admin user, admin client: self)', async () => {
                await this.setUserAdmin();
                await this.setClientAdmin();
                await this.setUserAsClient();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(successStatus);
            });
            it('auth: should succeed (admin user, normal client)', async () => {
                await this.setUserAdmin();
                await this.setClientNormal();
                this.client._id = this.user._id;
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(successStatus);
            });
            it('auth: should fail (normal user, super client)', async () => {
                await this.setUserNormal();
                await this.setClientSuper();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins have no permissions over any admins');
            });
            it('auth: should fail (normal user, admin client)', async () => {
                await this.setUserNormal();
                await this.setClientAdmin();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins have no permissions over any admins');
            });
            it('auth: should fail (normal user, normal client: other)', async () => {
                await this.setUserNormal();
                await this.setClientNormal();
                const response = await request(resolveParams(), resolveBody());
                expect(response.status).toBe(403);
                expect(response.body.message).toBe('non-admins only have permissions over themselves');
            });
            it('auth: should succeed (normal user, normal client: self)', async () => {
                await this.setUserNormal();
                await this.setClientNormal();
                await this.setUserAsClient();
                const response = await request(resolveParams(), resolveBody());
                const success = (response.status === successStatus)
                    || (response.status === 403 && response.body.message === 'non-admins must remove background and crop image on file upload')
                expect(success).toBe(true);
            });
        }

        it('auth: should fail with missing token', async () => {
            this.cookie = '';
            const response = await request(resolveParams(), resolveBody());
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('token required to authenticate JWT');
        });
        it('auth: should fail with invalid token', async () => {
            this.cookie = this.invalidCookie;
            const response = await request(resolveParams(), resolveBody());
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('invalid signature');
        });
    }
};