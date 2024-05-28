import { jest } from '@jest/globals';
import { bucket } from '../../server';
import { MongoClient, ObjectId } from 'mongodb';
import { helpers } from '../../helpers';
import sharp from 'sharp';

describe('mongoConnect', () => {
    function setupMocks() {
        // create mock function implementations 
        const connectMock = jest.spyOn(MongoClient.prototype, 'connect');
        connectMock.mockResolvedValueOnce();

        const dbMock = jest.spyOn(MongoClient.prototype, 'db');
        dbMock.mockImplementation(() => {
            return { db: 'worked' }
        });

        return { connectMock, dbMock };
    }

    const originalNodeEnv = process.env.NODE_ENV;
    const originalDbUri = process.env.DB_URI;

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.DB_URI = originalDbUri;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should connect to mongodb test database', async () => {
        // create mock environment
        const { connectMock, dbMock } = setupMocks();
        process.env.NODE_ENV = 'test';

        // perform action to test
        const db = await helpers.mongoConnect();

        // perform checks
        expect(db).toEqual({ db: 'worked' });
        expect(connectMock).toHaveBeenCalled();
        expect(dbMock).toHaveBeenCalledWith('test-virtual-closet');
    });

    it('should connect to mongodb dev database', async () => {
        // prepare mock environment
        const { connectMock, dbMock } = setupMocks();
        process.env.NODE_ENV = 'dev';

        // perform action to test
        const db = await helpers.mongoConnect();

        // perform checks
        expect(db).toEqual({ db: 'worked' });
        expect(connectMock).toHaveBeenCalled();
        expect(dbMock).toHaveBeenCalledWith('dev-virtual-closet');
    });

    it('should connect to mongodb prod database', async () => {
        // prepare mock environment
        const { connectMock, dbMock } = setupMocks();
        process.env.NODE_ENV = 'production';

        // perform action to test
        const db = await helpers.mongoConnect();

        // perform checks
        expect(db).toEqual({ db: 'worked' });
        expect(connectMock).toHaveBeenCalled();
        expect(dbMock).toHaveBeenCalledWith('virtual-closet');
    });

    it('should fail to connect with improper db uri', async () => {
        // prepare mock environment
        process.env.DB_URI = 'improper-db-uri';

        // perform action to test
        await expect(helpers.mongoConnect()).rejects.toThrow(); 
    });

    it('should fail to connect if connect fails', async () => {
        // create mock function implementations 
        const connectMock = jest.spyOn(MongoClient.prototype, 'connect');
        connectMock.mockRejectedValueOnce(new Error('Connect failed'));

        const dbMock = jest.spyOn(MongoClient.prototype, 'db');
        dbMock.mockImplementation(() => {
            return { db: 'worked' }
        });

        // perform action to test
        await expect(helpers.mongoConnect()).rejects.toThrow('Connect failed'); 
    });

    it('should fail to connect if db fails', async () => {
        // create mock function implementations 
        const connectMock = jest.spyOn(MongoClient.prototype, 'connect');
        connectMock.mockResolvedValueOnce();

        const dbMock = jest.spyOn(MongoClient.prototype, 'db');
        dbMock.mockRejectedValueOnce(new Error('Db failed'));

        // perform action to test
        await expect(helpers.mongoConnect()).rejects.toThrow('Db failed'); 
    });
});

describe('b64ToBuffer', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should convert b64 string to buffer', async () => {
        const b64str = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAEElEQVR4nGI6c3cpIAAA//8EzwJRGd6X7gAAAABJRU5ErkJggg==';
        const jpg = 'data:image/jpg;base64,' + b64str;
        const jpeg = 'data:image/jpeg;base64,' + b64str;
        const png = 'data:image/png;base64,' + b64str;

        const buffer1 = await helpers.b64ToBuffer(jpg);
        const buffer2 = await helpers.b64ToBuffer(jpeg);
        const buffer3 = await helpers.b64ToBuffer(png);

        expect(Buffer.isBuffer(buffer1)).toBe(true);
        expect(Buffer.isBuffer(buffer2)).toBe(true);
        expect(Buffer.isBuffer(buffer3)).toBe(true);
    });

    it('should fail with empty b64 string', async () => {
        const b64str = '';

        await expect(helpers.b64ToBuffer(b64str)).rejects.toThrow('Not a valid base64 image string');
    });

    it('should fail with invalid MIME type', async () => {
        const b64str = 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAEElEQVR4nGI6c3cpIAAA//8EzwJRGd6X7gAAAABJRU5ErkJggg==';

        await expect(helpers.b64ToBuffer(b64str)).rejects.toThrow('Not a valid base64 image string');
    });

    it('should fail with invalid conversion to buffer', async () => {
        jest.spyOn(Buffer, 'from').mockReturnValue('not a buffer');
        const b64str = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAEElEQVR4nGI6c3cpIAAA//8EzwJRGd6X7gAAAABJRU5ErkJggg==';

        await expect(helpers.b64ToBuffer(b64str)).rejects.toThrow('Base64 string not successfully converted to buffer');
    });
});

