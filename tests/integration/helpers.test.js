import { jest } from '@jest/globals';
import { bucket } from "../../server";
import { helpers } from "../../helpers";
import { MongoClient, ObjectId } from "mongodb";
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

describe('moveFilesToOther', () => {
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

    let categoryId;
    let data;
    beforeEach(async () => {
        expect(process.env.NODE_ENV).toBe('test');

        categoryId = new ObjectId();
        data = {
            _id: categoryId,
            name: 'Blazers',
            items: [1, 2, 3, 4, 5]
        };
        await collection.insertOne(data);
    });

    afterEach(async () => {
        await clearCollection(collection);
        await insertOther(collection);
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it('should move all files to other', async () => {
        let oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        let otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);

        await expect(helpers.moveFilesToOther(db, data._id.toString())).resolves;

        otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(5);
        const items = otherCategory.items;
        expect(items).toEqual(data.items);
    });

    it('should handle no files', async () => {
        await clearCollection(collection);
        await insertOther(collection);
        await collection.insertOne({ _id: data._id, name: data.name, items: [] });

        let oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(0);

        let otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);

        await helpers.moveFilesToOther(db, data._id.toString());

        otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);
    });

    it('should handle with files already in other', async () => {
        const newFiles = [-3, -2, -1, 0];
        await collection.updateOne({ _id: 0 }, { $push: { items: { $each: newFiles }}})

        let oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        let otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(4);

        await helpers.moveFilesToOther(db, data._id.toString());

        otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(9);
        const items = otherCategory.items;
        expect(items).toEqual(newFiles.concat(data.items));
    });

    it('should fail with missing db', async () => {
        let oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        let otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);

        await expect(helpers.moveFilesToOther(null, data._id.toString())).rejects.toThrow('database instance required to move files to other category');
        
        oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);
    });

    it('should fail with missing category id', async () => {
        let oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        let otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);

        await expect(helpers.moveFilesToOther(db, undefined)).rejects.toThrow('failed to move files to other: invalid or missing category id');
        
        oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);
    });

    it('should fail with invalid category id', async () => {
        let oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        let otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);

        await expect(helpers.moveFilesToOther(db, 'not-valid-id')).rejects.toThrow('failed to move files to other: invalid or missing category id');
        
        oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);
    });

    it('should fail with nonexistent category', async () => {
        let oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        let otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);

        await expect(helpers.moveFilesToOther(db, (new ObjectId()).toString())).rejects.toThrow('category does not exist');
        
        oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);
    });

    it('should fail if given Other category', async () => {
        let oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        let otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);

        await expect(helpers.moveFilesToOther(db, 0)).rejects.toThrow('cannot move files from Other to Other');
        
        oldCategory = await collection.findOne({ _id: data._id });
        expect(oldCategory.items).toHaveLength(5);

        otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toHaveLength(0);
    });
});