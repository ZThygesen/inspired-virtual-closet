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