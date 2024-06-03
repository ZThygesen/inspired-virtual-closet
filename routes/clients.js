import express from 'express';
import { ObjectId } from 'mongodb';
import { helpers } from '../helpers';

const clients = {
    async post(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('clients');

            if (!req?.body?.firstName || !req?.body?.lastName) {
                throw helpers.createError('both first name and last name fields are required for client creation', 400);
            }

            if (!req?.body?.email) {
                throw helpers.createError('an email is required for client creation', 400);
            }

            if (req?.body?.isAdmin === null || req?.body?.isAdmin === undefined) {
                throw helpers.createError('a role status is required for client creation', 400);
            }

            const client = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                isAdmin: req.body.isAdmin
            }
            
            const result = await collection.insertOne(client);

            if (!result.insertedId) {
                throw helpers.createError('client was not inserted into database', 500);
            }

            res.status(201).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async get(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('clients');
            const clients = await collection.find({ }).toArray();
    
            res.status(200).json(clients);
        } catch (err) {
            next(err);
        }
    },

    async patch(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('clients');

            const clientId = req?.params?.clientId;
            if (!clientId) {
                throw helpers.createError('client id is required to update client', 400);
            }

            if (!helpers.isValidId(clientId)) {
                throw helpers.createError('invalid client id', 400);
            }

            if (!req?.body?.newFirstName || !req?.body?.newLastName) {
                throw helpers.createError('both first name and last name fields are required for client update', 400);
            }

            if (!req?.body?.newEmail) {
                throw helpers.createError('an email is required for client update', 400);
            }

            if (req?.body?.newIsAdmin === null || req?.body?.newIsAdmin === undefined) {
                throw helpers.createError('a role status is required for client update', 400);
            }
            
            const result = await collection.updateOne(
                { _id: ObjectId(clientId) },
                {
                    $set: {
                        firstName: req.body.newFirstName,
                        lastName: req.body.newLastName,
                        email: req.body.newEmail,
                        isAdmin: req.body.newIsAdmin
                    }
                }
            );

            if (result.modifiedCount === 0) {
                throw helpers.createError('update failed: client not found with given client id or nothing was updated', 404);
            }
    
            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('clients');

            const clientId = req?.params?.clientId;
            if (!clientId) {
                throw helpers.createError('client id is required to delete client', 400);
            }

            if (!helpers.isValidId(clientId)) {
                throw helpers.createError('invalid client id', 400);
            }

            const result = await collection.deleteOne({ _id: ObjectId(clientId) });
            
            if (result.deletedCount === 0) {
                throw helpers.createError('deletion failed: client not found with given client id', 404);
            }

            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    }
};

const router = express.Router();

router.post('/', clients.post);
router.get('/', clients.get);
router.patch('/:clientId', clients.patch);
router.delete('/:clientId', clients.delete);

export { clients, router as clientsRouter };
