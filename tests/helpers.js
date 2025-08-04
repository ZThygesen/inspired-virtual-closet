import { jest } from '@jest/globals';
import { app } from '../server';
import { agent as supertest } from 'supertest';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const testHelpers = {
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

    async clearCollection(collectionToClear) {
        await collectionToClear.deleteMany({});
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
        await this.clearCollection(this.collection);
        await this.removeUser();
        await this.removeClient();
        jest.resetAllMocks();
        jest.restoreAllMocks();
    },

    agent() {
        return supertest(app).set('Cookie', this.cookie);
    },
};