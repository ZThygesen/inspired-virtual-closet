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
    let mockVerifyId;

    let mockToken;
    let mockSign;
    let mockVerify;

    let mockCreateError;


    beforeEach(() => {
        expect(process.env.NODE_ENV).toBe('test');

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn().mockReturnThis()
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
        mockVerifyId = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
        mockVerifyId.mockReturnValue({ getPayload: mockGetPayload });

        mockToken = 'the-tokenator';
        mockSign = jest.spyOn(jwt, 'sign');
        mockSign.mockReturnValue(mockToken);

        mockVerify = jest.spyOn(jwt, 'verify');
        mockVerify.mockReturnValue(); 

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

    describe('authenticate', () => {
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

            await auth.authenticate(req, mockRes, mockNext);

            expect(mockVerifyId).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(mockSign).toHaveBeenCalledWith({ id: user._id, isAdmin: user.isAdmin, isSuperAdmin: false }, process.env.JWT_SECRET);
            expect(mockRes.cookie).toHaveBeenCalledWith('token', mockToken, { httpOnly: true, secure: true, sameSite: 'strict' });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ user: user });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should fail with missing credential', async () => {
            data.credential = '';
            const req = { body: data, locals: { db: mockDb }};

            await auth.authenticate(req, mockRes, mockNext);

            expect(mockVerifyId).not.toHaveBeenCalled();
            expect(mockGetPayload).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.cookie).not.toHaveBeenCalled();
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

            await auth.authenticate(req, mockRes, mockNext);

            expect(mockVerifyId).not.toHaveBeenCalled();
            expect(mockGetPayload).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.cookie).not.toHaveBeenCalled();
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
            mockVerifyId.mockImplementation(() => { throw error });

            const req = { body: data, locals: { db: mockDb }};

            await auth.authenticate(req, mockRes, mockNext);

            expect(mockVerifyId).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.cookie).not.toHaveBeenCalled();
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

            await auth.authenticate(req, mockRes, mockNext);

            expect(mockVerifyId).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.cookie).not.toHaveBeenCalled();
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
            mockCollection.findOne.mockRejectedValue(error);

            const req = { body: data, locals: { db: mockDb }};

            await auth.authenticate(req, mockRes, mockNext);

            expect(mockVerifyId).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.cookie).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('findOne failed');
        });

        it('should handle no user found', async () => {
            mockCollection.findOne.mockResolvedValue();

            const req = { body: data, locals: { db: mockDb }};

            await auth.authenticate(req, mockRes, mockNext);

            expect(mockVerifyId).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(mockSign).not.toHaveBeenCalled();
            expect(mockRes.cookie).not.toHaveBeenCalled();
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

            await auth.authenticate(req, mockRes, mockNext);

            expect(mockVerifyId).toHaveBeenCalledWith({ idToken: data.credential, audience: data.clientId });
            expect(mockGetPayload).toHaveBeenCalled();
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(mockSign).toHaveBeenCalledWith({ id: user._id, isAdmin: user.isAdmin, isSuperAdmin: false }, process.env.JWT_SECRET);
            expect(mockRes.cookie).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('sign failed');
        });
    });

    describe('verify', () => {
        let data;
        let user;
        let tokenUser;
        beforeEach(async () => {
            data = { token: mockToken };

            user = {
                _id: new ObjectId(),
                email: mockEmail,
                firstName: 'John',
                lastName: 'Doe',
                isAdmin: false
            };

            tokenUser = {
                id: user._id.toString(),
                isAdmin: user.isAdmin
            };

            mockVerify.mockReturnValue(tokenUser);
            mockCollection.findOne.mockResolvedValue(user);
        });

        it('should verify', async () => {
            const req = { cookies: data, locals: { db: mockDb }};

            await auth.verify(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith(data.token, process.env.JWT_SECRET);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(tokenUser.id) });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ user: user });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should fail with missing token', async () => {
            data.token = '';
            const req = { cookies: data, locals: { db: mockDb }};

            await auth.verify(req, mockRes, mockNext);

            expect(mockVerify).not.toHaveBeenCalled();
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('token required to verify authentication');
        });

        it('should fail if verify fails', async () => {
            const error = new Error('verify failed');
            error.status = 401;
            mockVerify.mockImplementation(() => { throw error });

            const req = { cookies: data, locals: { db: mockDb }};

            await auth.verify(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith(data.token, process.env.JWT_SECRET);
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('verify failed');
        });

        it('should fail with missing user id', async () => {
            tokenUser.id = '';
            mockVerify.mockReturnValue(tokenUser);

            const req = { cookies: data, locals: { db: mockDb }};

            await auth.verify(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to check user authorization: invalid or missing user id');
        });

        it('should fail with invalid user id', async () => {
            tokenUser.id = 'not-valid-id';
            mockVerify.mockReturnValue(tokenUser);

            const req = { cookies: data, locals: { db: mockDb }};

            await auth.verify(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
            expect(mockDb.collection).not.toHaveBeenCalled();
            expect(mockCollection.findOne).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(400);
            expect(err.message).toBe('failed to check user authorization: invalid or missing user id');
        });

        it('should fail if findOne fails', async () => {
            const error = new Error('findOne failed');
            error.status = 401;
            mockCollection.findOne.mockRejectedValue(error);

            const req = { cookies: data, locals: { db: mockDb }};

            await auth.verify(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(tokenUser.id) });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('findOne failed');
        });

        it('should fail if findOne returns nothing', async () => {
            mockCollection.findOne.mockResolvedValue();

            const req = { cookies: data, locals: { db: mockDb }};

            await auth.verify(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
            expect(mockDb.collection).toHaveBeenCalledWith('clients');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId(tokenUser.id) });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('no client found with given user id');
        });
    });

    describe('authenticateJWT', () => {
        let data;
        let tokenUser;
        beforeEach(async () => {
            data = { token: mockToken };

            tokenUser = {
                id: (new ObjectId()).toString(),
                isAdmin: false
            };

            mockVerify.mockReturnValue(tokenUser);
        });

        it('should authenticate jwt', async () => {
            const req = { cookies: data };

            auth.authenticateJWT(req, mockRes, mockNext);

            expect(req.user).toBe(tokenUser);

            expect(mockVerify).toHaveBeenCalledWith(data.token, process.env.JWT_SECRET);
            expect(mockNext).toHaveBeenCalledWith();
        });

        it('should fail with missing token', async () => {
            const req = { };

            auth.authenticateJWT(req, mockRes, mockNext);

            expect(mockVerify).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(err);
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('token required to authenticate JWT');
        });

        it('should handle verify failure', async () => {
            const error = new Error('verify failed');
            error.status = 401;
            mockVerify.mockImplementation(() => { throw error });

            const req = { cookies: data };

            auth.authenticateJWT(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith(data.token, process.env.JWT_SECRET);
            expect(mockNext).toHaveBeenCalledWith(err);
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('verify failed');
        });

        it('should fail with no user found', async () => {
            mockVerify.mockReturnValue();

            const req = { cookies: data };

            auth.authenticateJWT(req, mockRes, mockNext);

            expect(mockVerify).toHaveBeenCalledWith(data.token, process.env.JWT_SECRET);
            expect(mockNext).toHaveBeenCalledWith(err);
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('no user found from token');
        });
    });

    describe('requireAdmin', () => {
        it('should accept admin', async () => {
            const req = { user: { isAdmin: true }};

            auth.requireAdmin(req, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
        });

        it('should fail if not admin', async () => {
            const req = { user: { isAdmin: false }};

            auth.requireAdmin(req, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('only admins are authorized for this action');
        });

        it('should fail if user not given', async () => {
            const req = { };

            auth.requireAdmin(req, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('only admins are authorized for this action');
        });
    });

    describe('requireSuperAdmin', () => {
        it('should accept super admin', async () => {
            const req = { user: { isSuperAdmin: true }};

            auth.requireSuperAdmin(req, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
        });

        it('should fail if not super admin', async () => {
            const req = { user: { isSuperAdmin: false }};

            auth.requireSuperAdmin(req, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('only super admins are authorized for this action');
        });

        it('should fail if user not given', async () => {
            const req = { };

            auth.requireSuperAdmin(req, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(401);
            expect(err.message).toBe('only super admins are authorized for this action');
        });
    });

    describe('logout', () => {
        it('should logout', async () => {
            await auth.logout({ }, mockRes, mockNext);

            expect(mockRes.cookie).toHaveBeenCalledWith('token', '', { httpOnly: true, secure: true, sameSite: 'strict', expires: new Date(1) });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Success!' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle cookie failure', async () => {
            const error = new Error('cookie failed');
            error.status = 500;
            mockRes.cookie.mockImplementation(() => { throw error });

            await auth.logout({ }, mockRes, mockNext);

            expect(mockRes.cookie).toHaveBeenCalledWith('token', '', { httpOnly: true, secure: true, sameSite: 'strict', expires: new Date(1) });
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(err).toBeInstanceOf(Error);
            expect(err.status).toBe(500);
            expect(err.message).toBe('cookie failed');
        });
        
    });
});