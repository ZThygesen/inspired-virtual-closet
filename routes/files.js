import express from 'express';
const router = express.Router();
import { db } from '../server.js';
import { ObjectId } from 'mongodb';
import { exec } from 'child_process';
import Jimp from 'jimp';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import imglyRemoveBackground from '@imgly/background-removal-node'
import blobToBuffer from 'blob-to-buffer';

router.post('/', async (req, res, next) => {
    try {
        const collection = db.collection('categories');

        console.log(req.body.test);

        // await collection.updateOne(
        //     { _id: ObjectId(req.body.categoryId) },
        //     {
        //         $push: {
        //             items: {
        //                 $each: req.body.files
        //             }
        //         }
        //     }
        // );

        res.status(201).json({ message: 'Success!'});
    } catch (err) {
        err.status = 400;
        next(err);
    }
});

// upload files
router.post('/test', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        const { filesStr } = req.fields;
        const files = JSON.parse(filesStr);

        const inputDir = 'temp_uncprocessed_imgs';
        await fs.mkdir(inputDir, { recursive: true });

        // const outputDir = 'temp_processed_imgs';
        // await fs.mkdir(outputDir, { recursive: true });

        const processedImgs = await Promise.all(files.map(async (file) => {
            // const fileName = file.id;
            // const fileType = file.fileType.split('/')[1];
            // const imgBuffer = Buffer.from(file.src.split(',')[1], 'base64');
            // const img = await Jimp.read(imgBuffer);
            // const test = await img.getBufferAsync(Jimp.MIME_JPEG)
            // write temporary fie
            // const inputFilePath = `${inputDir}/${fileName}.${fileType}`;
            // await fs.writeFile(inputFilePath, imgBuffer);
            // await img.writeAsync(inputFilePath)
            const blob = await fetch(file.src).then(res => res.blob());
            const output = await imglyRemoveBackground(blob);
            // const result = await Jimp.read(output)
            // const imageURL = URL.createObjectURL(output);
            // window.open(imageURL)
            // const output = await Rembg.remove
            console.log(output)
            const outputFilePath = `temp_processed_imgs/test1.png`;
            const result = await output.arrayBuffer().then(arrayBuffer => Buffer.from(arrayBuffer));
            await fs.writeFile(outputFilePath, result);

            // execute python script to remove background
            const pythonScript = 'remove_bg.py';
            // const command = `python ${pythonScript} ${inputFilePath} ${outputFilePath}`;

            // return new Promise((resolve, reject) => {
            //     exec(command, (error, stdout, stderr) => {
            //         if (error) {
            //             reject(error)
            //         } else {
            //             resolve(stdout.trim());
            //         }
            //     });
            // });
            return 1;
        }));

        console.log(processedImgs);

        res.status(201).json({ message: 'Success!'});
    } catch (err) {
        err.status = 400;
        next(err);
    }
});

function getMIMEType(fileType) {

}

// get files for given client
router.get('/:clientId', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        const files = await collection.aggregate([
            {
                $project: {
                    _id: 1,
                    name: 1,
                    items: { $filter: {
                        input: '$items',
                        as: 'item',
                        cond: { $eq: ['$$item.clientId', req.params.clientId] }
                    }},
                }
            }
        ]).toArray();
        
        res.json(files);
    } catch (err) {
        next(err);
    }
});

// update file name
router.patch('/', async (req, res, next) => {
    try {
        const collection = db.collection('categories');
        const id = req.body.categoryId === 0 ? 0 : ObjectId(req.body.categoryId);
        await collection.updateOne(
            { _id: id, 'items.fileId': req.body.item.fileId },
            {
                $set: {
                    'items.$.fileName': req.body.newName
                }
            }
        );

        res.json({ message: 'Success!' });
    } catch (err) {
        err.status = 400;
        next(err);
    }
});

// switch file category


// delete file
router.delete('/:categoryId/:fileId', async (req, res, next) => {
    try {
        // first delete from imgbb
        // get file from database
        const collection = db.collection('categories');
        //const id = req.params.categoryId === '0' ? 0 : req.params.categoryId;
        const file = await collection.aggregate([
            {
                $match: {
                    items: {
                        $elemMatch: {
                            fileId: req.params.fileId
                        }
                    }
                },
            },
            {
                $project: {
                    items: {
                        $filter: {
                            input: '$items',
                            as: 'item',
                            cond: {
                                $eq: ['$$item.fileId', req.params.fileId] 
                            }
                        }
                    }
                }
            }
        ]).toArray();

        await deleteFromWeb(file[0].items[0]);

        // then delete from db
        const id = req.params.categoryId === '0' ? 0 : ObjectId(req.params.categoryId);
            
        await collection.updateOne(
            { _id: id },
            {
                $pull: {
                    items: { fileId: req.params.fileId }
                }
            }
        );

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

async function deleteFromWeb(file) {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(file.deleteUrl);

        const deleteBtn = '.link.link--delete';
        await page.waitForSelector(deleteBtn);
        await page.click(deleteBtn);

        const confirmDeleteBtn = '.btn.btn-input.default';
        await page.waitForSelector(confirmDeleteBtn);
        await page.click(confirmDeleteBtn);

        await browser.close();
    } catch (err) {
        console.log(err);
    }
}

export default router;

