// import { jest } from '@jest/globals';
// import { app } from '../../server';
// import { agent } from 'supertest';
// import { MongoClient } from 'mongodb';
// import { ObjectId } from 'mongodb';
// import { helpers } from '../../helpers';

// describe('outfits', () => {
//     let mongoClient;
//     let db;
//     let collection;

//     beforeAll(async () => {
//         mongoClient = new MongoClient(process.env.DB_URI);
//         await mongoClient.connect();
//         db = mongoClient.db(process.env.DB_NAME_TEST);
//         collection = db.collection('outfits');
//     });

//     afterEach(async () => {
//         await collection.deleteMany({ });
//     });

//     afterAll(async () => {
//         await mongoClient.close();
//     });

//     describe('create', () => {
//         it('should create new outfit', async () => {
//             // create mock function implementations
//             const bufferMock = jest.spyOn(helpers, 'b64ToBuffer');
//             bufferMock.mockImplementation();
    
//             const uploadMock = jest.spyOn(helpers, 'uploadToGCS');
//             uploadMock.mockImplementation(() => 'outfit.url');
    
//             // perform action to test
//             const clientId = new ObjectId().toString();
//             const response = await agent(app)
//                 .post('/outfits')
//                 .field('fileSrc', 'data:image/png;base64,fileSrc=')
//                 .field('stageItemsStr', '{"stageItems":11.13}')
//                 .field('outfitName', 'Epic Party Outfit')
//                 .field('clientId', clientId);
    
//             // perform checks
//             expect(response.status).toBe(201);
//             expect(response.body.message).toBe('Success!');
//             expect(bufferMock).toHaveBeenCalledWith('data:image/png;base64,fileSrc=');
//             expect(uploadMock).toHaveBeenCalled();
    
//             const outfit = await collection.findOne({ clientId: clientId, outfitName: 'Epic Party Outfit' });
//             expect(outfit).toBeTruthy();
//             expect(outfit).toHaveProperty('_id');
//             expect(outfit.clientId).toBe(clientId);
//             expect(outfit.stageItems).toEqual({ stageItems: 11.13 });
//             expect(outfit.outfitName).toBe('Epic Party Outfit');
//             expect(outfit.outfitUrl).toBe('outfit.url');
//             expect(outfit.gcsDest).toEqual(expect.stringContaining('dev/outfits'));
        
//             // restore mocks
//             bufferMock.mockRestore();
//             uploadMock.mockRestore();
//         });
//     });
    
//     describe('read', () => {
//         it('should get outfits', async () => {
//             // insert mock data
//             const data = {
//                 _id: new ObjectId(),
//                 clientId: new ObjectId().toString(),
//                 stageItems: { stageItems: 11.13 },
//                 outfitName: 'Epic Party Outfit',
//                 outfitUrl: 'outfit.url',
//                 gcsDest: 'dev/outfits/gcsdest.png'
//             };
//             await collection.insertOne(data);

//             // perform action to test
//             const response = await agent(app)
//                 .get(`/outfits/${data.clientId}`);
            
//             // perform checks
//             expect(response.status).toBe(200);
//             expect(response.body).toHaveLength(1);

//             const outfit = response.body[0];
//             expect(outfit._id).toBe(data._id.toString());
//             expect(outfit.clientId).toBe(data.clientId);
//             expect(outfit.stageItems).toEqual({ stageItems: 11.13 });
//             expect(outfit.outfitName).toBe('Epic Party Outfit');
//             expect(outfit.outfitUrl).toBe('outfit.url');
//             expect(outfit.gcsDest).toBe('dev/outfits/gcsdest.png');
//         });
//     });
    
//     describe('update', () => {
//         it('should update outfit content', async () => {
//             // create mock function implementations
//             const deleteMock = jest.spyOn(helpers, 'deleteFromGCS');
//             deleteMock.mockImplementation();

//             const bufferMock = jest.spyOn(helpers, 'b64ToBuffer');
//             bufferMock.mockImplementation();
    
//             const uploadMock = jest.spyOn(helpers, 'uploadToGCS');
//             uploadMock.mockImplementation(() => 'new.outfit.url');

