import { bucket } from './server';

export const helpers = {
    // convert b64 to blob then to buffer
    async b64ToBuffer(b64str) {
        const blob = await fetch(b64str).then(res => res.blob());
        const buffer = await blob.arrayBuffer().then(arrayBuffer => Buffer.from(arrayBuffer));

        return buffer;
    },

    // upload file to GCS given destination
    async uploadToGCS(gcsDest, fileBuffer) {
        const gcsFile = bucket.file(gcsDest);
        await gcsFile.save(fileBuffer);
        const url = await gcsFile.publicUrl();
    
        return url;
    },

    // delete file from GCS given destination
    async deleteFromGCS(gcsDest) {
        const gcsFile = bucket.file(gcsDest)
        await gcsFile.delete();
    }
};