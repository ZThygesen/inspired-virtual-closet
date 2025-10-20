import { jest } from '@jest/globals';
import { helpers } from '../../helpers'

export const unitHelpers = {
    err: null,
    mockRes: null,
    mockNext: null,
    mockCollection: null,
    mockDb: null,
    locals: null,
    mockCreateError: null,

    // route specific functions
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
            countDocuments: jest.fn().mockResolvedValue(3),
        };
        this.mockDb = {
            collection: jest.fn().mockReturnValue(this.mockCollection),
        };
        this.locals = { db: this.mockDb };
        this.mockCreateError = jest.spyOn(helpers, 'createError').mockImplementation((message, status) => {
            const error = new Error(message);
            error.status = status;
            return error;
        });

        // route specific functions
        // tags
        this.mockMoveTagsToOther = jest.spyOn(helpers, 'moveTagsToOther').mockResolvedValue();
    },

    afterEach() {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    },
};