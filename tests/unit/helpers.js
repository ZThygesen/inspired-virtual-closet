import { jest } from '@jest/globals';
import { helpers } from '../../helpers'
import cuid2 from '@paralleldrive/cuid2';
import path from 'path';

export const unitHelpers = {
    err: null,
    mockRes: null,
    mockNext: null,
    mockCollection: null,
    mockDb: null,
    mockBucket: null,
    locals: null,
    mockCreateError: null,

    // === route specifics ==================
    // categories
    mockMoveFilesToOther: null,

    // items
    creditsResponse: null,
    bufferResponse: null,
    thumbnailResponse: null,
    gcsResponse: null,
    idResponse: null,

    mockCategoryExists: null,
    mockIsSuperAdmin: null,
    mockGetCredits: null,
    mockDeductCredits: null,
    mockRemoveBackground: null,
    mockb64ToBuffer: null,
    mockCreateImageThumbnail: null,
    mockUploadToGCS: null,
    mockDeleteFromGCS: null,
    mockParse: null,
    mockCreateId: null,
    mockBucket: null,

    // outfits
    whiteBgResponse: null,

    mockAddWhiteBackground: null,

    // tags
    mockMoveTagsToOther: null,

    beforeEach() {
        expect(process.env.NODE_ENV).toBe('test');
        this.err = null;
        this.mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        this.mockNext = jest.fn((nextErr) => { if (nextErr) this.err = nextErr; });
        this.mockCollection = {
            find: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockResolvedValue(),
            insertOne: jest.fn().mockResolvedValue({ insertedId: 'success_id' }),
            updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
            deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            toArray: jest.fn().mockResolvedValue(),
            aggregate: jest.fn().mockReturnThis(),
            countDocuments: jest.fn().mockResolvedValue(3),
        };
        this.mockDb = {
            collection: jest.fn().mockReturnValue(this.mockCollection),
        };
        this.mockBucket = {
            bucket: 'head',
        }
        this.locals = { db: this.mockDb, bucket: this.mockBucket };
        this.mockCreateError = jest.spyOn(helpers, 'createError').mockImplementation((message, status) => {
            const error = new Error(message);
            error.status = status;
            return error;
        });

        // === route specific functions ==================
        // categories
        this.mockMoveFilesToOther = jest.spyOn(helpers, 'moveFilesToOther').mockResolvedValue();
        
        // items
        this.creditsResponse = 321;
        this.bufferResponse = Buffer.from('this is a file source');
        this.thumbnailResponse = Buffer.from('this is a thumbnail');
        this.gcsResponse = 'file.url';
        this.idResponse = '4n_1d_f0r_f1l35';

        this.mockCategoryExists = jest.spyOn(helpers, 'categoryExists').mockResolvedValue(true);
        this.mockIsSuperAdmin = jest.spyOn(helpers, 'isSuperAdmin').mockResolvedValue(false);
        this.mockGetCredits = jest.spyOn(helpers, 'getCredits').mockResolvedValue(this.creditsResponse);
        this.mockDeductCredits = jest.spyOn(helpers, 'deductCredits').mockResolvedValue();
        this.mockRemoveBackground = jest.spyOn(helpers, 'removeBackground').mockResolvedValue(this.bufferResponse);
        this.mockb64ToBuffer = jest.spyOn(helpers, 'b64ToBuffer').mockResolvedValue(this.bufferResponse);
        this.mockCreateImageThumbnail = jest.spyOn(helpers, 'createImageThumbnail').mockResolvedValue(this.thumbnailResponse);
        this.mockUploadToGCS = jest.spyOn(helpers, 'uploadToGCS').mockResolvedValue(this.gcsResponse);
        this.mockDeleteFromGCS = jest.spyOn(helpers, 'deleteFromGCS').mockResolvedValue();
        this.mockParse = jest.spyOn(path, 'parse').mockReturnValue({ name: 'blaze-tastic', extension: 'png' });
        this.mockCreateId = jest.spyOn(cuid2, 'createId').mockReturnValue(this.idResponse);
        this.mockBucket = { bucket: 'head' };

        // outfits
        this.whiteBgResponse = Buffer.from('this is a white background image');

        this.mockAddWhiteBackground = jest.spyOn(helpers, 'addWhiteBackground').mockResolvedValue(this.whiteBgResponse)

        // tags
        this.mockMoveTagsToOther = jest.spyOn(helpers, 'moveTagsToOther').mockResolvedValue();
    },

    afterEach() {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    },
};