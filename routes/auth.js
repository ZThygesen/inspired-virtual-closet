import express from 'express';
import { ObjectId } from 'mongodb';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { helpers } from '../helpers.js';

const client = new OAuth2Client();

const auth = {
    async authenticate(req, res, next) {
        try {
            const { credential, clientId } = req?.body;

            if (!credential) {
                throw helpers.createError('credential needed to authenticate user', 400);
            }

            if (!clientId) {
                throw helpers.createError('client id needed to authenticate user', 400);
            }

            const { db } = req.locals;
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: clientId
            });
            const payload = ticket.getPayload();

            const collection = db.collection('clients');
            const user = await collection.findOne({ email: payload.email });
            
            if (!user) {
                throw helpers.createError('user not authorized', 401);
            }

            const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin, isSuperAdmin: user?.isSuperAdmin || false }, process.env.JWT_SECRET);
            
            res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
            res.status(200).json({ user });
        } catch (err) {
            next(err);
        }
    },

    async verify(req, res, next) {
        try {
            const token = req?.cookies?.token;
            if (!token) {
                throw helpers.createError('token required to verify authentication', 401);
            }

            const user = jwt.verify(token, process.env.JWT_SECRET);

            const userId = user?.id;
            if (!helpers.isValidId(userId)) {
                throw helpers.createError('failed to check user authorization: invalid or missing user id', 400);
            }

            const { db } = req.locals;
            const collection = db.collection('clients');
            const client = await collection.findOne({ _id: ObjectId(userId) });

            if (!client) {
                throw helpers.createError('no client found with given user id', 401);
            }

            if (client._id.toString() !== userId ||
                client.isAdmin !== user.isAdmin ||
                (client?.isSuperAdmin || false) !== (user?.isSuperAdmin || false)
            ) {
                throw helpers.createError('client and user do not match', 401);
            }

            res.status(200).json({ user: client });
        } catch (err) {
            next(err);
        }
    },

    async authenticateJWT(req, res, next) {
        try {
            const token = req?.cookies?.token;
            if (!token) {
                throw helpers.createError('token required to authenticate JWT', 401);
            }
            
            const user = jwt.verify(token, process.env.JWT_SECRET);
            if (!user) {
                throw helpers.createError('no user found from token', 401);
            }

            req.user = user;
            next();
        } catch (err) {
            next(err);
        }
    },

    async checkPermissions(req, res, next) {
        try {
            const clientId = req?.params?.clientId;
            if (!helpers.isValidId(clientId)) {
                return next(helpers.createError('client id is invalid or missing', 400));
            }
            const { db } = req.locals;
            const collection = db.collection('clients');
            const client = await collection.findOne({ _id: ObjectId(clientId )});
            if (!client) {
                return next(helpers.createError('client not found', 404));
            }

            switch (true) {
                case req?.user?.isSuperAdmin:
                    // super admin users have all permissions
                    break;
                
                case req?.user?.isAdmin:
                    // admin users have no permissions over super admins
                    if (client?.isSuperAdmin) {
                        return next(helpers.createError('admins have no permissions over super admins', 403));
                    }

                    // admin users only have permissions over admins if it's themselves
                    if (client?.isAdmin) {
                        if (client?._id?.toString() === req?.user?.id) {
                            break;
                        } else {
                            return next(helpers.createError('admins have no permissions over other admins', 403));
                        }
                    }

                    // admin users have permissions over all non-admins
                    break;
            
                default:
                    // non-admins have no permissions over any admin
                    if (client?.isSuperAdmin || client?.isAdmin) {
                        return next(helpers.createError('non-admins have no permissions over any admins', 403))
                    }

                    // non-admins only have permissions over non-admins if it's themselves
                    if (client?._id?.toString() === req?.user?.id) {
                        break;
                    }
                    
                    return next(helpers.createError('non-admins only have permissions over themselves', 403));
            }

            next();
        } catch (err) {
            next(err);
        }
    },

    requireAdmin(req, res, next) {
        if (!req?.user?.isAdmin) {
            return next(helpers.createError('only admins are authorized for this action', 401));
        }

        next();
    },

    requireSuperAdmin(req, res, next) {
        if (!req?.user?.isSuperAdmin) {
            return next(helpers.createError('only super admins are authorized for this action', 401));
        }

        next();
    },

    async logout(req, res, next) {
        try {
            res.cookie('token', '', { httpOnly: true, secure: true, sameSite: 'strict', expires: new Date(1) });
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    }
};

const router = express.Router();

router.post('/', auth.authenticate);
router.post('/verify-token', auth.verify);
router.post('/logout', auth.logout);

export { auth, router as authRouter };