import { jest } from '@jest/globals';
import { app } from '../../server';
import { agent } from 'supertest';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers';

describe('categories', () => {
    async function clearCollection(collection) {
        await collection.deleteMany({ });
    }

    async function insertOther(collection) {
        await collection.insertOne({ _id: 0, name: 'Other', items: [] });
    }

    let mongoClient;
    let db;
    let collection;

    beforeAll(async () => {
        mongoClient = new MongoClient(process.env.DB_URI);
        await mongoClient.connect();
        db = mongoClient.db(process.env.DB_NAME_TEST);
        collection = db.collection('categories');
    });

    afterAll(async () => {
        await mongoClient.close();
    });

    afterEach(async () => {
        await clearCollection(collection);
        await insertOther(collection);
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe('create', () => {
        let data;
        beforeEach(() => {
            data = {
                category: 'T-Shirts'
            };
        });

        it('should create new category', async () => {
            const response = await agent(app)
                .post('/categories')
                .send(data);
            
            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);

            const category = await collection.findOne({ name: data.category });
            expect(category).toBeTruthy();
            expect(category).toHaveProperty('_id');
            expect(category.name).toBe('T-Shirts');
            expect(category.items).toEqual([]);
        }); 

        it('should fail with missing category name', async () => {
            data.category = '';
            const response = await agent(app)
                .post('/categories')
                .send(data);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('a category name is required for category creation');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(1);
            expect(categories[0]._id).toBe(0);
            expect(categories[0].name).toBe('Other');
        }); 

        it('should fail if duplicate category name', async () => {
            await collection.insertOne({ name: 'T-Shirts', items: [] });
            const response = await agent(app)
                .post('/categories')
                .send(data);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a category with the name "${data.category}" already exists`);
            await expect(collection.find({ }).toArray()).resolves.toHaveLength(2);
        }); 

        it('should fail if duplicate category name (Other case)', async () => {
            data.category = 'Other';
            const response = await agent(app)
                .post('/categories')
                .send(data);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a category with the name "${data.category}" already exists`);
            
            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(1);
            expect(categories[0]._id).toBe(0);
            expect(categories[0].name).toBe('Other');
        }); 
    });
    
    describe('read', () => {
        let data;
        beforeEach(async () => {
            data = {
                _id: new ObjectId(),
                name: 'T-Shirts',
                items: []
            };
            await collection.insertOne(data);
        });

        it('should get categories', async () => {
            // perform action to test
            const response = await agent(app)
                .get('/categories');
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);

            let category = response.body[0];
            expect(category._id).toBe(0);
            expect(category).not.toHaveProperty('items');

            category = response.body[1];
            expect(category._id).toBe(data._id.toString());
            expect(category).not.toHaveProperty('items');
        });

        it('should get multiple categories', async () => {
            data._id = new ObjectId();
            data.category = 'Blazers';
            await collection.insertOne(data);

            const response = await agent(app)
                .get('/categories');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(3);
        });

        it('should handle only Other category present', async () => {
            await clearCollection(collection);
            await insertOther(collection);

            const response = await agent(app)
                .get('/categories');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0]._id).toBe(0);
            expect(response.body[0].name).toBe('Other');
        });

        it('should fail if no categories return', async () => {
            await clearCollection(collection);

            const response = await agent(app)
                .get('/categories');
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('no categories were found on retrieval');
        });

        it('should fail Other category not present', async () => {
            await clearCollection(collection);
            await collection.insertOne(data);

            const response = await agent(app)
                .get('/categories');
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('the Other category is missing in categories retrieval');
        });
    });
    
    describe('update', () => {
        let data;
        let patchData;
        beforeEach(async () => {
            data = {
                _id: new ObjectId(),
                name: 'T-Shirts',
                items: []
            };
            await collection.insertOne(data);

            patchData = {
                newName: 'Jeans'
            };
        });

        it('should update category', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/categories/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const category = await collection.findOne({ _id: data._id });
            expect(category).toBeTruthy();
            expect(category._id).toEqual(data._id);
            expect(category.name).toBe(patchData.newName);
            expect(category.items).toEqual([]);
        });  

        it('should fail with invalid id in request', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/categories/not-valid-id`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update category: invalid or missing category id');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
            expect(categories[0]._id).toBe(0);
            expect(categories[0].name).toBe('Other');
            expect(categories[1]).toStrictEqual(data);
        }); 

        it('should fail if given Other category id in request', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/categories/0`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('invalid category id: cannot edit Other category');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
            expect(categories[0]._id).toBe(0);
            expect(categories[0].name).toBe('Other');
            expect(categories[1]).toStrictEqual(data);
        }); 

        it('should fail if missing category name', async () => {
            // perform action to test
            patchData.newName = '';
            const response = await agent(app)
                .patch(`/categories/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('category name is required for category update');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
            expect(categories[0]._id).toBe(0);
            expect(categories[0].name).toBe('Other');
            expect(categories[1]).toStrictEqual(data);
        });

        it('should fail if updating to category name that exists', async () => {
            // perform action to test
            await collection.insertOne({ _id: new ObjectId(), name: patchData.newName, items: [] });

            const response = await agent(app)
                .patch(`/categories/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a category with the name "${patchData.newName}" already exists`);

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(3);
            const category = await collection.findOne({ _id: data._id });
            expect(category).toStrictEqual(data);
        });

        it('should fail if updating to category name that exists (Other case)', async () => {
            // perform action to test
            patchData.newName = 'Other';
            const response = await agent(app)
                .patch(`/categories/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a category with the name "${patchData.newName}" already exists`);

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
            expect(categories[0]._id).toBe(0);
            expect(categories[0].name).toBe('Other');
            expect(categories[1]).toStrictEqual(data);
        });

        it('should fail if no new updates', async () => {
            // perform action to test
            patchData.newName = data.name;
            const response = await agent(app)
                .patch(`/categories/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a category with the name "${patchData.newName}" already exists`);

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
            expect(categories[0]._id).toBe(0);
            expect(categories[0].name).toBe('Other');
            expect(categories[1]).toStrictEqual(data);
        });

        it('should fail if category does not exist', async () => {
            // perform action to test
            const response = await agent(app)
                .patch(`/categories/${(new ObjectId()).toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('update failed: category not found with given category id');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
            expect(categories[0]._id).toBe(0);
            expect(categories[0].name).toBe('Other');
            expect(categories[1]).toStrictEqual(data);
        });
    });

    describe('delete', () => {
        let data;
        beforeEach(async () => {
            data = {
                _id: new ObjectId(),
                name: 'T-Shirts',
                items: [{ item: 1 }, { item: 2 }, { item: 3 }]
            };
            await collection.insertOne(data);
        });

        it('should delete category', async () => {
            let otherCategory = await collection.findOne({ _id: 0, name: 'Other' });
            expect(otherCategory.items).toHaveLength(0);

            let category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(3);
            expect(category.items).toEqual(data.items);

            // perform action to test
            const response = await agent(app)
                .delete(`/categories/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            category = await collection.findOne({ _id: data._id });
            expect(category).toBeFalsy();

            otherCategory = await collection.findOne({ _id: 0, name: 'Other' });
            expect(otherCategory.items).toHaveLength(3);
            expect(otherCategory.items).toEqual(data.items);
        });

        it('should delete category with no files to move', async () => {
            await clearCollection(collection);
            await insertOther(collection);
            await collection.insertOne({ _id: data._id, name: data.name, items: [] });

            let otherCategory = await collection.findOne({ _id: 0, name: 'Other' });
            expect(otherCategory.items).toHaveLength(0);

            let category = await collection.findOne({ _id: data._id });
            expect(category.items).toHaveLength(0);

            // perform action to test
            const response = await agent(app)
                .delete(`/categories/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            category = await collection.findOne({ _id: data._id });
            expect(category).toBeFalsy();

            otherCategory = await collection.findOne({ _id: 0, name: 'Other' });
            expect(otherCategory.items).toHaveLength(0);
        });

        it('should fail with invalid category id in request', async () => {
            // perform action to test
            const response = await agent(app)
                .delete(`/categories/not-valid-id`);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to delete category: invalid or missing category id');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
            expect(categories[0]._id).toBe(0);
            expect(categories[0].name).toBe('Other');
            expect(categories[1]).toStrictEqual(data);
        });

        it('should fail given Other category id', async () => {
            // perform action to test
            const response = await agent(app)
                .delete(`/categories/0`);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('invalid category id: cannot delete Other category');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
            expect(categories[0]._id).toBe(0);
            expect(categories[0].name).toBe('Other');
            expect(categories[1]).toStrictEqual(data);
        });

        it('should fail given category that doesn\'t exist', async () => {
            // perform action to test
            const response = await agent(app)
                .delete(`/categories/${(new ObjectId).toString()}`);
            
            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('category does not exist');

            const categories = await collection.find({ }).toArray();
            expect(categories).toHaveLength(2);
            expect(categories[0]._id).toBe(0);
            expect(categories[0].name).toBe('Other');
            expect(categories[1]).toStrictEqual(data);
        });
    });
});