/*
describe('uploadToGCF', () => {
    function setupMocks() {
        const axiosMock = jest.spyOn(axios, 'post');
        axiosMock.mockResolvedValueOnce({
            data: {
                fullFileUrl: 'full.file.url',
                smallFileUrl: 'small.file.url'
            }
        });

        return axiosMock;
    }

    afterEach(() => {
        jest.restoreAllMocks();
    })

    it('should upload file to GCF', async () => {
        const axiosMock = setupMocks();

        const fileSrc = 'data:image/png;base64,fileSrc=';
        const fullGcsDest = 'full/gcs/dest';
        const smallGcsDest = 'small/gcs/dest';

        const { fullFileUrl, smallFileUrl } = await helpers.uploadToGCF(fileSrc, fullGcsDest, smallGcsDest);

        expect(axiosMock).toHaveBeenCalled();
        expect(fullFileUrl).toBe('full.file.url');
        expect(smallFileUrl).toBe('small.file.url');
    });

    it('should fail given improper file src', async () => {
        const axiosMock = setupMocks();

        const fileSrc = 'data:image/gif;base64,fileSrc=';
        const fullGcsDest = 'full/gcs/dest';
        const smallGcsDest = 'small/gcs/dest';

        await expect(helpers.uploadToGCF(fileSrc, fullGcsDest, smallGcsDest)).rejects.toThrow('Not a valid fileSrc');
        expect(axiosMock).not.toHaveBeenCalled();
    });

    it('should fail given empty full destination string', async () => {
        const axiosMock = setupMocks();

        const fileSrc = 'data:image/png;base64,fileSrc=';
        const fullGcsDest = '';
        const smallGcsDest = 'small/gcs/dest';

        await expect(helpers.uploadToGCF(fileSrc, fullGcsDest, smallGcsDest)).rejects.toThrow('GCS destination cannot be empty');
        expect(axiosMock).not.toHaveBeenCalled();
    });

    it('should fail given empty small destination string', async () => {
        const axiosMock = setupMocks();

        const fileSrc = 'data:image/png;base64,fileSrc=';
        const fullGcsDest = 'full/gcs/dest';
        const smallGcsDest = '';

        await expect(helpers.uploadToGCF(fileSrc, fullGcsDest, smallGcsDest)).rejects.toThrow('GCS destination cannot be empty');
        expect(axiosMock).not.toHaveBeenCalled();
    });

    it('should fail with improper credentials', async () => {
        const originalGCFUrl = process.env.GCF_URL;
        process.env.GCF_URL = '';

        const axiosMock = setupMocks();
        const fileSrc = 'data:image/png;base64,fileSrc=';
        const fullGcsDest = 'full/gcs/dest';
        const smallGcsDest = 'small/gcs/dest';

        await expect(helpers.uploadToGCF(fileSrc, fullGcsDest, smallGcsDest)).rejects.toThrow();
        expect(axiosMock).not.toHaveBeenCalled();

        process.env.GCF_URL = originalGCFUrl;
    });
});
*/

