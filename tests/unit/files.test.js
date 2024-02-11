import { jest } from '@jest/globals';
import { app, server } from '../../server';
import { agent } from 'supertest';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers';
import { createId } from '@paralleldrive/cuid2';
import { io } from 'socket.io-client';

describe('files', () => {
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
        await collection.updateOne(
            { _id: 0 },
            { $set: { items: [] } }
        );
    });

    afterAll(async () => {
        await mongoClient.close();
    });

    describe('create', () => {
        let socket;

        beforeAll(() => {
            socket = io(`http://localhost:${server.address().port}`);
        });

        afterAll(() => {
            socket.close();
        });

        it('should add new file', async () => {
            // create mock function implementations    
            const uploadMock = jest.spyOn(helpers, 'uploadToGCF');
            uploadMock.mockImplementation(() => { 
                return {
                    fullFileUrl: 'full.file.url', 
                    smallFileUrl: 'small.file.url' 
                }
            });
            
            // insert mock data
            const categoryData = {
                _id: new ObjectId(),
                name: 'Blazers',
                items: []
            };
            await collection.insertOne(categoryData);

            // perform action to test
            const clientId = new ObjectId().toString();
            const requestId = createId();
            const response = await agent(app)
                .post('/files')
                .field('fileSrc', 'data:image/png;base64,fileSrc=')
                .field('fullFileName', 'Blazin Blazer.png')
                .field('clientId', clientId)
                .field('categoryId', categoryData._id.toString())
                .field('requestId', requestId);

            const uploadComplete = new Promise((resolve) => {
                socket.on('uploadComplete', ({ requestId }) => {
                    resolve(requestId);
                });
            });

            const reqId = await uploadComplete;
            expect(reqId).toBe(requestId);
    
            // perform checks
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            expect(uploadMock).toHaveBeenCalled();
    
            const category = await collection.findOne({ _id: categoryData._id });
            expect(category.items).toHaveLength(1);

            const file = category.items[0];
            expect(file).toBeTruthy();
            expect(file.clientId).toBe(clientId);
            expect(file.fileName).toBe('Blazin Blazer');
            expect(file.fullFileUrl).toBe('full.file.url');
            expect(file.smallFileUrl).toBe('small.file.url');
            expect(file.fullGcsDest).toEqual(expect.stringMatching(/dev\/items.*full\.png/));
            expect(file.smallGcsDest).toEqual(expect.stringMatching(/dev\/items.*small\.png/));
            expect(file).toHaveProperty('gcsId');
        
            // restore mocks
            uploadMock.mockRestore();
        });
    });
    
    describe('read', () => {
        it('should get files', async () => {
            // insert mock data
            const fileId = createId();
            const fileData = {
                clientId: new ObjectId().toString(),
                fileName: 'Blazin Blazer',
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url',
                fullGcsDest: 'dev/items/full.png',
                smallGcsDest: 'dev/items/small.png',
                gcsId: fileId
            };

            const categoryData = {
                _id: new ObjectId(),
                name: 'Blazers',
                items: [fileData]
            };
            await collection.insertOne(categoryData);

            // perform action to test
            const response = await agent(app)
                .get(`/files/${fileData.clientId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            
            const files = response.body[1].items;
            expect(files).toHaveLength(1);

            const file = files[0];
            expect(file).toBeTruthy();
            expect(file.clientId).toBe(fileData.clientId);
            expect(file.fileName).toBe('Blazin Blazer');
            expect(file.fullFileUrl).toBe('full.file.url');
            expect(file.smallFileUrl).toBe('small.file.url');
            expect(file.fullGcsDest).toBe('dev/items/full.png');
            expect(file.smallGcsDest).toBe('dev/items/small.png');
            expect(file.gcsId).toBe(fileId);
        });
    });
    
    describe('update', () => {
        it('should update file name', async () => {
            // insert mock data
            const fileId = createId();
            const fileData = {
                clientId: new ObjectId().toString(),
                fileName: 'Blazin Blazer',
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url',
                fullGcsDest: 'dev/items/full.png',
                smallGcsDest: 'dev/items/small.png',
                gcsId: fileId
            };

            const categoryData = {
                _id: new ObjectId(),
                name: 'Blazers',
                items: [fileData]
            };
            await collection.insertOne(categoryData);

            // perform action to test
            const patchData = {
                newName: 'Dressy Dress'
            };

            const response = await agent(app)
                .patch(`/files/${categoryData._id.toString()}/${fileData.gcsId}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const category = await collection.findOne({ _id: categoryData._id });
            expect(category.items).toHaveLength(1);

            const file = category.items[0];
            expect(file).toBeTruthy();
            expect(file.clientId).toBe(fileData.clientId);
            expect(file.fileName).toBe('Dressy Dress');
            expect(file.fullFileUrl).toBe('full.file.url');
            expect(file.smallFileUrl).toBe('small.file.url');
            expect(file.fullGcsDest).toBe('dev/items/full.png');
            expect(file.smallGcsDest).toBe('dev/items/small.png');
            expect(file.gcsId).toBe(fileId);
        });  

        it('should update file category', async () => {
            // insert mock data
            const fileId = createId();
            const fileData = {
                clientId: new ObjectId().toString(),
                fileName: 'Blazin Blazer',
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url',
                fullGcsDest: 'dev/items/full.png',
                smallGcsDest: 'dev/items/small.png',
                gcsId: fileId
            };

            const categoryData1 = {
                _id: new ObjectId(),
                name: 'Blazers',
                items: [fileData]
            };

            const categoryData2 = {
                _id: new ObjectId(),
                name: 'T-Shirts',
                items: []
            };
            await collection.insertOne(categoryData1);
            await collection.insertOne(categoryData2);

            // perform action to test
            const patchData = {
                newCategoryId: categoryData2._id.toString()
            };

            const response = await agent(app)
                .patch(`/files/category/${categoryData1._id.toString()}/${fileData.gcsId}`)
                .send(patchData);

            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            let category = await collection.findOne({ _id: categoryData1._id });
            expect(category.items).toHaveLength(0);

            category = await collection.findOne({ _id: categoryData2._id });
            expect(category.items).toHaveLength(1);

            const file = category.items[0];
            expect(file).toBeTruthy();
            expect(file.clientId).toBe(fileData.clientId);
            expect(file.fileName).toBe('Blazin Blazer');
            expect(file.fullFileUrl).toBe('full.file.url');
            expect(file.smallFileUrl).toBe('small.file.url');
            expect(file.fullGcsDest).toBe('dev/items/full.png');
            expect(file.smallGcsDest).toBe('dev/items/small.png');
            expect(file.gcsId).toBe(fileId);
        }); 
    });

    describe('delete', () => {
        it('should delete file', async () => {
            // create mock function implementations
            const deleteMock = jest.spyOn(helpers, 'deleteFromGCS');
            deleteMock.mockImplementation();

            // insert mock data
            const fileId = createId();
            const fileData = {
                clientId: new ObjectId().toString(),
                fileName: 'Blazin Blazer',
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url',
                fullGcsDest: 'dev/items/full.png',
                smallGcsDest: 'dev/items/small.png',
                gcsId: fileId
            };

            const categoryData = {
                _id: new ObjectId(),
                name: 'Blazers',
                items: [fileData]
            };
            await collection.insertOne(categoryData);

            // perform action to test
            const response = await agent(app)
                .delete(`/files/${categoryData._id.toString()}/${fileData.gcsId}`);
            
            // perform checks
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');
            expect(deleteMock).toHaveBeenCalledWith('dev/items/full.png');
            expect(deleteMock).toHaveBeenCalledWith('dev/items/small.png');

            const category = await collection.findOne({ _id: categoryData._id });
            expect(category.items).toHaveLength(0);

            // restore mocks
            deleteMock.mockRestore();
        });
    });
});