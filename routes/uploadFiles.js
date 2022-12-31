const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    console.log(req.body);
    res.send('goodbye!')
});

module.exports = router;