describe('removeBackground', () => {
    function setupMocks() {
        const b64str = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAEElEQVR4nGI6c3cpIAAA//8EzwJRGd6X7gAAAABJRU5ErkJggg==';

        const fetchMock = jest.spyOn(global, 'fetch')
            .mockImplementation(jest.fn(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ result_b64: b64str })
            })));

        const b64ToBufferMock = jest.spyOn(helpers, 'b64ToBuffer')
            .mockImplementation((b64str) => {
                const buffer = Buffer.from(b64str);
                return Promise.resolve(buffer);
            });
        //b64ToBufferMock.mockResolvedValueOnce(Buffer.from(b64str));

        return { fetchMock, b64ToBufferMock };
    }

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should remove b64 image string background', async () => {
        const { fetchMock, b64ToBufferMock } = setupMocks();

        const b64str = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAEElEQVR4nGI6c3cpIAAA//8EzwJRGd6X7gAAAABJRU5ErkJggg==';
        const jpg = 'data:image/jpg;base64,' + b64str;
        const jpeg = 'data:image/jpeg;base64,' + b64str;
        const png = 'data:image/png;base64,' + b64str;

        const buffer1 = await helpers.removeBackground(jpg);
        const buffer2 = await helpers.removeBackground(jpeg);
        const buffer3 = await helpers.removeBackground(png);

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(b64ToBufferMock).toHaveBeenCalledTimes(3);

        expect(Buffer.isBuffer(buffer1)).toBe(true);
        expect(Buffer.isBuffer(buffer2)).toBe(true);
        expect(Buffer.isBuffer(buffer3)).toBe(true);
    });

    it('should fail with empty b64 string', async () => {
        const b64str = '';

        await expect(helpers.removeBackground(b64str)).rejects.toThrow('Not a valid fileSrc');
    });

    it('should fail with invalid MIME type', async () => {
        const b64str = 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAEElEQVR4nGI6c3cpIAAA//8EzwJRGd6X7gAAAABJRU5ErkJggg==';

        await expect(helpers.b64ToBuffer(b64str)).rejects.toThrow('Not a valid base64 image string');
    });

    it('should fail with Photoroom error', async () => {
        const { fetchMock, _ } = setupMocks();
        fetchMock.mockImplementation(jest.fn(() => Promise.resolve({
            ok: false
        })));
        
        const b64str = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAEElEQVR4nGI6c3cpIAAA//8EzwJRGd6X7gAAAABJRU5ErkJggg==';

        await expect(helpers.removeBackground(b64str)).rejects.toThrow('Error with Photoroom remove background');
    });

    it('should fail with b64ToBuffer error', async () => {
        const { fetchMock, b64ToBufferMock } = setupMocks();
        
        b64ToBufferMock.mockImplementation(() => {
            return Promise.reject(new Error('b64toBuffer failed'));
        });
        
        const b64str = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAEElEQVR4nGI6c3cpIAAA//8EzwJRGd6X7gAAAABJRU5ErkJggg==';

        await expect(helpers.removeBackground(b64str)).rejects.toThrow('b64toBuffer failed');
        expect(fetchMock).toHaveBeenCalled();
    });
});

// jest.mock('sharp');
describe('createImageThumbnail', () => {
    const mockBuffer = Buffer.from('mock image data');
    const mockThumbnailBuffer = Buffer.from('mock thumbnail data');

    function setupMocks() {
        const resizeMock = jest.spyOn(sharp.prototype, 'resize').mockReturnThis();
        const pngMock = jest.spyOn(sharp.prototype, 'png').mockReturnThis();
        const toBufferMock = jest.spyOn(sharp.prototype, 'toBuffer').mockResolvedValue(mockThumbnailBuffer);
        
        return { resizeMock, pngMock, toBufferMock };
    }

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should create a thumbnail from the image buffer', async () => {
        const { resizeMock, pngMock, toBufferMock } = setupMocks();

        const thumbnailBuffer = await helpers.createImageThumbnail(mockBuffer, 100, 100);

        expect(resizeMock).toHaveBeenCalled();
        expect(pngMock).toHaveBeenCalled();
        expect(toBufferMock).toHaveBeenCalled();

        expect(thumbnailBuffer).toBe(mockThumbnailBuffer);
    });

    it('should fail if empty buffer', async () => {
        const buffer = Buffer.from('');

        await expect(helpers.createImageThumbnail(buffer)).rejects.toThrow('invalid buffer input');
    });

    it('should fail if input not buffer', async () => {
        const notBuffer = 'not a buffer';

        await expect(helpers.createImageThumbnail(notBuffer)).rejects.toThrow('invalid buffer input');
    });

    it('should fail if resize fails', async () => {
        const { resizeMock, _, __ } = setupMocks();
        resizeMock.mockImplementation(() => {
            throw new Error('resize failed');
        });

        await expect(helpers.createImageThumbnail(mockBuffer)).rejects.toThrow('resize failed');
    });

    it('should fail if png fails', async () => {
        const { resizeMock, pngMock, _ } = setupMocks();
        pngMock.mockImplementation(() => {
            throw new Error('png failed');
        });

        await expect(helpers.createImageThumbnail(mockBuffer)).rejects.toThrow('png failed');
        expect(resizeMock).toHaveBeenCalled();
    });

    it('should fail if toBuffer fails', async () => {
        const { resizeMock, pngMock, toBufferMock } = setupMocks();
        toBufferMock.mockImplementation(() => {
            throw new Error('toBuffer failed');
        });

        await expect(helpers.createImageThumbnail(mockBuffer)).rejects.toThrow('toBuffer failed');
        expect(resizeMock).toHaveBeenCalled();
        expect(pngMock).toHaveBeenCalled();
    });
});

