import { Storage } from '@google-cloud/storage';

export async function bucketConnect() {
    let bucket;
    try {
        console.log(process.env.GCC_private_key)
        console.log(process.env.GCC_private_key.replace(/\\n/g, '\n'))
        const storage = new Storage({
            projectId: process.env.GCC_project_id,
            credentials: {
                type: process.env.GCC_type,
                project_id: process.env.GCC_project_id,
                private_key_id: process.env.GCC_private_key_id,
                private_key: process.env.GCC_private_key.replace(/\\n/g, '\n'),
                client_email: process.env.GCC_client_email,
                client_id: process.env.GCC_client_id,
                auth_uri: process.env.GCC_auth_uri,
                token_uri: process.env.GCC_token_uri,
                auth_provider_x509_cert_url: process.env.GCC_auth_provider_x509_cert_url,
                client_x509_cert_url: process.env.GCC_client_x509_cert_url,
                universe_domain: process.env.GCC_universe_domain
            }
        });
        
        bucket = storage.bucket('edie-styles-virtual-closet');

        return bucket;
    } catch (err) {
        console.error(err)
    }
}
