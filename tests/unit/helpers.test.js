import { jest } from '@jest/globals';
import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import { helpers } from '../../helpers';

describe('isValidId', () => {
    it('should return true given valid ObjectId', () => {
        const isValid = helpers.isValidId((new ObjectId).toString());
        expect(isValid).toBe(true);
    });

    it('should return false given ObjectId', () => {
        const isValid = helpers.isValidId(new ObjectId);
        expect(isValid).toBe(false);
    });

    it('should return false given random string', () => {
        const isValid = helpers.isValidId('nope');
        expect(isValid).toBe(false);
    });

    it('should return false given 12 character string', () => {
        const isValid = helpers.isValidId('112233445566');
        expect(isValid).toBe(false);
    });

    it('should return false given empty string', () => {
        const isValid = helpers.isValidId('');
        expect(isValid).toBe(false);
    });

    it('should return false given null', () => {
        const isValid = helpers.isValidId(null);
        expect(isValid).toBe(false);
    });

    it('should return false given undefined', () => {
        const isValid = helpers.isValidId(undefined);
        expect(isValid).toBe(false);
    });

    it('should return false given non-string value', () => {
        const isValid = helpers.isValidId(12);
        expect(isValid).toBe(false);
    });

    it('should return false given no id', () => {
        const isValid = helpers.isValidId();
        expect(isValid).toBe(false);
    });
});

describe('isOtherCategory', () => {
    it('should return true with \'0\'', () => {
        const isOther = helpers.isOtherCategory('0');
        expect(isOther).toBe(true);
    });

    it('should return true with 0', () => {
        const isOther = helpers.isOtherCategory(0);
        expect(isOther).toBe(true);
    });

    it('should return false given null', () => {
        const isOther = helpers.isOtherCategory(null);
        expect(isOther).toBe(false);
    });

    it('should return false given undefined', () => {
        const isOther = helpers.isOtherCategory(undefined);
        expect(isOther).toBe(false);
    });

    it('should return false given empty string', () => {
        const isOther = helpers.isOtherCategory('');
        expect(isOther).toBe(false);
    });

    it('should return false given ObjectId with 0', () => {
        const isOther = helpers.isOtherCategory(new ObjectId(0));
        expect(isOther).toBe(false);
    });

    it('should return false with no id given', () => {
        const isOther = helpers.isOtherCategory();
        expect(isOther).toBe(false);
    });
});

describe('createError', () => {
    let mockMessage;
    let mockStatus;

    beforeEach(() => {
        mockMessage = 'this is an error message';
        mockStatus = 12;
    });

    it('should create error given all parameters', () => {
        const error = helpers.createError(mockMessage, mockStatus);

        expect(error.message).toBe(mockMessage);
        expect(error.status).toBe(mockStatus);
    });

    it('should create error without given message (empty string)', () => {
        mockMessage = '';
        const error = helpers.createError(mockMessage, mockStatus);

        expect(error.message).toBe('there was an error');
        expect(error.status).toBe(mockStatus);
    });

    it('should create error without given message (undefined)', () => {
        mockMessage = undefined;
        const error = helpers.createError('', mockStatus);

        expect(error.message).toBe('there was an error');
        expect(error.status).toBe(mockStatus);
    });

    it('should create error without given message', () => {
        const error = helpers.createError(mockStatus);

        expect(error.message).toBe('there was an error');
        expect(error.status).toBe(500);
    });

    it('should create error without given status', () => {
        const error = helpers.createError(mockMessage);

        expect(error.message).toBe(mockMessage);
        expect(error.status).toBe(500);
    });

    it('should create error without given parameters', () => {
        const error = helpers.createError();

        expect(error.message).toBe('there was an error');
        expect(error.status).toBe(500);
    });
});

