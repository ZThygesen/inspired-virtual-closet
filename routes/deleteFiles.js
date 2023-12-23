import express from 'express';
const router = express.Router();
import puppeteer from 'puppeteer';

router.delete('/', async (req, res) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://ibb.co/MsBPQNT/17649ebe4a18392d31a477655ff774c8');

    const deleteBtn = '.link.link--delete';
    await page.waitForSelector(deleteBtn);
    await page.click(deleteBtn);

    const confirmDeleteBtn = '.btn.btn-input.default';
    await page.waitForSelector(confirmDeleteBtn);
    await page.click(confirmDeleteBtn);

    await browser.close();
});

export default router;
