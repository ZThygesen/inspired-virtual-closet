import { bucket } from "../../server";
import { helpers } from "../../helpers";
import cuid2 from "@paralleldrive/cuid2";

describe('uploadToGCS', () => {
    beforeAll(async () => {
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');

        const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
        expect(files).toHaveLength(0);
    });

    afterAll(async () => {
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
        await bucket.deleteFiles({ prefix: 'test/outfits/'});

        const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
        expect(files).toHaveLength(0);
    });

    let b64str = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==';
    let gcsId;
    let gcsDest;
    let fileBuffer;
    beforeEach(async () => {
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');

        gcsId = cuid2.createId();
        gcsDest = `test/outfits/${gcsId}.png`;

        fileBuffer = await helpers.b64ToBuffer(b64str);
    });

    it('should upload to GCS', async () => {
        const url = await helpers.uploadToGCS(bucket, gcsDest, fileBuffer);

        expect(url).toBe(`https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Foutfits%2F${gcsId}.png`);

        const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
        await expect(files).toHaveLength(1);
        expect(files[0].metadata.name).toBe(gcsDest);
        expect(files[0].metadata.contentType).toBe('image/png');
        expect(parseInt(files[0].metadata.size)).toBe(fileBuffer.byteLength);
    });

    it('should fail to upload to GCS with missing bucket', async () => {
        await expect(helpers.uploadToGCS(undefined, gcsDest, fileBuffer)).rejects.toThrow('bucket must be provided to upload to GCS');
    });

    it('should fail to upload to GCS with missing gcs dest', async () => {
        gcsDest = '';
        await expect(helpers.uploadToGCS(bucket, gcsDest, fileBuffer)).rejects.toThrow('invalid or missing gcs dest provided');
    });

    it('should fail to upload to GCS with invalid gcs dest', async () => {
        gcsDest = 'not-valid-gcs-dest';
        await expect(helpers.uploadToGCS(bucket, gcsDest, fileBuffer)).rejects.toThrow('invalid or missing gcs dest provided');
    });

    it('should fail to upload to GCS with invalid gcs dest file extension', async () => {
        gcsDest = 'not-valid-gcs-dest-extension.jpg';
        await expect(helpers.uploadToGCS(bucket, gcsDest, fileBuffer)).rejects.toThrow('invalid or missing gcs dest provided');
    });

    it('should fail to upload to GCS with missing file buffer', async () => {
        fileBuffer = null;
        await expect(helpers.uploadToGCS(bucket, gcsDest, fileBuffer)).rejects.toThrow('file buffer must be provided to upload to GCS');
    });

    it('should fail to upload to GCS with invalid file buffer', async () => {
        fileBuffer = new ArrayBuffer(8);
        await expect(helpers.uploadToGCS(bucket, gcsDest, fileBuffer)).rejects.toThrow('file buffer must be provided to upload to GCS');
    });
});

describe('deleteFromGCS', () => {
    beforeAll(async () => {
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');

        const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
        expect(files).toHaveLength(0);
    });

    afterAll(async () => {
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');

        const [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
        await expect(files).toHaveLength(0);
    });

    let b64str = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEUAAAAA/2IAPxgAHwwAXyQAfzEwtqyjAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVQImWNgIBIYwxisMAZzAIRWZoAynBmCYXLOMAZUxACmJhimC2EO3GQQAADE0AOJ+VqhbQAAAABJRU5ErkJggg==';
    let gcsId;
    let gcsDest;
    let fileBuffer;
    beforeEach(async () => {
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');

        gcsId = cuid2.createId();
        gcsDest = `test/outfits/${gcsId}.png`;

        fileBuffer = await helpers.b64ToBuffer(b64str);
    });

    it('should delete from GCS', async () => {
        const url = await helpers.uploadToGCS(bucket, gcsDest, fileBuffer);
        expect(url).toBe(`https://storage.googleapis.com/edie-styles-virtual-closet-test/test%2Foutfits%2F${gcsId}.png`);

        let [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
        expect(files).toHaveLength(1);

        expect(files[0].metadata.name).toBe(gcsDest);
        expect(files[0].metadata.contentType).toBe('image/png');

        const deleted = await helpers.deleteFromGCS(bucket, gcsDest);
        expect(deleted).resolves;

        [files] = await bucket.getFiles({ prefix: 'test/outfits/' });
        await expect(files).toHaveLength(0);
    });

    it('should fail to delete from GCS with missing bucket', async () => {
        await expect(helpers.deleteFromGCS(null, gcsDest)).rejects.toThrow('bucket must be provided to delete from GCS');
    });

    it('should fail to upload to GCS with missing gcs dest', async () => {
        gcsDest = '';
        await expect(helpers.deleteFromGCS(bucket, gcsDest)).rejects.toThrow('destination must be provided to delete from GCS');
    });

    it('should fail to upload to GCS with non-existent gcs dest', async () => {
        gcsDest = 'not-valid-gcs-dest';
        await expect(helpers.deleteFromGCS(bucket, gcsDest)).rejects.toThrow(`No such object: edie-styles-virtual-closet-test/${gcsDest}`);
    });
});

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

// beforeEach(() => {
//     expect(process.env.NODE_ENV).toBe('test');
// });

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