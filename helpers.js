import { serviceAuth, bucket, db } from './server.js';
import { MongoClient } from 'mongodb';
import { GoogleAuth } from 'google-auth-library';
import { Storage } from '@google-cloud/storage';
import axios from 'axios';

export const helpers = {
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
            console.error(err);
            throw err;
        }
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
            
            bucket = storage.bucket('edie-styles-virtual-closet');

            return { serviceAuth, bucket };
        } catch (err) {
            throw err;
        }
    },

    // convert b64 to blob then to buffer
    async b64ToBuffer(b64str) {
        const validTypes = [
            'data:image/png;base64',
            'data:image/jpg;base64',
            'data:image/jpeg;base64'
        ];

        if (!(typeof b64str === 'string' && validTypes.includes(b64str.split(',')[0]))) {
            throw new Error('Not a valid base64 image string');
        }

        let buffer;
        try {
            const blob = await fetch(b64str).then(res => res.blob());
            buffer = await blob.arrayBuffer().then(arrayBuffer => Buffer.from(arrayBuffer)); 
            if (!Buffer.isBuffer(buffer)) {
                throw new Error('Base64 string not successfully converted to buffer');
            }
        } catch (err) {
            throw err;
        }
        
        return buffer;
    },

    // upload image file to GCF for processing/uploading
    async uploadToGCF(fileSrc, fullGcsDest, smallGcsDest) {
        // get id token to use google cloud function
        const client = await serviceAuth.getIdTokenClient(process.env.GCF_URL);
        const idToken = await client.idTokenProvider.fetchIdToken(process.env.GCF_URL);

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

    // upload file to GCS given destination
    async uploadToGCS(gcsDest, fileBuffer) {
        if (gcsDest === '') {
            throw new Error('Invalid GCS destination');
        }

        if (!Buffer.isBuffer(fileBuffer)) {
            throw new Error('Must be a file buffer');
        }

        let url;
        try {
            const gcsFile = bucket.file(gcsDest);
            await gcsFile.save(fileBuffer);
            url = await gcsFile.publicUrl();  
        } catch (err) {
            throw err;
        }
        
        return url;
    },

    // delete file from GCS given destination
    async deleteFromGCS(gcsDest) {
        const gcsFile = bucket.file(gcsDest)
        await gcsFile.delete();
    },

    // move all files from one category to the Other category
    async moveFilesToOther(categoryId) {
        // get all files associated with category
        const collection = db.collection('categories');
        const files = await collection.find(
            { _id: ObjectId(categoryId) },
            { _id: 0, name: 0, items: 1 }
        ).toArray();
        
        // move all files to "Other" category
        await collection.updateOne(
            { _id: 0 },
            {
                $push: {
                    items: {
                        $each: files[0].items
                    }
                }
            }
        );
    }
};
              