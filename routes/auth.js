import express from 'express';
import { ObjectId } from 'mongodb';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
const client = new OAuth2Client();
import { helpers } from '../helpers.js';

const auth = {
    client: new OAuth2Client(),

    async postAuthenticate(req, res, next) {
        const { credential, clientId } = req.body;
        const { db } = req.locals;

        try {
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: clientId
            });
            const payload = ticket.getPayload();

            const collection = db.collection('clients');
            const user = await collection.findOne({ email: payload.email });
            
            if (!user) {
                throw helpers.createError('user not authenticated', 401);
            }

            const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
    
            res.status(200).json({ token, user });
        } catch (err) {
            next(err);
        }
    },

    async postVerify(req, res, next) {
        try {
            const token = req?.body?.token;
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
        const authHeader = req.headers.authorization;
  
        if (authHeader) {
            const token = authHeader.split(' ')[1];

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
    }
};

const router = express.Router();

router.post('/', auth.postAuthenticate);
router.post('/verify-token', auth.postVerify);

export { auth, router as authRouter };