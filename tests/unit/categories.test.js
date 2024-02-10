import { app } from '../../server';
import { agent } from 'supertest';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';

describe('categories', () => {
    let mongoClient;
    let db;
    let collection;

    beforeAll(async () => {
        mongoClient = new MongoClient(process.env.DB_URI);
        await mongoClient.connect();
        db = mongoClient.db(process.env.DB_NAME_TEST);
        collection = db.collection('categories');
    });

    afterEach(async () => {
        await collection.deleteMany({ _id: { $ne: 0 } });
    });

    afterAll(async () => {
        await mongoClient.close();
    });

    describe('create', () => {
        it('should create new category', async () => {
            // perform action to test
            const data = {
                category: 'T-Shirts'
            };

            const response = await agent(app)
                .post('/categories')
                .send(data);
            
            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            const category = await collection.findOne({ name: data.category });
            expect(category).toBeTruthy();
            expect(category).toHaveProperty('_id');
            expect(category.name).toBe('T-Shirts');
            expect(category.items).toEqual([]);
        }); 
    });
    
    describe('read', () => {
        it('should get categories', async () => {
            // insert mock data
            const data = {
                _id: new ObjectId(),
                name: 'T-Shirts',
                items: []
            };
            await collection.insertOne(data);

            // perform action to test
            const response = await agent(app)
                .get('/categories');
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);

            const category = response.body[1];
            expect(category._id).toBe(data._id.toString());
            expect(category).not.toHaveProperty('items');
        });
    });
    
    describe('update', () => {
        it('should update category', async () => {
            // insert mock data
            const data = {
                _id: new ObjectId(),
                name: 'T-Shirts',
                items: []
            };
            await collection.insertOne(data);

            // perform action to test
            const patchData = {
                newName: 'Jeans'
            };

            const response = await agent(app)
                .patch(`/categories/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const category = await collection.findOne({ _id: data._id });
            expect(category).toBeTruthy();
            expect(category._id).toEqual(data._id);
            expect(category.name).toBe('Jeans');
            expect(category.items).toEqual([]);
        });  
    });

    describe('delete', () => {
        it('should delete client', async () => {
            // insert mock data
            const data = {
                _id: new ObjectId(),
                name: 'T-Shirts',
                items: []
            };
            await collection.insertOne(data);

            // perform action to test
            const response = await agent(app)
                .delete(`/categories/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const client = await collection.findOne({ _id: data._id });
            expect(client).toBeFalsy();
        });
    });
});