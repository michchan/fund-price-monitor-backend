import puppeteer = require("puppeteer");
import chromium = require('chrome-aws-lambda');

import 'chrome-aws-lambda/bin/aws.tar.br';
import 'chrome-aws-lambda/bin/chromium.br';
import 'chrome-aws-lambda/bin/swiftshader.tar.br';


/**
 * Helpers to scrape data from html
 */
export async function scrapeFromLink <RT> (
    link: string,
    getData: (page: puppeteer.Page) => Promise<RT> | RT
): Promise<RT> {
    let browser: puppeteer.Browser | null = null;

    try {
        // open the headless browser
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        // open a new page
        var page = await browser.newPage();
        // enter url in page
        await page.goto(link);
        // Run function to get data
        const data = await getData(page);
        return data
    } catch (error) {
        throw error
    } finally {
        if (browser) browser.close()
    }
}