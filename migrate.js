import { MongoClient } from 'mongodb';
import 'dotenv/config';

const mongoClient = new MongoClient(process.env.DB_URI);
await mongoClient.connect();

// make sure to test with DEV first
const db = mongoClient.db(process.env.DB_NAME_DEV);

// perform database migration here
const collection = db.collection('outfits');

const outfits = await collection.find({}).toArray();

for (const outfit of outfits) {
    const itemIds = new Set();
    const stageItems = outfit.stageItems;
    for (const stageItem of stageItems) {
        const attrs = stageItem.attrs;
        if (attrs) {
            if (attrs.name == 'image') {
                const item = attrs.item;
                if (item) {
                    if (item?.itemId) {
                        itemIds.add(item.itemId);
                    }
                }
            }
        }
    };
    const uniqueItemIds = [...itemIds];
    console.log(outfit.outfitName, uniqueItemIds);
    // await collection.updateOne(
    //     { _id: outfit._id },
    //     {
    //         $set: {
    //             itemsUsed: uniqueItemIds,
    //         }
    //     }
    // );
};

// const collection = db.collection('categories');
// const categories = await collection.findOne({ _id: 0 });
// console.log(categories.items.length);

// console.log(outfits.length)

await mongoClient.close();