//             // insert mock data
//             const data = {
//                 _id: new ObjectId(),
//                 clientId: new ObjectId().toString(),
//                 stageItems: { stageItems: 11.13 },
//                 outfitName: 'Epic Party Outfit',
//                 outfitUrl: 'outfit.url',
//                 gcsDest: 'dev/outfits/gcsdest.png'
//             };
//             await collection.insertOne(data);

//             // perform action to test
//             const response = await agent(app)
//                 .patch(`/outfits/${data._id.toString()}`)
//                 .field('fileSrc', 'data:image/png;base64,newFileSrc=')
//                 .field('stageItemsStr', '{"stageItems":{"anotherLayer":13.11}}')
//                 .field('outfitName', 'Formal Wedding Attire')
//                 .field('gcsDest', 'dev/outfits/gcsdest.png');

//             // perform checks
//             expect(response.status).toBe(200);
//             expect(response.body.message).toBe('Success!');
//             expect(deleteMock).toHaveBeenCalledWith('dev/outfits/gcsdest.png');
//             expect(bufferMock).toHaveBeenCalledWith('data:image/png;base64,newFileSrc=');
//             expect(uploadMock).toHaveBeenCalled();

//             const outfit = await collection.findOne({ _id: data._id });
//             expect(outfit).toBeTruthy();
//             expect(outfit._id).toEqual(data._id);
//             expect(outfit.clientId).toBe(data.clientId);
//             expect(outfit.stageItems).toEqual({ stageItems: { anotherLayer: 13.11 }});
//             expect(outfit.outfitName).toBe('Formal Wedding Attire');
//             expect(outfit.outfitUrl).toBe('new.outfit.url');
//             expect(outfit.gcsDest).not.toBe('dev/outfits/gcsdest.png');
//             expect(outfit.gcsDest).toEqual(expect.stringContaining('dev/outfits'));

//             // restore mocks
//             deleteMock.mockRestore();
//             bufferMock.mockRestore();
//             uploadMock.mockRestore();
//         });  

//         it('should update outfit name', async () => {
//             // insert mock data
//             const data = {
//                 _id: new ObjectId(),
//                 clientId: new ObjectId().toString(),
//                 stageItems: { stageItems: 11.13 },
//                 outfitName: 'Epic Party Outfit',
//                 outfitUrl: 'outfit.url',
//                 gcsDest: 'dev/outfits/gcsdest.png'
//             };
//             await collection.insertOne(data);

//             // perform action to test
//             const patchData = {
//                 newName: 'Formal Wedding Attire'
//             };

//             const response = await agent(app)
//                 .patch(`/outfits/name/${data._id.toString()}`)
//                 .send(patchData);

//             // perform checks
//             expect(response.status).toBe(200);
//             expect(response.body.message).toBe('Success!');

//             const outfit = await collection.findOne({ _id: data._id });
//             expect(outfit).toBeTruthy();
//             expect(outfit._id).toEqual(data._id);
//             expect(outfit.clientId).toBe(data.clientId);
//             expect(outfit.stageItems).toEqual({ stageItems: 11.13 });
//             expect(outfit.outfitName).toBe('Formal Wedding Attire');
//             expect(outfit.outfitUrl).toBe('outfit.url');
//             expect(outfit.gcsDest).toBe('dev/outfits/gcsdest.png');
//         });  
//     });

//     describe('delete', () => {
//         it('should delete outfit', async () => {
//             // create mock function implementations
//             const deleteMock = jest.spyOn(helpers, 'deleteFromGCS');
//             deleteMock.mockImplementation();

//             // insert mock data
//             const data = {
//                 _id: new ObjectId(),
//                 clientId: new ObjectId().toString(),
//                 stageItems: { stageItems: 11.13 },
//                 outfitName: 'Epic Party Outfit',
//                 outfitUrl: 'outfit.url',
//                 gcsDest: 'dev/outfits/gcsdest.png'
//             };
//             await collection.insertOne(data);

//             // perform action to test
//             const response = await agent(app)
//                 .delete(`/outfits/${data._id.toString()}`);
            
//             // perform checks
//             expect(response.status).toBe(200);
//             expect(response.body.message).toBe('Success!');
//             expect(deleteMock).toHaveBeenCalledWith('dev/outfits/gcsdest.png');

//             const outfit = await collection.findOne({ _id: data._id });
//             expect(outfit).toBeFalsy();

//             // restore mocks
//             deleteMock.mockRestore();
//         });
//     });
// });