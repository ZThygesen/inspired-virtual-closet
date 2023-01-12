import express from 'express';
const router = express.Router();

router.post('/', async (req, res) => {
    console.log(req.body);
    res.send('goodbye!')
});

export default router;

