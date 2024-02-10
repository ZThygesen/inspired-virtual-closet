import { app } from '../../server';
import { agent } from 'supertest';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';

describe('clients', () => {
    let mongoClient;
    let db;
    let collection;

    beforeAll(async () => {
        mongoClient = new MongoClient(process.env.DB_URI);
        await mongoClient.connect();
        db = mongoClient.db(process.env.DB_NAME_TEST);
        collection = db.collection('clients');
    });

    afterEach(async () => {
        await collection.deleteMany({});
    });

    afterAll(async () => {
        await mongoClient.close();
    });

    describe('create', () => {
        it('should create new client', async () => {
            // perform action to test
            const data = {
                firstName: 'John',
                lastName: 'Doe'
            };

            const response = await agent(app)
                .post('/api/clients')
                .send(data);
            
            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            const client = await collection.findOne({ firstName: 'John', lastName: 'Doe' });
            expect(client).toBeTruthy();
            expect(client).toHaveProperty('_id');
            expect(client.firstName).toBe('John');
            expect(client.lastName).toBe('Doe');
            expect(client.email).toBe('');
            expect(client.isAdmin).toBe(false);
        }); 
    });
    
    describe('read', () => {
        it('should get clients', async () => {
            // insert mock data
            const data = {
                _id: new ObjectId(),
                firstName: 'John',
                lastName: 'Doe',
                email: '',
                isAdmin: false
            };
            await collection.insertOne(data);

            // perform action to test
            const response = await agent(app)
                .get('/api/clients');
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);

            const client = response.body[0];
            expect(client._id).toBe(data._id.toString());
            expect(client.firstName).toBe('John');
            expect(client.lastName).toBe('Doe');
            expect(client.email).toBe('');
            expect(client.isAdmin).toBe(false);
        });
    });
    
    describe('update', () => {
        it('should update client', async () => {
            // insert mock data
            const data = {
                _id: ObjectId(),
                firstName: 'John',
                lastName: 'Doe',
                email: '',
                isAdmin: false
            };
            await collection.insertOne(data);

            // perform action to test
            const patchData = {
                newFirstName: 'Jane',
                newLastName: 'Deer'
            };

            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const client = await collection.findOne({ _id: data._id });
            expect(client).toBeTruthy();
            expect(client._id).toEqual(data._id);
            expect(client.firstName).toBe('Jane');
            expect(client.lastName).toBe('Deer');
            expect(client.email).toBe('');
            expect(client.isAdmin).toBe(false);
        });  
    });

    describe('delete', () => {
        it('should delete client', async () => {
            // insert mock data
            const data = {
                _id: ObjectId(),
                firstName: 'John',
                lastName: 'Doe',
                email: '',
                isAdmin: false
            };
            await collection.insertOne(data);

            // perform action to test
            const response = await agent(app)
                .delete(`/api/clients/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const client = await collection.findOne({ _id: data._id });
            expect(client).toBeFalsy();
        });
    });
});