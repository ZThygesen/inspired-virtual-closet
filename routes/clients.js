import express from 'express';
import { ObjectId } from 'mongodb';
import { helpers } from '../helpers.js';
import { auth } from './auth.js';

const clients = {
    async post(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('clients');

            const firstName = req?.body?.firstName;
            const lastName = req?.body?.lastName;
            if (!firstName || !lastName) {
                throw helpers.createError('both first name and last name fields are required for client creation', 400);
            }

            const email = req?.body?.email;
            if (!email) {
                throw helpers.createError('an email is required for client creation', 400);
            }

            const credits = parseInt(req?.body?.credits);
            if (isNaN(credits)) {
                throw helpers.createError('credits missing or must be of type number to create client', 400);
            }

            const isAdmin = req?.body?.isAdmin;
            if (isAdmin === null || isAdmin === undefined) {
                throw helpers.createError('a role status is required for client creation', 400);
            }

            const client = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                credits: credits,
                isAdmin: isAdmin
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

    async getClient(req, res, next) {
        try {
            const clientId = req?.params?.clientId;
            if (!helpers.isValidId(clientId)) {
                throw helpers.createError('failed to get client: invalid or missing client id', 400);
            }

            const { db } = req.locals;
            const collection = db.collection('clients');
            const client = await collection.findOne({ _id: ObjectId(clientId) });

            if (!client) {
                throw helpers.createError('client not found', 404)
            }
    
            res.status(200).json(client);
        } catch (err) {
            next(err);
        }
    },

    async patch(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('clients');

            const clientId = req?.params?.clientId;
            if (!helpers.isValidId(clientId)) {
                throw helpers.createError('failed to update client: invalid or missing client id', 400);
            }

            const firstName = req?.body?.newFirstName;
            const lastName = req?.body?.newLastName;
            if (!firstName || !lastName) {
                throw helpers.createError('both first name and last name fields are required for client update', 400);
            }

            const email = req?.body?.newEmail;
            if (!email) {
                throw helpers.createError('an email is required for client update', 400);
            }

            const credits = parseInt(req?.body?.newCredits);
            if (isNaN(credits)) {
                throw helpers.createError('credits missing or must be of type number to update client', 400);
            }

            const isAdmin = req?.body?.newIsAdmin;
            if (isAdmin === null || isAdmin === undefined) {
                throw helpers.createError('a role status is required for client update', 400);
            }
            
            const result = await collection.updateOne(
                { _id: ObjectId(clientId) },
                {
                    $set: {
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        credits: credits,
                        isAdmin: isAdmin
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
            if (!helpers.isValidId(clientId)) {
                throw helpers.createError('failed to delete client: invalid or missing client id', 400);
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

router.post('/', auth.requireSuperAdmin, clients.post);
router.get('/', auth.requireAdmin, clients.get);
router.get('/:clientId', clients.getClient);
router.patch('/:clientId',  auth.requireSuperAdmin, clients.patch);
router.delete('/:clientId', auth.requireSuperAdmin, clients.delete);

export { clients, router as clientsRouter };
