const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

router.delete('/', async (req, res) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://ibb.co/J3J7Xty/25bcc340799325cca827c8b7d061a37e');

    const deleteBtn = '.link.link--delete';
    await page.waitForSelector(deleteBtn);
    await page.click(deleteBtn);

    const confirmDeleteBtn = '.btn.btn-input.default';
    await page.waitForSelector(confirmDeleteBtn);
    await page.click(confirmDeleteBtn);

    await browser.close();
});

module.exports = router;
