import express from 'express';
import { ObjectId } from 'mongodb';

export const clients = {
    async post(req, res, next) {
        try {
            const { db } = req.locals;
            const collection = db.collection('clients');

            if (!req.body.firstName || !req.body.lastName) {
                const err = new Error('both first name and last name fields are required for client creation');
                err.status = 400;
                throw err;
            }

            if (!req.body.email) {
                const err = new Error('an email is required for client creation');
                err.status = 400;
                throw err;
            }

            if (req.body.isAdmin === null || req.body.isAdmin === undefined) {
                const err = new Error('a role status is required for client creation');
                err.status = 400;
                throw err;
            }

            const client = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                isAdmin: req.body.isAdmin
            }
            
            const result = await collection.insertOne(client);

            if (!result.insertedId) {
                const err = new Error('client was not inserted into database');
                err.status = 500;
                throw err;
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

            if (!req.params || !req.params.clientId) {
                const err = new Error('client id is required to update client');
                err.status = 400;
                throw err;
            }

            if (!req.body.newFirstName || !req.body.newLastName) {
                const err = new Error('both first name and last name fields are required for client update');
                err.status = 400;
                throw err;
            }

            if (!req.body.newEmail) {
                const err = new Error('an email is required for client update');
                err.status = 400;
                throw err;
            }

            if (req.body.newIsAdmin === null || req.body.newIsAdmin === undefined) {
                const err = new Error('a role status is required for client update');
                err.status = 400;
                throw err;
            }
            
            const result = await collection.updateOne(
                { _id: ObjectId(req.params.clientId) },
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
                const err = new Error('update failed: client not found with given client id');
                err.status = 404;
                throw err;
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

            if (!req.params || !req.params.clientId) {
                const err = new Error('client id is required to delete client');
                err.status = 400;
                throw err;
            }

            const result = await collection.deleteOne({ _id: ObjectId(req.params.clientId) });
            
            if (result.deletedCount === 0) {
                const err = new Error('deletion failed: client not found with given client id');
                err.status = 404;
                throw err;
            }

            res.status(200).json({ message: 'Success!' });
        } catch (err) {
            next(err);
        }
    }
}

const router = express.Router();

router.post('/', clients.post);
router.get('/', clients.get);
router.patch('/:clientId', clients.patch);
router.delete('/:clientId', clients.delete);

export default router;
