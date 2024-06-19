import { MongoClient, ObjectId } from 'mongodb';
import { GoogleAuth } from 'google-auth-library';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

export const helpers = {
    // checks if given string is a valid MongoDB id
    isValidId(id) {
        if (typeof id !== 'string') {
            return false;
        }

        if (ObjectId.isValid(id)) {
            if (String(new ObjectId(id)) === id) {
                return true;
            } else {
                return false;
            }
        }

        return false;
    },

    // checks if given category id is the Other category id
    isOtherCategory(id) {
        return id === 0 || id === '0';
    },

    // creates an error and gives it a status
    createError(message, status = 500) {
        if (!message || !(typeof message === 'string')) {
            message = 'there was an error'
        } 

        const err = new Error(message);
        err.status = status;
        
        return err;
    },

    // convert b64 to blob then to buffer
    async b64ToBuffer(b64str) {
        const validTypes = [
            'data:image/png;base64',
            'data:image/jpg;base64',
            'data:image/jpeg;base64'
        ];

        if (!(typeof b64str === 'string' && validTypes.includes(b64str.split(',')[0]))) {
            throw this.createError('not a valid base64 image string', 500);
        }

        let buffer;
        try {
            const response = await fetch(b64str);
            
            if (!response.ok) {
                throw this.createError('error with conversion of b64 to blob', 500);
            }

            const blob = await response?.blob();
            if (!blob) {
                throw this.createError('blob does not exist', 500)
            }

            const arrayBuffer = await blob?.arrayBuffer();
            if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) {
                throw this.createError('blob not successfully converted to array buffer')
            }

            buffer = Buffer.from(arrayBuffer);
            if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
                throw this.createError('arrayBuffer not successfully converted to buffer', 500);
            }
        } catch (err) {
            throw err;
        }
        
        return buffer;
    },

    async removeBackground(base64Image) {
        const validTypes = [
            'data:image/png;base64',
            'data:image/jpg;base64',
            'data:image/jpeg;base64'
        ];

        if (!(typeof base64Image === 'string' && validTypes.includes(base64Image.split(',')[0]))) {
            throw this.createError('not a valid base64 image string', 500);
        }

        // call Photoroom API to remove background from image
        const response = await fetch('https://sdk.photoroom.com/v1/segment', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.PHOTOROOM_API_KEY,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                image_file_b64: base64Image.split(',')[1],
                crop: true
            })
        });
        
        if (!response.ok) {
            throw this.createError('error with Photoroom remove background', 500);
        }

        // convert resulting image to buffer
        const image = await response?.json();
        const image64 = image?.result_b64;

        if (!image64) {
            throw this.createError('Photoroom json did not return valid b64 string', 500);
        }

        const buffer = await this.b64ToBuffer(`data:image/png;base64,${image64}`);

        if (!buffer || !Buffer.isBuffer(buffer)) {
            throw this.createError('failed to remove background: conversion from b64 to buffer failed', 500);
        }

        return buffer;
    },

    async createImageThumbnail(imgBuffer, width = 300, height = 300) {
        if (!imgBuffer || !Buffer.isBuffer(imgBuffer) || imgBuffer.length === 0) {
            throw this.createError('invalid buffer input', 500);
        }
        
        let thumbBuffer;
        try {
            thumbBuffer = await sharp(imgBuffer)
            .resize({
                width: width,
                height: height,
                fit: 'inside'
            })
            .png()
            .toBuffer();

            if (!thumbBuffer || !Buffer.isBuffer(thumbBuffer)) {
                throw this.createError('error creating image thumbnail', 500);
            }
        } catch (err) {
            throw err;
        }

        return thumbBuffer
    },

    // connect to Google Cloud
    async googleConnect() {
        let serviceAuth;
        let bucket;

        try {
            const credentials = {
                type: process.env.GCS_type,
                project_id: process.env.GCS_project_id,
                private_key_id: process.env.GCS_private_key_id,
                private_key: process.env.GCS_private_key.replace(/\\n/g, '\n'),
                client_email: process.env.GCS_client_email,
                client_id: process.env.GCS_client_id,
                auth_uri: process.env.GCS_auth_uri,
                token_uri: process.env.GCS_token_uri,
                auth_provider_x509_cert_url: process.env.GCS_auth_provider_x509_cert_url,
                client_x509_cert_url: process.env.GCS_client_x509_cert_url,
                universe_domain: process.env.GCS_universe_domain
            }

            serviceAuth = new GoogleAuth({
                projectId: process.env.GCS_project_id,
                credentials: credentials
            });

            const storage = new Storage({
                projectId: process.env.GCS_project_id,
                credentials: credentials
            });
            
            if (process.env.NODE_ENV === 'production') {
                bucket = storage.bucket('edie-styles-virtual-closet');
            } 
            else if (process.env.NODE_ENV === 'test') {
                bucket = storage.bucket('edie-styles-virtual-closet-test');
            } else {
                bucket = storage.bucket('edie-styles-virtual-closet-dev');
            }
            

            return { serviceAuth, bucket };
        } catch (err) {
            throw err;
        }
    },

    // connect to MongoDB
    async mongoConnect() {
        let mongoClient;
        let db;
        try {
            mongoClient = new MongoClient(process.env.DB_URI);

            await mongoClient.connect();
            if (process.env.NODE_ENV === 'test') {
                db = mongoClient.db(process.env.DB_NAME_TEST);
            } 
            else if (process.env.NODE_ENV === 'production') {
                db = mongoClient.db(process.env.DB_NAME_PROD);
                console.log('Connected to database: production');
            } 
            else {
                db = mongoClient.db(process.env.DB_NAME_DEV);
                console.log('Connected to database: dev');
            }

            return db;
        } catch (err) {
            throw err;
        }
    },

    // upload file to GCS given destination
    async uploadToGCS(bucket, gcsDest, fileBuffer) {
        if (!bucket) {
            throw this.createError('bucket must be provided to upload to GCS', 500);
        }

        if (!gcsDest || gcsDest?.split('.')[1] !== 'png') {
            throw this.createError('invalid or missing gcs dest provided', 500);
        }

        if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
            throw this.createError('file buffer must be provided to upload to GCS', 500);
        }

        let url;
        try {
            const gcsFile = bucket.file(gcsDest);
            if (!gcsFile) {
                throw this.createError('conversion of destination to file failed', 500);
            }

            await gcsFile.save(fileBuffer);
            url = await gcsFile.publicUrl(); 

            if (!url) {
                throw this.createError('fetching of file url failed', 500);
            }
        } catch (err) {
            throw err;
        }
        
        return url;
    },

    // delete file from GCS given destination
    async deleteFromGCS(bucket, gcsDest) {
        if (!bucket) {
            throw this.createError('bucket must be provided to delete from GCS', 500);
        }

        if (!gcsDest) {
            throw this.createError('destination must be provided to delete from GCS', 500);
        }

        try {
            const gcsFile = bucket.file(gcsDest)
            if (!gcsFile) {
                throw this.createError('conversion of destination to file failed', 500);
            }

            await gcsFile.delete();
        } catch (err) {
            throw err;
        }

        return Promise.resolve();
    },

    // move all files from one category to the Other category
    async moveFilesToOther(db, categoryId) {
        if (!db) {
            throw this.createError('database instance required to move files to other category', 500);
        }

        if (this.isOtherCategory(categoryId)) {
            throw this.createError('cannot move files from Other to Other', 500);
        }

        if (!this.isValidId(categoryId)) {
            throw this.createError('failed to move files to other: invalid or missing category id', 400);
        }

        // get all files associated with category
        const collection = db.collection('categories');
        const category = await collection.findOne({ _id: ObjectId(categoryId) });
        
        if (!category) {
            throw this.createError('category does not exist', 404);
        }

        const files = category?.items;
        
        // move all files to "Other" category
        await collection.updateOne(
            { _id: 0 },
            {
                $push: {
                    items: {
                        $each: files
                    }
                }
            }
        );
    },

    // determines if given client is a super admin
    async isSuperAdmin(db, clientId) {
        if (!db) {
            throw this.createError('database instance required to check client super admin status', 500);
        }

        if (!this.isValidId(clientId)) {
            throw this.createError('failed to get super admin status: invalid or missing client id', 400);
        }

        const collection = db.collection('clients');
        const client = await collection.findOne({ _id: ObjectId(clientId) });
        
        const isSuperAdmin = client?.isSuperAdmin || false;

        return isSuperAdmin;
    },

    // gets how many credits a client has
    async getCredits(db, clientId) {
        if (!db) {
            throw this.createError('database instance required to get client credits', 500);
        }

        if (!this.isValidId(clientId)) {
            throw this.createError('failed to get credits: invalid or missing client id', 400);
        }

        const collection = db.collection('clients');
        const client = await collection.findOne({ _id: ObjectId(clientId) });
        
        const credits = parseInt(client?.credits);
        if (isNaN(credits)) {
            throw this.createError('client does not have any credits or does not exist', 403);
        }

        return credits;
    },

    // deducts a credit from a client
    async deductCredits(db, clientId, currCredits) {
        if (!db) {
            throw this.createError('database instance required to deduct credits', 500);
        }

        if (!this.isValidId(clientId)) {
            throw this.createError('failed to deduct credits: invalid or missing client id', 400);
        }
        
        if (isNaN(parseInt(currCredits))) {
            throw this.createError('credits is missing or not a number', 400);
        }

        const collection = db.collection('clients');
        const result = await collection.updateOne(
            { _id: ObjectId(clientId) },
            {
                $set: {
                    credits: currCredits - 1
                }
            }
        );

        if (result.modifiedCount === 0) {
            throw this.createError('no credits were deducted', 500);
        }

        return Promise.resolve();
    }

    /*
    // upload image file to GCF for processing/uploading
    async uploadToGCF(fileSrc, fullGcsDest, smallGcsDest) {
        const validTypes = [
            'data:image/png;base64',
            'data:image/jpg;base64',
            'data:image/jpeg;base64'
        ];

        if (!(typeof fileSrc === 'string' && validTypes.includes(fileSrc.split(',')[0]))) {
            throw new Error('Not a valid fileSrc');
        }

        if (fullGcsDest === '' || smallGcsDest === '') {
            throw new Error('GCS destination cannot be empty');
        }
        
        // get id token to use google cloud function
        let idToken;
        try {
            const client = await serviceAuth.getIdTokenClient(process.env.GCF_URL);
            idToken = await client.idTokenProvider.fetchIdToken(process.env.GCF_URL);
        } catch (err) {
            throw err;
        }

        // send file to google cloud function to remove background and store
        const response = await axios.post(
            'https://us-central1-avid-invention-410701.cloudfunctions.net/upload-item', 
            { fileSrc, fullGcsDest, smallGcsDest }, 
            { headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const fullFileUrl = response.data.fullFileUrl;
        const smallFileUrl = response.data.smallFileUrl;

        return { fullFileUrl, smallFileUrl };
    },
    */
};
              