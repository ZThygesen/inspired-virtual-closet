import { jest } from '@jest/globals';
import { app } from '../../server';
import { agent } from 'supertest';
import { MongoClient, ObjectId } from 'mongodb';

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
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await mongoClient.close();
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe('create', () => {
        let data;
        beforeEach(() => {
            data = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'jdoe@gmail.com',
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

            const client = await collection.findOne({ firstName: 'John', lastName: 'Doe' });
            expect(client).toBeTruthy();
            expect(client).toHaveProperty('_id');
            expect(client.firstName).toBe('John');
            expect(client.lastName).toBe('Doe');
            expect(client.email).toBe('jdoe@gmail.com');
            expect(client.isAdmin).toBe(false);
        });
        
        //TODO: CHECK FOR DUPLICATE INSERTION INTO DB

        // it('should fail with missing first name', async () => {
        //     data.firstName = '';

        //     const response = await agent(app)
        //         .post('/api/clients')
        //         .send(data);

        //     expect(response.status).toBe(400);
        //     expect(response.body.message).toBe('both first name and last name fields are required for client creation');
        //     await expect(collection.find({ }).toArray()).resolves.toHaveLength(0);
        // });

        // it('should fail with missing last name', async () => {
        //     delete data.lastName;

        //     const response = await agent(app)
        //         .post('/api/clients')
        //         .send(data);

        //     expect(response.status).toBe(400);
        //     expect(response.body.message).toBe('both first name and last name fields are required for client creation');
        //     await expect(collection.find({ }).toArray()).resolves.toHaveLength(0);
        // });

        // it('should fail with missing email', async () => {
        //     data.email = '';
        //     const response = await agent(app)
        //         .post('/api/clients')
        //         .send(data);

        //     expect(response.status).toBe(400);
        //     expect(response.body.message).toBe('an email is required for client creation');
        //     await expect(collection.find({ }).toArray()).resolves.toHaveLength(0);
        // });

        // it('should fail with missing admin status', async () => {
        //     delete data.isAdmin;
        //     const response = await agent(app)
        //         .post('/api/clients')
        //         .send(data);

        //     expect(response.status).toBe(400);
        //     expect(response.body.message).toBe('an admin status is required for client creation');
        //     await expect(collection.find({ }).toArray()).resolves.toHaveLength(0);
        // });
    });
    
    // describe('read', () => {
    //     let data;
    //     beforeEach(async () => {
    //         // insert mock data
    //         data = {
    //             _id: new ObjectId(),
    //             firstName: 'John',
    //             lastName: 'Doe',
    //             email: '',
    //             isAdmin: false
    //         };
    //         await collection.insertOne(data);
    //     });

    //     it('should get clients', async () => {
    //         // perform action to test
    //         const response = await agent(app)
    //             .get('/api/clients');
            
    //         // perform checks
    //         expect(response.status).toBe(200);
    //         expect(response.body).toHaveLength(1);

    //         const client = response.body[0];
    //         expect(client._id).toBe(data._id.toString());
    //         expect(client.firstName).toBe('John');
    //         expect(client.lastName).toBe('Doe');
    //         expect(client.email).toBe('');
    //         expect(client.isAdmin).toBe(false);
    //     });
    // });
    
    // describe('update', () => {
    //     let data;
    //     beforeEach(async () => {
    //         // insert mock data
    //         data = {
    //             _id: new ObjectId(),
    //             firstName: 'John',
    //             lastName: 'Doe',
    //             email: '',
    //             isAdmin: false
    //         };
    //         await collection.insertOne(data);
    //     });

    //     it('should update client', async () => {
    //         // perform action to test
    //         const patchData = {
    //             newFirstName: 'Jane',
    //             newLastName: 'Deer'
    //         };

    //         const response = await agent(app)
    //             .patch(`/api/clients/${data._id.toString()}`)
    //             .send(patchData);

    //         // perform checks
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         const client = await collection.findOne({ _id: data._id });
    //         expect(client).toBeTruthy();
    //         expect(client._id).toEqual(data._id);
    //         expect(client.firstName).toBe('Jane');
    //         expect(client.lastName).toBe('Deer');
    //         expect(client.email).toBe('');
    //         expect(client.isAdmin).toBe(false);
    //     });  
    // });

    // describe('delete', () => {
    //     let data;
    //     beforeEach(async () => {
    //         // insert mock data
    //         data = {
    //             _id: new ObjectId(),
    //             firstName: 'John',
    //             lastName: 'Doe',
    //             email: '',
    //             isAdmin: false
    //         };
    //         await collection.insertOne(data);
    //     });

    //     it('should delete client', async () => {
    //         // perform action to test
    //         const response = await agent(app)
    //             .delete(`/api/clients/${data._id.toString()}`);
            
    //         // perform checks
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Success!');

    //         const client = await collection.findOne({ _id: data._id });
    //         expect(client).toBeFalsy();
    //     });
    // });
});