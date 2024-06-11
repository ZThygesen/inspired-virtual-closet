import { jest } from '@jest/globals';
import { auth } from '../../routes/auth.js';
import { ObjectId } from 'mongodb';
import { helpers } from '../../helpers.js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

describe('auth', () => {
    let mockRes;
    let mockNext;
    let err;

    let mockCollection;
    let mockDb;
    
    let mockEmail;
    let mockPayload;
    let mockGetPayload;
    let mockVerify;

    let mockToken;
    let mockSign;

    let mockCreateError;


    beforeEach(() => {
        expect(process.env.NODE_ENV).toBe('test');

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        err = null;
        mockNext = jest.fn((nextErr) => {
            if (nextErr) {
                err = nextErr;
            }
        });

        mockEmail = 'an-email@gmail.com';
        mockPayload = { email: mockEmail };
        mockGetPayload = jest.fn().mockReturnValue(mockPayload);
        mockVerify = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
        mockVerify.mockReturnValue({ getPayload: mockGetPayload });

        mockToken = 'the-tokenator';
        mockSign = jest.spyOn(jwt, 'sign');
        mockSign.mockReturnValue(mockToken);

        mockCollection = {
            findOne: jest.fn().mockResolvedValue()
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

    describe('postAuthenticate', () => {
        let data;
        let user;

        beforeEach(() => {
            data = {
                credential: 'credentiated',
                clientId: 'yet another id'
            };

            user = {
                _id: new ObjectId(),
                email: mockEmail,
                firstName: 'John',
                lastName: 'Doe',
                isAdmin: false
            };

            mockCollection.findOne.mockResolvedValue(user);
        });

        it('should authenticate', async () => {
            const req = { body: data, locals: { db: mockDb }};

            await auth.postAuthenticate(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(mockSign).toHaveBeenCalledWith({ id: user._id }, process.env.JWT_SECRET);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ token: mockToken, user: user });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should fail with missing credential', async () => {
            data.credential = '';
            const req = { body: data, locals: { db: mockDb }};

            await auth.postAuthenticate(req, mockRes, mockNext);

            expect(mockVerify).not.toHaveBeenCalled();
            expect(mockGetPayload).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('credential needed to authenticate user');
        });

        it('should fail with missing client id', async () => {
            delete data.clientId;
            const req = { body: data, locals: { db: mockDb }};

            await auth.postAuthenticate(req, mockRes, mockNext);

            expect(mockVerify).not.toHaveBeenCalled();
            expect(mockGetPayload).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('client id needed to authenticate user');
        });

        it('should handle verifyIdToken failure', async () => {
            const error = new Error('verify failed');
            error.status = 401;
            mockVerify.mockImplementation(() => { throw error });

            const req = { body: data, locals: { db: mockDb }};

            await auth.postAuthenticate(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('verify failed');
        });

        it('should handle getPayload failure', async () => {
            const error = new Error('getPayload failed');
            error.status = 401;
            mockGetPayload.mockImplementation(() => { throw error });

            const req = { body: data, locals: { db: mockDb }};

            await auth.postAuthenticate(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('getPayload failed');
        });

        it('should handle findOne failure', async () => {
            const error = new Error('findOne failed');
            error.status = 401;
            mockGetPayload.mockImplementation(() => { throw error });

            const req = { body: data, locals: { db: mockDb }};

            await auth.postAuthenticate(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('findOne failed');
        });

        it('should handle no user found', async () => {
            mockCollection.mockResolvedValue();

            const req = { body: data, locals: { db: mockDb }};

            await auth.postAuthenticate(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('user not authorized');
        });

        it('should handle sign failure', async () => {
            const error = new Error('sign failed');
            error.status = 401;
            mockSign.mockImplementation(() => { throw error });

            const req = { body: data, locals: { db: mockDb }};

            await auth.postAuthenticate(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(mockSign).toHaveBeenCalled({ token: mockToken, user: user });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('findOne failed');
        });
    });

    describe('postVerify', () => {
        
    });

    describe('authenticateJWT', () => {

    });

    describe('requireAdmin', () => {

    });
});