describe('b64ToBuffer', () => {
    let b64str;

    let mockBlob = new Blob(['image data'], { type: 'image/png' });
    let mockFetch;
    let arrayBufferResponse = new ArrayBuffer(8);
    let mockArrayBuffer;
    let mockFrom;
    beforeEach(() => {
        b64str = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAEElEQVR4nGI6c3cpIAAA//8EzwJRGd6X7gAAAABJRU5ErkJggg==';

        mockArrayBuffer = jest.fn().mockResolvedValue(arrayBufferResponse);

        mockFetch = jest.spyOn(global, 'fetch');
        mockFetch.mockImplementation(jest.fn(() => Promise.resolve({
            ok: true,
            blob: () => {
                const blob = mockBlob;
                blob.arrayBuffer = mockArrayBuffer;

                return Promise.resolve(blob);
            }
        })));

        const buffer = Buffer.from(arrayBufferResponse);
        mockFrom = jest.spyOn(Buffer, 'from');
        mockFrom.mockReturnValue(buffer);
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it('should convert b64 string to buffer', async () => {
        const jpg = 'data:image/jpg;base64,' + b64str;
        const jpeg = 'data:image/jpeg;base64,' + b64str;
        const png = 'data:image/png;base64,' + b64str;

        const buffer1 = await helpers.b64ToBuffer(jpg);
        const buffer2 = await helpers.b64ToBuffer(jpeg);
        const buffer3 = await helpers.b64ToBuffer(png);

        expect(Buffer.isBuffer(buffer1)).toBe(true);
        expect(Buffer.isBuffer(buffer2)).toBe(true);
        expect(Buffer.isBuffer(buffer3)).toBe(true);

        expect(mockFetch).toHaveBeenCalledWith(jpg);
        expect(mockFetch).toHaveBeenCalledWith(jpeg);
        expect(mockFetch).toHaveBeenCalledWith(png);
        expect(mockArrayBuffer).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalled();
    });

    it('should fail with empty b64 string', async () => {
        b64str = '';

        await expect(helpers.b64ToBuffer(b64str)).rejects.toThrow('not a valid base64 image string');
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockArrayBuffer).not.toHaveBeenCalled();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fail if b64 not a string', async () => {
        b64str = 0;

        await expect(helpers.b64ToBuffer(b64str)).rejects.toThrow('not a valid base64 image string');
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockArrayBuffer).not.toHaveBeenCalled();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fail with invalid MIME type', async () => {
        b64str = 'data:image/gif;base64,' + b64str;

        await expect(helpers.b64ToBuffer(b64str)).rejects.toThrow('not a valid base64 image string');
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockArrayBuffer).not.toHaveBeenCalled();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fail if fetch fails', async () => {
        const png = 'data:image/png;base64,' + b64str;
        mockFetch.mockImplementation(jest.fn(() => Promise.resolve({
            ok: false,
        })));

        await expect(helpers.b64ToBuffer(png)).rejects.toThrow('error with conversion of b64 to blob');
        expect(mockFetch).toHaveBeenCalledWith(png);
        expect(mockArrayBuffer).not.toHaveBeenCalled();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fail if blob fails fails', async () => {
        const png = 'data:image/png;base64,' + b64str;
        mockFetch.mockImplementation(jest.fn(() => Promise.resolve({
            ok: true,
            blob: () => Promise.reject(new Error('blob failed'))
        })));

        await expect(helpers.b64ToBuffer(png)).rejects.toThrow('blob failed');
        expect(mockFetch).toHaveBeenCalledWith(png);
        expect(mockArrayBuffer).not.toHaveBeenCalled();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fail if no blob returned', async () => {
        const png = 'data:image/png;base64,' + b64str;
        mockFetch.mockImplementation(jest.fn(() => Promise.resolve({
            ok: true,
            blob: () => Promise.resolve()
        })));

        await expect(helpers.b64ToBuffer(png)).rejects.toThrow('blob does not exist');
        expect(mockFetch).toHaveBeenCalledWith(png);
        expect(mockArrayBuffer).not.toHaveBeenCalled();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fail if arrayBuffer fails', async () => {
        const png = 'data:image/png;base64,' + b64str;

        mockArrayBuffer = jest.fn().mockRejectedValue(new Error('arrayBuffer failed'));
        mockFetch.mockImplementation(jest.fn(() => Promise.resolve({
            ok: true,
            blob: () => {
                const mockBlob = new Blob(['image data'], { type: 'image/png' });
                mockBlob.arrayBuffer = mockArrayBuffer;

                return Promise.resolve(mockBlob)
            }
        })));

        await expect(helpers.b64ToBuffer(png)).rejects.toThrow('arrayBuffer failed');
        expect(mockFetch).toHaveBeenCalledWith(png);
        expect(mockArrayBuffer).toHaveBeenCalled();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fail if arrayBuffer returns nothing', async () => {
        const png = 'data:image/png;base64,' + b64str;

        mockArrayBuffer = jest.fn().mockResolvedValue();
        mockFetch.mockImplementation(jest.fn(() => Promise.resolve({
            ok: true,
            blob: () => {
                const mockBlob = new Blob(['image data'], { type: 'image/png' });
                mockBlob.arrayBuffer = mockArrayBuffer;

                return Promise.resolve(mockBlob)
            }
        })));

        await expect(helpers.b64ToBuffer(png)).rejects.toThrow('blob not successfully converted to array buffer');
        expect(mockFetch).toHaveBeenCalledWith(png);
        expect(mockArrayBuffer).toHaveBeenCalled();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fail if arrayBuffer doesn\'t return an array buffer', async () => {
        const png = 'data:image/png;base64,' + b64str;
        
        mockArrayBuffer = jest.fn().mockResolvedValue('not an array buffer');
        mockFetch.mockImplementation(jest.fn(() => Promise.resolve({
            ok: true,
            blob: () => {
                const mockBlob = new Blob(['image data'], { type: 'image/png' });
                mockBlob.arrayBuffer = mockArrayBuffer;

                return Promise.resolve(mockBlob)
            }
        })));

        await expect(helpers.b64ToBuffer(png)).rejects.toThrow('blob not successfully converted to array buffer');
        expect(mockFetch).toHaveBeenCalledWith(png);
        expect(mockArrayBuffer).toHaveBeenCalled();
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should fail if Buffer.from fails', async () => {
        const png = 'data:image/png;base64,' + b64str;
        mockFrom.mockImplementation(() => { throw new Error('Buffer.from failed') });

        await expect(helpers.b64ToBuffer(png)).rejects.toThrow('Buffer.from failed');
        expect(mockFetch).toHaveBeenCalledWith(png);
        expect(mockArrayBuffer).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalled();
    });

    it('should fail if Buffer.from returns nothing', async () => {
        const png = 'data:image/png;base64,' + b64str;
        mockFrom.mockReturnValue();

        await expect(helpers.b64ToBuffer(png)).rejects.toThrow('arrayBuffer not successfully converted to buffer');
        expect(mockFetch).toHaveBeenCalledWith(png);
        expect(mockArrayBuffer).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalled();
    });

    it('should fail if Buffer.from doesn\'t return a buffer', async () => {
        const png = 'data:image/png;base64,' + b64str;
        mockFrom.mockReturnValue('not a buffer');

        await expect(helpers.b64ToBuffer(png)).rejects.toThrow('arrayBuffer not successfully converted to buffer');
        expect(mockFetch).toHaveBeenCalledWith(png);
        expect(mockArrayBuffer).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalled();
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
    let b64str;

    let mockFetch;
    let mockb64ToBuffer;

    beforeEach(() => {
        b64str = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAEElEQVR4nGI6c3cpIAAA//8EzwJRGd6X7gAAAABJRU5ErkJggg==';

        mockFetch = jest.spyOn(global, 'fetch');
        mockFetch.mockImplementation(jest.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ result_b64: b64str })
        })));

        mockb64ToBuffer = jest.spyOn(helpers, 'b64ToBuffer');
        mockb64ToBuffer.mockImplementation((b64str) => {
            const buffer = Buffer.from(b64str);
            return Promise.resolve(buffer);
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it('should remove b64 image string background', async () => {
        const jpg = 'data:image/jpg;base64,' + b64str;
        const jpeg = 'data:image/jpeg;base64,' + b64str;
        const png = 'data:image/png;base64,' + b64str;

        const buffer1 = await helpers.removeBackground(jpg);
        const buffer2 = await helpers.removeBackground(jpeg);
        const buffer3 = await helpers.removeBackground(png);

        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(mockb64ToBuffer).toHaveBeenCalledTimes(3);

        expect(Buffer.isBuffer(buffer1)).toBe(true);
        expect(Buffer.isBuffer(buffer2)).toBe(true);
        expect(Buffer.isBuffer(buffer3)).toBe(true);
    });

    it('should fail with empty b64 string', async () => {
        b64str = '';

        await expect(helpers.removeBackground(b64str)).rejects.toThrow('not a valid base64 image string');
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockb64ToBuffer).not.toHaveBeenCalled();
    });

    it('should fail if b64 not a string', async () => {
        b64str = 0;

        await expect(helpers.removeBackground(b64str)).rejects.toThrow('not a valid base64 image string');
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockb64ToBuffer).not.toHaveBeenCalled();
    });

    it('should fail with invalid MIME type', async () => {
        b64str = 'data:image/gif;base64,' + b64str;

        await expect(helpers.removeBackground(b64str)).rejects.toThrow('not a valid base64 image string');
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockb64ToBuffer).not.toHaveBeenCalled();
    });

    it('should fail with Photoroom error', async () => {
        mockFetch.mockImplementation(jest.fn(() => Promise.resolve({
            ok: false
        })));
        
        b64str = 'data:image/png;base64,' + b64str;

        await expect(helpers.removeBackground(b64str)).rejects.toThrow('error with Photoroom remove background');
        expect(mockFetch).toHaveBeenCalled();
        expect(mockb64ToBuffer).not.toHaveBeenCalled();
    });

    it('should fail if Photoroom returns no b64 string', async () => {        
        mockFetch.mockImplementation(jest.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ result_b64: '' })
        })));
        
        b64str = 'data:image/png;base64,' + b64str;

        await expect(helpers.removeBackground(b64str)).rejects.toThrow('Photoroom json did not return valid b64 string');
        expect(mockFetch).toHaveBeenCalled();
        expect(mockb64ToBuffer).not.toHaveBeenCalled();
    });

    it('should fail with b64ToBuffer error', async () => {        
        mockb64ToBuffer.mockRejectedValue(new Error('b64toBuffer failed'));
        
        b64str = 'data:image/png;base64,' + b64str;

        await expect(helpers.removeBackground(b64str)).rejects.toThrow('b64toBuffer failed');
        expect(mockFetch).toHaveBeenCalled();
        expect(mockb64ToBuffer).toHaveBeenCalled();
    });

    it('should fail if b64ToBuffer returns nothing', async () => {        
        mockb64ToBuffer.mockResolvedValue();
        
        b64str = 'data:image/png;base64,' + b64str;

        await expect(helpers.removeBackground(b64str)).rejects.toThrow('failed to remove background: conversion from b64 to buffer failed');
        expect(mockFetch).toHaveBeenCalled();
        expect(mockb64ToBuffer).toHaveBeenCalled();
    });

    it('should fail if b64ToBuffer doesn\'t return buffer', async () => {        
        mockb64ToBuffer.mockResolvedValue('not a buffer');
        
        b64str = 'data:image/png;base64,' + b64str;

        await expect(helpers.removeBackground(b64str)).rejects.toThrow('failed to remove background: conversion from b64 to buffer failed');
        expect(mockFetch).toHaveBeenCalled();
        expect(mockb64ToBuffer).toHaveBeenCalled();
    });
});

