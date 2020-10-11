import puppeteer = require("puppeteer");
import chromium = require('chrome-aws-lambda');

import 'chrome-aws-lambda/bin/aws.tar.br';
import 'chrome-aws-lambda/bin/chromium.br';
import 'chrome-aws-lambda/bin/swiftshader.tar.br';


export type GetDataWithPage <T> = (page: puppeteer.Page) => Promise<T> | T

/**
 * Helpers to scrape data from html
 */
export async function launchBrowserSession <T> (
    getBatchData: GetDataWithPage<T>[],
): Promise<T[]> {
    let browser: puppeteer.Browser | null = null;

    try {
        // open the headless browser
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
            timeout: 120000, // 120s
        });

        // open a new page
        var page = await browser.newPage();

        // Get batches of data
        const data: T[] = []
        for (const getEach of getBatchData) {
            data.push(await getEach(page))
        }
        // Run function to get data
        return data
    } catch (error) {
        throw error
    } finally {
        if (browser) browser.close()
    }
}