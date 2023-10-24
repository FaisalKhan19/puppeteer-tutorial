const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Go to the "Most Common Names in the US" page
    await page.goto('https://www.beenverified.com/people/common-names/');

    // Get the most common names and their search URLs
    const name_handles = await page.$$eval(".directory-bucket-link", (elements) =>
        elements.map((element) => ({
            href: element.href,           // Get the url
            text: element.textContent,    // Get the Name
        }))
    );

    //Go to the search URL of each name one-by-one and extract the names, addresses and numbers
    const data = [];
    for (let i = 0; i < Math.min(2 /*The number of pages you want to scrape*/ , name_handles.length); i++) { 
        var url = name_handles[i].href;
        await page.goto(url);
        const searchResults = await page.$$('.search-result.card.no-clickable'); //Select the search results

        for (const result of searchResults) { // Go through each of the results
            // Extract name 
            const name = await result.$eval('.search-result__title', (element) => element.textContent.trim());

            // Extract phone numbers
            const phoneNumbers = await result.$eval('.search-result__list dd', (element) => element.textContent.trim());

            // Extract addresses
            const addresses = await result.$eval('#search-result__list > dd:nth-child(4)', (element) => element.textContent.trim());
            
            data.push({
                "Name":name,
                "Phone Numbers":phoneNumbers,
                "Addresses":addresses
            });
            // console.log('Name:', name);
            // console.log('Phone Numbers:', phoneNumbers);
            // console.log('Addresses:', addresses);

            // console.log('--------------------------');
        }
    }
    fs.writeFileSync('people_results.json', JSON.stringify(data, null, 2), 'utf8');
    await browser.close();
})();