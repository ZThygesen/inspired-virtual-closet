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
            const data = {
                firstName: 'John',
                lastName: 'Doe'
            };

            const response = await agent(app)
                .post('/api/clients')
                .send(data);
            
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            const client = await collection.findOne(data);
            expect(client).toBeTruthy();
            expect(client.firstName).toBe(data.firstName);
            expect(client.lastName).toBe(data.lastName);
            expect(client.email).toBe('');
            expect(client.isAdmin).toBe(false);
        }); 
    });
    
    describe('read', () => {
        it('should get clients', async () => {
            const data = {
                _id: ObjectId(),
                firstName: 'John',
                lastName: 'Doe',
                email: '',
                isAdmin: false
            };

            await collection.insertOne(data);
            const response = await agent(app)
                .get('/api/clients')
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);

            const client = response.body[0];
            expect(client._id).toBe(data._id.toString());
            expect(client.firstName).toBe(data.firstName);
            expect(client.lastName).toBe(data.lastName);
            expect(client.email).toBe(data.email);
            expect(client.isAdmin).toBe(data.isAdmin);
        });
    });
    
    describe('update', () => {
        it('should update client', async () => {
            const data = {
                _id: ObjectId(),
                firstName: 'John',
                lastName: 'Doe',
                email: '',
                isAdmin: false
            };
            await collection.insertOne(data);

            const patchData = {
                newFirstName: 'Jane',
                newLastName: 'Deer'
            };

            const response = await agent(app)
                .patch(`/api/clients/${data._id.toString()}`)
                .send(patchData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const client = await collection.findOne({ _id: data._id });
            expect(client).toBeTruthy();
            expect(client.firstName).toBe(patchData.newFirstName);
            expect(client.lastName).toBe(patchData.newLastName);
            expect(client.email).toBe('');
            expect(client.isAdmin).toBe(false);
        });  
    });

    describe('delete', () => {
        it('should delete client', async () => {
            const data = {
                _id: ObjectId(),
                firstName: 'John',
                lastName: 'Doe',
                email: '',
                isAdmin: false
            };
            await collection.insertOne(data);

            const response = await agent(app)
                .delete(`/api/clients/${data._id.toString()}`)
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const client = await collection.findOne({ _id: data._id });
            expect(client).toBeFalsy();
        });
    });
});



