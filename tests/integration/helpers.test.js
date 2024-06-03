// describe('moveFilesToOther', () => {
//     let mongoClient;
//     let db;
//     let collection;

//     beforeAll(async () => {
//         mongoClient = new MongoClient(process.env.DB_URI);
//         await mongoClient.connect();
//         db = mongoClient.db(process.env.DB_NAME_TEST);
//         collection = db.collection('categories');
//     });

//     afterEach(async () => {
//         await collection.deleteMany({ _id: { $ne: 0 } });
//         await collection.updateOne(
//             { _id: 0 },
//             { $set: { items: [] } }
//         );
//     });

//     afterAll(async () => {
//         await mongoClient.close();
//     });

//     it('should move all files to other', async () => {
//         const categoryData = {
//             _id: new ObjectId(),
//             name: 'Blazers',
//             items: [1, 2, 3, 4, 5]
//         };
//         await collection.insertOne(categoryData);

//         await helpers.moveFilesToOther(db, categoryData._id.toString());
    
//         const otherCategory = await collection.findOne({ _id: 0 });
//         expect(otherCategory.items).toBeTruthy();

//         const items = otherCategory.items;
//         expect(items).toEqual([1, 2, 3, 4, 5]);
//     });

//     it('should fail if category does not exist', async () => {
//         const categoryData = {
//             _id: new ObjectId(),
//             name: 'Blazers',
//             items: [1, 2, 3, 4, 5]
//         };
//         await collection.insertOne(categoryData);

//         await expect(helpers.moveFilesToOther(db, new ObjectId().toString())).rejects.toThrow('Category does not exist');

//     });

//     it('should fail if given Other category', async () => {
//         const categoryData = {
//             _id: new ObjectId(),
//             name: 'Blazers',
//             items: [1, 2, 3, 4, 5]
//         };
//         await collection.insertOne(categoryData);

//         await expect(helpers.moveFilesToOther(db, 0)).rejects.toThrow('Cannot move files from Other to Other');
//     });
// });