describe('uploadToGCS', () => {
    function setupMocks() {
        const mockFile = jest.spyOn(bucket, 'file');
        mockFile.mockReturnValueOnce({
            save: jest.fn().mockResolvedValueOnce(),
            publicUrl: jest.fn().mockResolvedValueOnce('file.url')
        });

        return mockFile;
    }

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should upload file to GCS', async () => {
        const mockFile = setupMocks();

        const gcsDest = 'file-destination';
        const fileBuffer = Buffer.from('file-buffer-content');

        const url = await helpers.uploadToGCS(gcsDest, fileBuffer);
        
        expect(url).toBe('file.url');
        expect(mockFile.mock.results[0].value.save).toHaveBeenCalledWith(fileBuffer);
        expect(mockFile.mock.results[0].value.publicUrl).toHaveBeenCalled();
    });

    it('should fail given empty destination string', async () => {
        const gcsDest = '';
        const fileBuffer = Buffer.from('file-buffer-content');

        await expect(helpers.uploadToGCS(gcsDest, fileBuffer)).rejects.toThrow('Invalid GCS destination');
    });

    it('should fail given improper file buffer', async () => {
        const gcsDest = 'file-destination';
        const fileBuffer = 'file-buffer-content';

        await expect(helpers.uploadToGCS(gcsDest, fileBuffer)).rejects.toThrow('Must be a file buffer');
    });

    it('should fail if save fails', async () => {
        const mockFile = jest.spyOn(bucket, 'file');
        mockFile.mockReturnValueOnce({
            save: jest.fn().mockRejectedValueOnce(new Error('Save file failed')),
            publicUrl: jest.fn().mockResolvedValueOnce('file.url')
        });
        
        const gcsDest = 'file-destination';
        const fileBuffer = Buffer.from('file-buffer-content');

        await expect(helpers.uploadToGCS(gcsDest, fileBuffer)).rejects.toThrow('Save file failed');
    });

    it('should fail if publicUrl fails', async () => {
        const mockFile = jest.spyOn(bucket, 'file');
        mockFile.mockReturnValueOnce({
            save: jest.fn().mockResolvedValueOnce(),
            publicUrl: jest.fn().mockRejectedValueOnce(new Error('PublicUrl failed'))
        });
        
        const gcsDest = 'file-destination';
        const fileBuffer = Buffer.from('file-buffer-content');

        await expect(helpers.uploadToGCS(gcsDest, fileBuffer)).rejects.toThrow('PublicUrl failed');
    });
});

describe('deleteFromGCS', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should delete file from GCS', async () => {
        const mockFile = jest.spyOn(bucket, 'file');
        mockFile.mockReturnValueOnce({
            delete: jest.fn().mockResolvedValueOnce()
        });

        const gcsDest = 'file-destination';

        await helpers.deleteFromGCS(gcsDest);
        
        expect(mockFile.mock.results[0].value.delete).toHaveBeenCalled();
    });

    it('should fail given empty destination string', async () => {
        const mockFile = jest.spyOn(bucket, 'file');
        mockFile.mockReturnValueOnce({
            delete: jest.fn().mockResolvedValueOnce()
        });

        const gcsDest = '';

        await expect(helpers.deleteFromGCS(gcsDest)).rejects.toThrow('Invalid GCS destination');
    });

    it('should fail if delete fails', async () => {
        const mockFile = jest.spyOn(bucket, 'file');
        mockFile.mockReturnValueOnce({
            delete: jest.fn().mockRejectedValueOnce(new Error('Delete failed'))
        });

        const gcsDest = 'file-destination';

        await expect(helpers.deleteFromGCS(gcsDest)).rejects.toThrow('Delete failed');
    });
});

describe('moveFilesToOther', () => {
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

    it('should move all files to other', async () => {
        const categoryData = {
            _id: new ObjectId(),
            name: 'Blazers',
            items: [1, 2, 3, 4, 5]
        };
        await collection.insertOne(categoryData);

        await helpers.moveFilesToOther(categoryData._id.toString());
    
        const otherCategory = await collection.findOne({ _id: 0 });
        expect(otherCategory.items).toBeTruthy();

        const items = otherCategory.items;
        expect(items).toEqual([1, 2, 3, 4, 5]);
    });

    it('should fail if category does not exist', async () => {
        const categoryData = {
            _id: new ObjectId(),
            name: 'Blazers',
            items: [1, 2, 3, 4, 5]
        };
        await collection.insertOne(categoryData);

        await expect(helpers.moveFilesToOther(new ObjectId().toString())).rejects.toThrow('Category does not exist');

    });

    it('should fail if given Other category', async () => {
        const categoryData = {
            _id: new ObjectId(),
            name: 'Blazers',
            items: [1, 2, 3, 4, 5]
        };
        await collection.insertOne(categoryData);

        await expect(helpers.moveFilesToOther(0)).rejects.toThrow('Cannot move files from Other to Other');
    });
});