import { MongoClient } from 'mongodb';
import 'dotenv/config';

const mongoClient = new MongoClient(process.env.DB_URI);
await mongoClient.connect();

// make sure to test with DEV first
const db = mongoClient.db(process.env.DB_NAME_DEV);

// perform database migration here
// const itemCollection = db.collection('items');
// const collection = db.collection('outfits');

// const outfits = await collection.find({}).toArray();

// for (const outfit of outfits) {
//     const stageItems = outfit.stageItems;

//     for (const stageItem of stageItems) {
//         const attrs = stageItem.attrs;
//         if (attrs) {
//             if (attrs.name == 'image') {
//                 const item = attrs.item;
//                 if (item) {
//                     const gcsId = item.itemId;
//                     if (gcsId) {
//                         const actualItem = await itemCollection.findOne({ gcsId: gcsId });
//                         if (actualItem) {
//                             const itemId = actualItem._id;
//                             if (itemId) {
//                                 item.itemId = itemId.toString();
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     };

//     const itemIdSet = new Set();
//     for (const stageItem of stageItems) {
//         const attrs = stageItem.attrs;
//         if (attrs) {
//             if (attrs.name == 'image') {
//                 const item = attrs.item;
//                 if (item) {
//                     const itemId = item.itemId;
//                     if (itemId) {
//                         itemIdSet.add(itemId);
//                     }
//                 }
//             }
//         }
//     }

//     const itemIds = [...itemIdSet];
//     await collection.updateOne(
//         { _id: outfit._id },
//         {
//             $set: {
//                 stageItems: stageItems,
//                 itemsUsed: itemIds,
//             }
//         }
//     );
// };

// const itemCollection = db.collection('items');
// const collection = db.collection('categories');
// const categories = await collection.find({}).toArray();
// for (const category of categories) {
//     let categoryId = category._id.toString();
//     if (categoryId === '0') {
//         categoryId = 0;
//     }
//     const items = category.items;
//     for (const item of items) {
//         const newItem = {
//             clientId: item.clientId.toString(),
//             categoryId: categoryId,
//             fileName: item.fileName,
//             fullFileUrl: item.fullFileUrl,
//             smallFileUrl: item.smallFileUrl,
//             fullGcsDest: item.fullGcsDest,
//             smallGcsDest: item.smallGcsDest,
//             gcsId: item.gcsId,
//             tags: item.tags || [],
//         };
//         // await itemCollection.insertOne(newItem);
//     }
// }

// let numItems = 0;
// const collection = db.collection('categories');
// const categories = await collection.find({}).toArray();
// for (const category of categories) {
//     const items = category.items;
//     numItems += items.length;
// }

// console.log(numItems);

// const itemCollection = db.collection('items');
// const items = await itemCollection.find({}).toArray();
// console.log(items.length);

// const collection = db.collection('categories');
// await collection.updateMany({}, { $unset: { items: "" } });

await mongoClient.close();
