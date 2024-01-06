import express from 'express';
const router = express.Router();
import { db } from '../server.js';
import { ObjectId } from 'mongodb';
import puppeteer from 'puppeteer';
import imglyRemoveBackground from '@imgly/background-removal-node'
import axios from 'axios';

// upload file
router.post('/', async (req, res, next) => {
    try {
        // read in file fields
        const { fileSrc, fileName, clientId, categoryId } = req.fields;

        // convert file into blob and remove background
        const blob = await fetch(fileSrc).then(res => res.blob());
        const output = await imglyRemoveBackground(blob);

        // post processed image to imgbb
        const formData = new FormData();
        formData.append('image', output, `${fileName}.png`);
        formData.append('key', process.env.REACT_APP_IMGBB_API_KEY);
        const response = await axios.post('https://api.imgbb.com/1/upload', formData);

        // create file object 
        const file = {
            clientId: clientId,
            fileName: response.data.data.title,
            fullFileUrl: response.data.data.url,
            mediumFileUrl: response.data.data.medium.url,
            smallFileUrl: response.data.data.thumb.url,
            fileId: response.data.data.id,
            deleteUrl: response.data.data.delete_url
        };

        // enter file object into db
        const collection = db.collection('categories');
        await collection.updateOne(
            { _id: ObjectId(categoryId) },
            {
                $push: {
                    items: file
                }
            }
        );
        
        res.status(201).json({ message: 'Success!'});
    } catch (err) {
        err.status = 400;
        next(err);
    }
});

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