describe('createImageThumbnail', () => {
    let mockBuffer;
    let mockThumbnailBuffer = Buffer.from('mock thumbnail data');

    let mockResize;
    let mockPng;
    let mockToBuffer;
    beforeEach(() => {
        mockBuffer = Buffer.from('mock image data');

        mockResize = jest.spyOn(sharp.prototype, 'resize').mockReturnThis();
        mockPng = jest.spyOn(sharp.prototype, 'png').mockReturnThis();
        mockToBuffer = jest.spyOn(sharp.prototype, 'toBuffer').mockResolvedValue(mockThumbnailBuffer);
    });
        
    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it('should create a thumbnail from the image buffer', async () => {
        const thumbnailBuffer = await helpers.createImageThumbnail(mockBuffer, 100, 100);

        expect(mockResize).toHaveBeenCalledWith({ width: 100, height: 100, fit: 'inside' });
        expect(mockPng).toHaveBeenCalled();
        expect(mockToBuffer).toHaveBeenCalled();

        expect(thumbnailBuffer).toBe(mockThumbnailBuffer);
    });

    it('should fail if empty buffer', async () => {
        mockBuffer = Buffer.from('');

        await expect(helpers.createImageThumbnail(mockBuffer)).rejects.toThrow('invalid buffer input');
        expect(mockResize).not.toHaveBeenCalled();
        expect(mockPng).not.toHaveBeenCalled();
        expect(mockToBuffer).not.toHaveBeenCalled();
    });

    it('should fail if input not buffer', async () => {
        mockBuffer = 'not a buffer';

        await expect(helpers.createImageThumbnail(mockBuffer)).rejects.toThrow('invalid buffer input');
        expect(mockResize).not.toHaveBeenCalled();
        expect(mockPng).not.toHaveBeenCalled();
        expect(mockToBuffer).not.toHaveBeenCalled();
    });

    it('should fail if resize fails', async () => {
        mockResize.mockImplementation(() => { throw new Error('resize failed') });

        await expect(helpers.createImageThumbnail(mockBuffer)).rejects.toThrow('resize failed');
        expect(mockResize).toHaveBeenCalledWith({ width: 300, height: 300, fit: 'inside' });
        expect(mockPng).not.toHaveBeenCalled();
        expect(mockToBuffer).not.toHaveBeenCalled();
    });

    it('should fail if png fails', async () => {
        mockPng.mockImplementation(() => { throw new Error('png failed') });

        await expect(helpers.createImageThumbnail(mockBuffer)).rejects.toThrow('png failed');
        expect(mockResize).toHaveBeenCalledWith({ width: 300, height: 300, fit: 'inside' });
        expect(mockPng).toHaveBeenCalled();
        expect(mockToBuffer).not.toHaveBeenCalled();
    });

    it('should fail if toBuffer fails', async () => {
        mockToBuffer.mockImplementation(() => { throw new Error('toBuffer failed') });

        await expect(helpers.createImageThumbnail(mockBuffer)).rejects.toThrow('toBuffer failed');
        expect(mockResize).toHaveBeenCalledWith({ width: 300, height: 300, fit: 'inside' });
        expect(mockPng).toHaveBeenCalled();
        expect(mockToBuffer).toHaveBeenCalled();
    });

    it('should fail if toBuffer returns nothing', async () => {
        mockToBuffer.mockReturnValue();

        await expect(helpers.createImageThumbnail(mockBuffer)).rejects.toThrow('error creating image thumbnail');
        expect(mockResize).toHaveBeenCalledWith({ width: 300, height: 300, fit: 'inside' });
        expect(mockPng).toHaveBeenCalled();
        expect(mockToBuffer).toHaveBeenCalled();
    });

    it('should fail if toBuffer doesn\'t return a buffer', async () => {
        mockToBuffer.mockReturnValue('not a buffer');

        await expect(helpers.createImageThumbnail(mockBuffer)).rejects.toThrow('error creating image thumbnail');
        expect(mockResize).toHaveBeenCalledWith({ width: 300, height: 300, fit: 'inside' });
        expect(mockPng).toHaveBeenCalled();
        expect(mockToBuffer).toHaveBeenCalled();
    });
});

