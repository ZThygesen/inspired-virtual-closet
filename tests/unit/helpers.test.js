import { jest } from '@jest/globals';
import { app } from '../../server';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers';

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

    afterAll(() => {
        jest.restoreAllMocks();
    })

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