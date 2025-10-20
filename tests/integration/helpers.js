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
    mongoClient: null,
    db: null,
    collection: null,
    clientCollection: null,

    async createUser() {
        this.user = {
            _id: ObjectId(),
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
            isSuperAdmin: this.user.isSuperAdmin 
        }, process.env.JWT_SECRET);
        
        this.cookie = `token=${token}`;
    },

    async removeUser() {
        const collection = this.db.collection('clients');
        await collection.deleteOne({ _id: this.user._id });
    },

    async createClient() {
        this.client = {
            _id: ObjectId(),
            firstName: 'Jane',
            lastName: 'Deer',
            email: 'janedeer11@gmail.com',
            credits: 350,
            isAdmin: false,
            isSuperAdmin: false
        };

        const collection = this.db.collection('clients');
        await collection.insertOne(this.client);
    },

    async removeClient() {
        const collection = this.db.collection('clients');
        await collection.deleteOne({ _id: this.client._id });
    },

    async clearCollection() {
        await this.collection.deleteMany({});
    },

    async beforeAll(collectionToUse) {
        this.mongoClient = new MongoClient(process.env.DB_URI);
        await this.mongoClient.connect();
        this.db = this.mongoClient.db(process.env.DB_NAME_TEST);
        this.collection = this.db.collection(collectionToUse);
        this.clientCollection = this.db.collection('clients');
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
        await this.removeUser();
        await this.removeClient();
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

    testParams(fields, request, body, paramsOrder) {
        const resolveBody = typeof body === 'function' ? body : () => body;
        for (const [field, fieldData] of Object.entries(fields)) {
            const badValues = testHelpers.generateBadData(fieldData, true);
            badValues.forEach((value) => {
                const params = {};
                for (const [otherField, otherFieldData] of Object.entries(fields)) {
                    if (otherField !== field) {
                        const otherValue = testHelpers.generateGoodData(otherFieldData)[0];
                        params[otherField] = otherValue;
                    }
                }
                params[field] = value;
                const orderedParams = [];
                paramsOrder.forEach(param => {
                    orderedParams.push(params[param]);
                });
                const message = testHelpers.getErrorMessage(field, fieldData, value, true);
                it(`params: should fail with invalid ${field}: ${JSON.stringify(orderedParams)}: ${message}`, async () => {
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
                const message = testHelpers.getErrorMessage(field, fieldData, value);
                it(`body: should fail with invalid ${field}: ${JSON.stringify(body)}: ${message}`, async () => {
                    const response = await request(resolveParams(), body);
                    expect(response.status).toBe(400);
                    expect(response.body.message).toMatch(message);
                });
            });
        }
    },
};