describe('googleConnect', () => {
    afterEach(() => {
        process.env.NODE_ENV = 'test';
    });

    it ('should connect to bucket - test environment', async () => {
        const { bucket } = await helpers.googleConnect();
        expect(bucket.id).toBe('edie-styles-virtual-closet-test');
    });

    it ('should connect to bucket - production environment', async () => {
        process.env.NODE_ENV = 'production';
        const { bucket } = await helpers.googleConnect();
        expect(bucket.id).toBe('edie-styles-virtual-closet');
    });

    it ('should connect to bucket - dev environment', async () => {
        process.env.NODE_ENV = 'dev';
        const { bucket } = await helpers.googleConnect();
        expect(bucket.id).toBe('edie-styles-virtual-closet-dev');
    });

    it ('should connect to bucket - review environment', async () => {
        process.env.NODE_ENV = 'review';
        const { bucket } = await helpers.googleConnect();
        expect(bucket.id).toBe('edie-styles-virtual-closet-dev');
    });

    it ('should connect to bucket - staging environment', async () => {
        process.env.NODE_ENV = 'staging';
        const { bucket } = await helpers.googleConnect();
        expect(bucket.id).toBe('edie-styles-virtual-closet-dev');
    });
});

describe('mongoConnect', () => {
    const originalDbUri = process.env.DB_URI;

    let mockConnect;
    let mockDb;
    beforeEach(() => {
        mockConnect = jest.spyOn(MongoClient.prototype, 'connect');
        mockConnect.mockResolvedValue();

        mockDb = jest.spyOn(MongoClient.prototype, 'db');
        mockDb.mockImplementation(() => {
            return { db: 'worked' }
        });
    });

    afterEach(() => {
        process.env.NODE_ENV = 'test';
        process.env.DB_URI = originalDbUri;

        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it('should connect to mongodb test database', async () => {
        // create mock environment
        process.env.NODE_ENV = 'test';

        // perform action to test
        const db = await helpers.mongoConnect();

        // perform checks
        expect(db).toEqual({ db: 'worked' });
        expect(mockConnect).toHaveBeenCalled();
        expect(mockDb).toHaveBeenCalledWith('test-virtual-closet');
    });

    it('should connect to mongodb dev database', async () => {
        // prepare mock environment
        process.env.NODE_ENV = 'dev';

        // perform action to test
        const db = await helpers.mongoConnect();

        // perform checks
        expect(db).toEqual({ db: 'worked' });
        expect(mockConnect).toHaveBeenCalled();
        expect(mockDb).toHaveBeenCalledWith('dev-virtual-closet');
    });

    it('should connect to mongodb prod database', async () => {
        // prepare mock environment
        process.env.NODE_ENV = 'production';

        // perform action to test
        const db = await helpers.mongoConnect();

        // perform checks
        expect(db).toEqual({ db: 'worked' });
        expect(mockConnect).toHaveBeenCalled();
        expect(mockDb).toHaveBeenCalledWith('virtual-closet');
    });

    it('should fail to connect with improper db uri', async () => {
        // prepare mock environment
        process.env.DB_URI = 'improper-db-uri';

        // perform action to test
        await expect(helpers.mongoConnect()).rejects.toThrow('Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"'); 
        expect(mockConnect).not.toHaveBeenCalled();
        expect(mockDb).not.toHaveBeenCalled();
    });

    it('should fail to connect if connect fails', async () => {
        // create mock function implementations 
        mockConnect.mockRejectedValue(new Error('connect failed'));

        // perform action to test
        await expect(helpers.mongoConnect()).rejects.toThrow('connect failed');
        expect(mockConnect).toHaveBeenCalled();
        expect(mockDb).not.toHaveBeenCalled();
    });

    it('should fail to connect if db fails', async () => {
        // create mock function implementations 
        mockDb.mockRejectedValue(new Error('db failed'));

        // perform action to test
        await expect(helpers.mongoConnect()).rejects.toThrow('db failed');
        expect(mockConnect).toHaveBeenCalled();
        expect(mockDb).toHaveBeenCalledWith('test-virtual-closet');
    });
});

describe('uploadToGCS', () => {
    let mockBucket;
    let mockSave;
    let mockUrl;

    let gcsDest;
    let fileBuffer;
    beforeEach(() => {
        mockSave = jest.fn().mockResolvedValue();
        mockUrl = jest.fn().mockResolvedValue('file.url');
        mockBucket = { 
            file: jest.fn().mockImplementation((gcsDest) => {
                const mockFile = { dest: gcsDest };
                mockFile.save = mockSave;
                mockFile.publicUrl = mockUrl;

                return mockFile;
            }
        )};

        gcsDest = 'file-destination.png';
        fileBuffer = Buffer.from('file-buffer-content');
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it('should upload file to GCS', async () => {
        const url = await helpers.uploadToGCS(mockBucket, gcsDest, fileBuffer);
        
        expect(url).toBe('file.url');
        expect(mockBucket.file).toHaveBeenCalledWith(gcsDest);
        expect(mockSave).toHaveBeenCalledWith(fileBuffer);
        expect(mockUrl).toHaveBeenCalled();
    });

    it('should fail given empty bucket', async () => {
        mockBucket = null;

        await expect(helpers.uploadToGCS(mockBucket, gcsDest, fileBuffer)).rejects.toThrow('bucket must be provided to upload to GCS');
        
        expect(mockBucket?.file).toBe(undefined);
        expect(mockSave).not.toHaveBeenCalled();
        expect(mockUrl).not.toHaveBeenCalled();
    });

    it('should fail given empty destination string', async () => {
        gcsDest = '';

        await expect(helpers.uploadToGCS(mockBucket, gcsDest, fileBuffer)).rejects.toThrow('invalid or missing gcs dest provided');
        
        expect(mockBucket.file).not.toHaveBeenCalled();
        expect(mockSave).not.toHaveBeenCalled();
        expect(mockUrl).not.toHaveBeenCalled();
    });

    it('should fail given improper destination string', async () => {
        gcsDest = 'file-destination';

        await expect(helpers.uploadToGCS(mockBucket, gcsDest, fileBuffer)).rejects.toThrow('invalid or missing gcs dest provided');
        
        expect(mockBucket.file).not.toHaveBeenCalled();
        expect(mockSave).not.toHaveBeenCalled();
        expect(mockUrl).not.toHaveBeenCalled();
    });

    it('should fail given improper destination extension', async () => {
        gcsDest = 'file-destination.jpg';

        await expect(helpers.uploadToGCS(mockBucket, gcsDest, fileBuffer)).rejects.toThrow('invalid or missing gcs dest provided');
        
        expect(mockBucket.file).not.toHaveBeenCalled();
        expect(mockSave).not.toHaveBeenCalled();
        expect(mockUrl).not.toHaveBeenCalled();
    });

    it('should fail given improper file buffer', async () => {
        fileBuffer = 'not a buffer';

        await expect(helpers.uploadToGCS(mockBucket, gcsDest, fileBuffer)).rejects.toThrow('file buffer must be provided to upload to GCS');
        
        expect(mockBucket.file).not.toHaveBeenCalled();
        expect(mockSave).not.toHaveBeenCalled();
        expect(mockUrl).not.toHaveBeenCalled();
    });

    it('should handle file error', async () => {
        mockBucket = { 
            file: jest.fn().mockImplementation(() => { throw new Error('bucket.file failed') })
        };

        await expect(helpers.uploadToGCS(mockBucket, gcsDest, fileBuffer)).rejects.toThrow('bucket.file failed');
        
        expect(mockBucket.file).toHaveBeenCalledWith(gcsDest);
        expect(mockSave).not.toHaveBeenCalled();
        expect(mockUrl).not.toHaveBeenCalled();
    });

    it('should fail if file returns empty', async () => {
        mockBucket = { 
            file: jest.fn().mockReturnValue()
        };

        await expect(helpers.uploadToGCS(mockBucket, gcsDest, fileBuffer)).rejects.toThrow('conversion of destination to file failed');
        
        expect(mockBucket.file).toHaveBeenCalledWith(gcsDest);
        expect(mockSave).not.toHaveBeenCalled();
        expect(mockUrl).not.toHaveBeenCalled();
    });

    it('should handle save fail', async () => {
        mockSave.mockRejectedValue(new Error('save failed'));
        mockBucket = { 
            file: jest.fn().mockImplementation((gcsDest) => {
                const mockFile = { dest: gcsDest };
                mockFile.save = mockSave;

                return mockFile;
            }
        )};

        await expect(helpers.uploadToGCS(mockBucket, gcsDest, fileBuffer)).rejects.toThrow('save failed');
        
        expect(mockBucket.file).toHaveBeenCalledWith(gcsDest);
        expect(mockSave).toHaveBeenCalled();
        expect(mockUrl).not.toHaveBeenCalled();
    });

    it('should handle publicUrl fail', async () => {
        mockUrl.mockRejectedValue(new Error('publicUrl failed'));
        mockBucket = { 
            file: jest.fn().mockImplementation((gcsDest) => {
                const mockFile = { dest: gcsDest };
                mockFile.save = mockSave;
                mockFile.publicUrl = mockUrl;

                return mockFile;
            }
        )};

        await expect(helpers.uploadToGCS(mockBucket, gcsDest, fileBuffer)).rejects.toThrow('publicUrl failed');
        
        expect(mockBucket.file).toHaveBeenCalledWith(gcsDest);
        expect(mockSave).toHaveBeenCalled();
        expect(mockUrl).toHaveBeenCalled();
    });

    it('should fail if publicUrl returns empty', async () => {
        mockUrl.mockResolvedValue('');
        mockBucket = { 
            file: jest.fn().mockImplementation((gcsDest) => {
                const mockFile = { dest: gcsDest };
                mockFile.save = mockSave;
                mockFile.publicUrl = mockUrl;

                return mockFile;
            }
        )};

        await expect(helpers.uploadToGCS(mockBucket, gcsDest, fileBuffer)).rejects.toThrow('fetching of file url failed');
        
        expect(mockBucket.file).toHaveBeenCalledWith(gcsDest);
        expect(mockSave).toHaveBeenCalled();
        expect(mockUrl).toHaveBeenCalled();
    });
});

describe('deleteFromGCS', () => {
    let mockBucket;
    let mockDelete;

    let gcsDest;
    beforeEach(() => {
        mockDelete = jest.fn().mockResolvedValue();
        mockBucket = { 
            file: jest.fn().mockImplementation((gcsDest) => {
                const mockFile = { dest: gcsDest };
                mockFile.delete = mockDelete;

                return mockFile;
            }
        )};

        gcsDest = 'file-destination';
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it('should delete file from GCS', async () => {
        await expect(helpers.deleteFromGCS(mockBucket, gcsDest)).resolves;
        
        expect(mockBucket.file).toHaveBeenCalledWith(gcsDest);
        expect(mockDelete).toHaveBeenCalled();
    });

    it('should fail given empty bucket', async () => {
        mockBucket = null;

        await expect(helpers.deleteFromGCS(mockBucket, gcsDest)).rejects.toThrow('bucket must be provided to delete from GCS');
        
        expect(mockBucket?.file).toBe(undefined);
        expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should fail given empty destination string', async () => {
        gcsDest = '';

        await expect(helpers.deleteFromGCS(mockBucket, gcsDest)).rejects.toThrow('destination must be provided to delete from GCS');
        
        expect(mockBucket.file).not.toHaveBeenCalled();
        expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should handle file error', async () => {
        mockBucket = { 
            file: jest.fn().mockImplementation(() => { throw new Error('bucket.file failed') })
        };

        await expect(helpers.deleteFromGCS(mockBucket, gcsDest)).rejects.toThrow('bucket.file failed');
        
        expect(mockBucket.file).toHaveBeenCalledWith(gcsDest);
        expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should fail if file returns empty', async () => {
        mockBucket = { 
            file: jest.fn().mockReturnValue()
        };

        await expect(helpers.deleteFromGCS(mockBucket, gcsDest)).rejects.toThrow('conversion of destination to file failed');
        
        expect(mockBucket.file).toHaveBeenCalledWith(gcsDest);
        expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should handle delete fail', async () => {
        mockDelete.mockRejectedValue(new Error('deletion failed'));
        mockBucket = { 
            file: jest.fn().mockImplementation((gcsDest) => {
                const mockFile = { dest: gcsDest };
                mockFile.delete = mockDelete;

                return mockFile;
            }
        )};

        await expect(helpers.deleteFromGCS(mockBucket, gcsDest)).rejects.toThrow('deletion failed');
        
        expect(mockBucket.file).toHaveBeenCalledWith(gcsDest);
        expect(mockDelete).toHaveBeenCalled();
    });
});

describe('moveFilesToOther', () => {
    let categoryId;

    let mockCollection;
    let mockDb;

    let mockCreateError;
    beforeEach(() => {
        categoryId = (new ObjectId()).toString()

        mockCollection = {
            findOne: jest.fn().mockResolvedValue({ _id: ObjectId(categoryId), name: 'Blazers', items: [] }),
            updateOne: jest.fn().mockResolvedValue()
        };
        
        mockDb = {
            collection: jest.fn(() => mockCollection)
        };

        mockCreateError = jest.spyOn(helpers, 'createError');
        mockCreateError.mockImplementation((message, status) => {
            const error = new Error(message);
            error.status = status;
            return error;
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it ('should move files to Other category', async () => {
        await expect(helpers.moveFilesToOther(mockDb, categoryId)).resolves;

        expect(mockDb.collection).toHaveBeenCalledWith('categories');
        expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
        expect(mockCollection.updateOne).toHaveBeenCalled();
    });

    it ('should fail if no db instance given', async () => {
        mockDb = null;
        await expect(helpers.moveFilesToOther(mockDb, categoryId)).rejects.toThrow('database instance required to move files to other category');
        
        expect(mockDb?.collection).toBe(undefined);
        expect(mockCollection.findOne).not.toHaveBeenCalled();
        expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it ('should fail if no category id given (empty string)', async () => {
        categoryId = '';
        await expect(helpers.moveFilesToOther(mockDb, categoryId)).rejects.toThrow('failed to move files to other: invalid or missing category id');
        
        expect(mockDb.collection).not.toHaveBeenCalled();
        expect(mockCollection.findOne).not.toHaveBeenCalled();
        expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it ('should fail if no category id given (null)', async () => {
        categoryId = null;
        await expect(helpers.moveFilesToOther(mockDb, categoryId)).rejects.toThrow('failed to move files to other: invalid or missing category id');
        
        expect(mockDb.collection).not.toHaveBeenCalled();
        expect(mockCollection.findOne).not.toHaveBeenCalled();
        expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it ('should fail if Other category given (int)', async () => {
        categoryId = 0;
        await expect(helpers.moveFilesToOther(mockDb, categoryId)).rejects.toThrow('cannot move files from Other to Other');
        
        expect(mockDb.collection).not.toHaveBeenCalled();
        expect(mockCollection.findOne).not.toHaveBeenCalled();
        expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it ('should fail if Other category given (string)', async () => {
        categoryId = '0';
        await expect(helpers.moveFilesToOther(mockDb, categoryId)).rejects.toThrow('cannot move files from Other to Other');
        
        expect(mockDb.collection).not.toHaveBeenCalled();
        expect(mockCollection.findOne).not.toHaveBeenCalled();
        expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it ('should fail if invalid category given', async () => {
        categoryId = 'not-valid-id';
        await expect(helpers.moveFilesToOther(mockDb, categoryId)).rejects.toThrow('failed to move files to other: invalid or missing category id');
        
        expect(mockDb.collection).not.toHaveBeenCalled();
        expect(mockCollection.findOne).not.toHaveBeenCalled();
        expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it ('should handle findOne failure', async () => {
        const findError = new Error('findOne failed');
        mockCollection.findOne.mockRejectedValue(findError);

        await expect(helpers.moveFilesToOther(mockDb, categoryId)).rejects.toThrow('findOne failed');
        
        expect(mockDb.collection).toHaveBeenCalledWith('categories');
        expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
        expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it ('should fail if findOne returns nothing', async () => {
        mockCollection.findOne.mockResolvedValue();

        await expect(helpers.moveFilesToOther(mockDb, categoryId)).rejects.toThrow('category does not exist');
        
        expect(mockDb.collection).toHaveBeenCalledWith('categories');
        expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
        expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it ('should handle updateOne failure', async () => {
        const updateError = new Error('updateOne failed');
        mockCollection.updateOne.mockRejectedValue(updateError);

        await expect(helpers.moveFilesToOther(mockDb, categoryId)).rejects.toThrow('updateOne failed');
        
        expect(mockDb.collection).toHaveBeenCalledWith('categories');
        expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(categoryId) });
        expect(mockCollection.updateOne).toHaveBeenCalled();
    });
});