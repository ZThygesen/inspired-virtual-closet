import express from 'express';
const router = express.Router();
import { db } from '../server.js';
import { ObjectId } from 'mongodb';
import axios from 'axios';
import ExpressFormidable from 'express-formidable';

// create outfit
router.post('/', ExpressFormidable(), async (req, res, next) => {
    try {
        // read in outfit fields
        const { fileSrc, stageItemsStr, outfitName, clientId } = req.fields;

        // convert outfit file to blob and post to imgbb
        const blob = await fetch(fileSrc).then(res => res.blob());

        const formData = new FormData();
        formData.append('image', blob, `${outfitName}.png`);
        formData.append('key', process.env.REACT_APP_IMGBB_API_KEY);
        const response = await axios.post('https://api.imgbb.com/1/upload', formData);
        
        // create outfit object
        const outfitImage = response.data.data.url;

        const stageItems = JSON.parse(stageItemsStr);

        const outfit = {
            clientId: clientId,
            stageItems: stageItems,
            outfitName: outfitName,
            outfitImage: outfitImage
        };

        // insert outfit into db
        const collection = db.collection('outfits');
        await collection.insertOne(outfit);

        res.status(201).json({ message: 'Success!' });

    } catch (err) {
        err.status = 400;
        next(err);
    }
});

// get outfits for given client
router.get('/:clientId', async (req, res, next) => {
    try {
        const collection = db.collection('outfits');
        const outfits = await collection.find({ clientId: req.params.clientId }).toArray();
        res.json(outfits);
    } catch (err) {
        next(err);
    }
});

// update outfit content
router.patch('/:outfitId', ExpressFormidable(), async (req, res, next) => {
    try {
        // read in outfit fields
        const { fileSrc, stageItemsStr, outfitName } = req.fields;

        // convert outfit image to blob and post to imgbb
        const blob = await fetch(fileSrc).then(res => res.blob());

        const formData = new FormData();
        formData.append('image', blob, `${outfitName}.png`);
        formData.append('key', process.env.REACT_APP_IMGBB_API_KEY);
        const response = await axios.post('https://api.imgbb.com/1/upload', formData);

        const outfitImage = response.data.data.url;

        const stageItems = JSON.parse(stageItemsStr);

        // update outfit in db
        const collection = db.collection('outfits');
        await collection.updateOne(
            { _id: ObjectId(req.params.outfitId) },
            {
                $set: {
                    stageItems: stageItems,
                    outfitName: outfitName,
                    outfitImage: outfitImage
                }
            }
        );

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

// update only outfit name
router.patch('/name/:outfitId', async (req, res, next) => {
    try {
        const collection = db.collection('outfits');
        await collection.updateOne(
            { _id: ObjectId(req.params.outfitId) },
            { 
                $set: {
                    outfitName: req.body.newName
                }
            }
        );

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});

// delete outfit
router.delete('/:outfitId', async (req, res, next) => {
    try {
        const collection = db.collection('outfits');
        await collection.deleteOne({ _id: ObjectId(req.params.outfitId )});

        res.json({ message: 'Success!' });
    } catch (err) {
        next(err);
    }
});




export default router;