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

            const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
            
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
                return res.sendStatus(401);
            }

            jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
                if (err) {
                    return res.sendStatus(403);
                }
                const userId = user?.id;
                if (!helpers.isValidId(userId)) {
                    throw helpers.createError('failed to check user authorization: invalid or missing user id', 400);
                }

                const { db } = req.locals;
                const collection = db.collection('clients');
                const client = await collection.findOne({ _id: ObjectId(userId) });

                if (!client) {
                    return res.sendStatus(404);
                }

                res.status(200).json({ user: client });
            });
        } catch (err) {
            next(err);
        }
    },

    authenticateJWT(req, res, next) {
        const token = req?.cookies?.token;
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                if (err) {
                    return res.sendStatus(403);
                }
                req.user = user;

                next();
            });
        } else {
            res.sendStatus(401);
        }
    },

    requireAdmin(req, res, next) {
        if (!req?.user?.isAdmin) {
            throw helpers.createError('only admins are authorized for this action', 401);
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