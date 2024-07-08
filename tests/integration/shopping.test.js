import { jest } from '@jest/globals';
import { app } from '../../server';
import { agent as supertest } from 'supertest';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

describe('shopping', () => {
    let user;
    let token;
    let cookie;
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
    }

    async function removeUser(db) {
        const collection = db.collection('clients');

        await collection.deleteOne({ _id: user._id });
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
            isAdmin: false,
            isSuperAdmin: false
        };

        const collection = db.collection('clients');
        await collection.insertOne(client);
    }

    async function removeClient(db) {
        const collection = db.collection('clients');

        await collection.deleteOne({ _id: client._id });
    }

    async function clearCollection(collection) {
        await collection.deleteMany({});
    }

    let mongoClient;
    let db;
    let collection;
    let clientCollection;

    beforeAll(async () => {
        mongoClient = new MongoClient(process.env.DB_URI);
        await mongoClient.connect();
        db = mongoClient.db(process.env.DB_NAME_TEST);
        collection = db.collection('shopping');
        clientCollection = db.collection('clients')
    });

    afterAll(async () => {
        await mongoClient.close();
    });

    beforeEach(async () => {
        expect(process.env.NODE_ENV).toBe('test');

        await createUser(db);
        await createClient(db);
    });

    afterEach(async () => {
        await clearCollection(collection);
        await removeUser(db);
        await removeClient(db);

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
                itemName: 'Cool New Shirt',
                itemLink: 'cool-new-shirt.link',
                imageLink: 'cool-new-shirt-image.link',
                notes: 'Size: M, Color: Red'
            };
        });

        it('should create new shopping item', async () => {
            // perform action to test
            const response = await agent(app)
                .post(`/shopping/${clientId.toString()}`)
                .send(data);
            
            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
            const shoppingItem = await collection.findOne({ itemName: 'Cool New Shirt' });
            expect(shoppingItem).toBeTruthy();
            expect(shoppingItem).toHaveProperty('_id');
            expect(shoppingItem.clientId).toBe(clientId.toString());
            expect(shoppingItem.itemName).toBe(data.itemName);
            expect(shoppingItem.itemLink).toBe(data.itemLink);
            expect(shoppingItem.imageLink).toBe(data.imageLink);
            expect(shoppingItem.notes).toBe(data.notes);
            expect(shoppingItem.purchased).toBe(false);
        });

        it('should create new shopping item (no notes)', async () => {
            // perform action to test
            data.notes = '';

            const response = await agent(app)
                .post(`/shopping/${clientId.toString()}`)
                .send(data);
            
            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(1);
            const shoppingItem = await collection.findOne({ itemName: 'Cool New Shirt' });
            expect(shoppingItem).toBeTruthy();
            expect(shoppingItem).toHaveProperty('_id');
            expect(shoppingItem.clientId).toBe(clientId.toString());
            expect(shoppingItem.itemName).toBe(data.itemName);
            expect(shoppingItem.itemLink).toBe(data.itemLink);
            expect(shoppingItem.imageLink).toBe(data.imageLink);
            expect(shoppingItem.notes).toBe('None');
            expect(shoppingItem.purchased).toBe(false);
        });

        it('should fail with missing item name', async () => {
            // perform action to test
            data.itemName = '';

            const response = await agent(app)
                .post(`/shopping/${clientId.toString()}`)
                .send(data);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('item name is required to create shopping item');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(0);
        });

        it('should fail with missing item link', async () => {
            // perform action to test
            data.itemLink = undefined;

            const response = await agent(app)
                .post(`/shopping/${clientId.toString()}`)
                .send(data);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('item link is required to create shopping item');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(0);
        });

        it('should fail with missing image link', async () => {
            // perform action to test
            delete data.imageLink;

            const response = await agent(app)
                .post(`/shopping/${clientId.toString()}`)
                .send(data);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('image link is required to create shopping item');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(0);
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            const response = await agent(app)
                .post(`/shopping/not-valid-id`)
                .send(data);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('client id is invalid or missing');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(0);
        });

        it('should fail if client doesn\'t exist', async () => {
            // perform action to test
            await removeClient(db);
            const response = await agent(app)
                .post(`/shopping/${clientId.toString()}`)
                .send(data);
            
            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');

            await expect(collection.find({ }).toArray()).resolves.toHaveLength(0);
        });
    });
    
    describe('read', () => {        
        let data;
        beforeEach(async () => {
            data = {
                _id: new ObjectId(),
                clientId: clientId.toString(),
                itemName: 'Cool New Shirt',
                itemLink: 'cool-new-shirt.link',
                imageLink: 'cool-new-shirt-image.link',
                notes: 'Size: M, Color: Red',
                purchased: false
            };
            await collection.insertOne(data);
        });

        it('should get shopping item', async () => {
            // perform action to test
            const response = await agent(app)
                .get(`/shopping/${data.clientId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);

            const shoppingItem = response.body[0];
            expect(shoppingItem._id).toBe(data._id.toString());
            expect(shoppingItem.clientId).toBe(data.clientId);
            expect(shoppingItem.itemName).toBe(data.itemName);
            expect(shoppingItem.itemLink).toBe(data.itemLink);
            expect(shoppingItem.imageLink).toBe(data.imageLink);
            expect(shoppingItem.notes).toBe(data.notes);
            expect(shoppingItem.purchased).toBe(data.purchased);
        });

        it('should handle multiple shopping items', async () => {
            // perform action to test
            data._id = new ObjectId();
            await collection.insertOne(data);

            const response = await agent(app)
                .get(`/shopping/${data.clientId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
        });

        it('should handle no shopping items', async () => {
            // perform action to test
            await clearCollection(collection);

            const response = await agent(app)
                .get(`/shopping/${data.clientId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(0);
        });

        it('should only return client\'s shopping items', async () => {
            // perform action to test
            const otherShoppingItem = { ...data };
            const otherClient = { ...client };

            otherShoppingItem._id = new ObjectId();
            otherShoppingItem.clientId = (new ObjectId()).toString();
            otherClient._id = ObjectId(otherShoppingItem.clientId);

            await collection.insertOne(otherShoppingItem);
            await clientCollection.insertOne(otherClient);

            let response = await agent(app)
                .get(`/shopping/${data.clientId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);

            let shoppingItem = response.body[0];
            expect(shoppingItem._id.toString()).toBe(data._id.toString());
            expect(shoppingItem.clientId).toBe(data.clientId);


            response = await agent(app)
                .get(`/shopping/${otherShoppingItem.clientId}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);

            shoppingItem = response.body[0];
            expect(shoppingItem._id.toString()).toBe(otherShoppingItem._id.toString());
            expect(shoppingItem.clientId).toBe(otherShoppingItem.clientId);
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            const response = await agent(app)
                .get(`/shopping/not-valid-id`);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('client id is invalid or missing');
        });

        it('should fail if client doesn\'t exist', async () => {
            // perform action to test
            await removeClient(db);
            const response = await agent(app)
                .get(`/shopping/${data.clientId}`);
            
            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');
        });
    });
    
    describe('update full', () => {
        let data;
        let patchData;
        beforeEach(async () => {
            data = {
                _id: new ObjectId(),
                clientId: clientId.toString(),
                itemName: 'Cool New Shirt',
                itemLink: 'cool-new-shirt.link',
                imageLink: 'cool-new-shirt-image.link',
                notes: 'Size: M, Color: Red',
                purchased: false
            };
            await collection.insertOne(data);

            patchData = {
                newItemName: 'Cool Shirt',
                newItemLink: 'cool-shirt.link',
                newImageLink: 'cool-shirt-image.link',
                newNotes: 'Size: L, Color: Blue',
                newPurchased: true
            };
        });

        it('should update shopping item', async () => {
            const response = await agent(app)
                .patch(`/shopping/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toBeTruthy();
            expect(shoppingItem._id).toEqual(data._id);
            expect(shoppingItem.clientId).toBe(data.clientId);
            expect(shoppingItem.itemName).toBe(patchData.newItemName);
            expect(shoppingItem.itemLink).toBe(patchData.newItemLink);
            expect(shoppingItem.imageLink).toBe(patchData.newImageLink);
            expect(shoppingItem.notes).toBe(patchData.newNotes);
            expect(shoppingItem.purchased).toBe(patchData.newPurchased);
        }); 

        it('should update shopping item (no notes)', async () => {
            patchData.newNotes = '';
            const response = await agent(app)
                .patch(`/shopping/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toBeTruthy();
            expect(shoppingItem._id).toEqual(data._id);
            expect(shoppingItem.clientId).toBe(data.clientId);
            expect(shoppingItem.itemName).toBe(patchData.newItemName);
            expect(shoppingItem.itemLink).toBe(patchData.newItemLink);
            expect(shoppingItem.imageLink).toBe(patchData.newImageLink);
            expect(shoppingItem.notes).toBe('None');
            expect(shoppingItem.purchased).toBe(patchData.newPurchased);
        }); 

        it('should fail if no new update', async () => {
            patchData.newItemName = data.itemName;
            patchData.newItemLink = data.itemLink;
            patchData.newImageLink = data.imageLink;
            patchData.newNotes = data.notes;
            patchData.newPurchased = data.purchased;

            const response = await agent(app)
                .patch(`/shopping/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('update failed: shopping item not updated');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 

        it('should fail with missing item name', async () => {
            delete patchData.newItemName;

            const response = await agent(app)
                .patch(`/shopping/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('item name is required to update shopping item');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 

        it('should fail with missing item link', async () => {
            patchData.newItemLink = '';

            const response = await agent(app)
                .patch(`/shopping/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('item link is required to update shopping item');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 

        it('should fail with missing image link', async () => {
            patchData.newImageLink = null;

            const response = await agent(app)
                .patch(`/shopping/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('image link is required to update shopping item');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 

        it('should fail with missing purchased status', async () => {
            patchData.newPurchased = undefined;

            const response = await agent(app)
                .patch(`/shopping/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('purchased status is required to update shopping item');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 

        it('should fail with invalid shopping id', async () => {
            const response = await agent(app)
                .patch(`/shopping/${data.clientId}/not-valid-id`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update shopping item: invalid or missing shopping id');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 

        it('should fail if shopping item doesn\'t exist', async () => {
            await clearCollection(collection);

            const response = await agent(app)
                .patch(`/shopping/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('update failed: shopping item not updated');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toBeFalsy();
        });

        it('should fail with invalid client id', async () => {
            const response = await agent(app)
                .patch(`/shopping/not-valid-id/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('client id is invalid or missing');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 

        it('should fail if client doesn\'t exist', async () => {
            await removeClient(db);
            const response = await agent(app)
                .patch(`/shopping/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 
    });

    describe('update purchased', () => {
        let data;
        let patchData;
        beforeEach(async () => {
            data = {
                _id: new ObjectId(),
                clientId: clientId.toString(),
                itemName: 'Cool New Shirt',
                itemLink: 'cool-new-shirt.link',
                imageLink: 'cool-new-shirt-image.link',
                notes: 'Size: M, Color: Red',
                purchased: false
            };
            await collection.insertOne(data);

            patchData = { newPurchased: true };
        });

        it('should update shopping item', async () => {
            const response = await agent(app)
                .patch(`/shopping/purchased/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toBeTruthy();
            expect(shoppingItem._id).toEqual(data._id);
            expect(shoppingItem.clientId).toBe(data.clientId);
            expect(shoppingItem.itemName).toBe(data.itemName);
            expect(shoppingItem.itemLink).toBe(data.itemLink);
            expect(shoppingItem.imageLink).toBe(data.imageLink);
            expect(shoppingItem.notes).toBe(data.notes);
            expect(shoppingItem.purchased).toBe(patchData.newPurchased);
        }); 

        it('should fail if no new update', async () => {
            patchData.newPurchased = data.purchased;

            const response = await agent(app)
                .patch(`/shopping/purchased/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('update failed: shopping item purchased status not updated');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 

        it('should fail with missing purchased status', async () => {
            patchData.newPurchased = undefined;

            const response = await agent(app)
                .patch(`/shopping/purchased/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('purchased status is required to update shopping item');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 

        it('should fail with invalid shopping id', async () => {
            const response = await agent(app)
                .patch(`/shopping/purchased/${data.clientId}/not-valid-id`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to update shopping item purchased status: invalid or missing shopping id');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 

        it('should fail if shopping item doesn\'t exist', async () => {
            await clearCollection(collection);

            const response = await agent(app)
                .patch(`/shopping/purchased/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('update failed: shopping item purchased status not updated');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toBeFalsy();
        });

        it('should fail with invalid client id', async () => {
            const response = await agent(app)
                .patch(`/shopping/purchased/not-valid-id/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('client id is invalid or missing');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 

        it('should fail if client doesn\'t exist', async () => {
            await removeClient(db);
            const response = await agent(app)
                .patch(`/shopping/purchased/${data.clientId}/${data._id.toString()}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toStrictEqual(data);
        }); 
    });

    describe('delete', () => {
        let data;
        beforeEach(async () => {
            data = {
                _id: new ObjectId(),
                clientId: clientId.toString(),
                itemName: 'Cool New Shirt',
                itemLink: 'cool-new-shirt.link',
                imageLink: 'cool-new-shirt-image.link',
                notes: 'Size: M, Color: Red',
                purchased: false
            };
            await collection.insertOne(data);
        });

        it('should delete shopping item', async () => {
            // perform action to test
            const response = await agent(app)
                .delete(`/shopping/${data.clientId}/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toBeFalsy();
        });

        it('should fail with invalid shopping id', async () => {
            // perform action to test
            const response = await agent(app)
                .delete(`/shopping/${data.clientId}/not-valid-id`);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('failed to delete shopping item: invalid or missing shopping id');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toBeTruthy();
        });

        it('should fail if shopping item doesn\'t exist', async () => {
            // perform action to test
            await clearCollection(collection);
            const response = await agent(app)
                .delete(`/shopping/${data.clientId}/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('deletion failed: shopping item not deleted');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toBeFalsy();
        });

        it('should fail with invalid client id', async () => {
            // perform action to test
            const response = await agent(app)
                .delete(`/shopping/not-valid-id/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('client id is invalid or missing');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toBeTruthy();
        });

        it('should fail if client doesn\'t exist', async () => {
            // perform action to test
            await removeClient(db);
            const response = await agent(app)
                .delete(`/shopping/${data.clientId}/${data._id.toString()}`);
            
            // perform checks
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('client not found');

            const shoppingItem = await collection.findOne({ _id: data._id });
            expect(shoppingItem).toBeTruthy();
        });
    });
});