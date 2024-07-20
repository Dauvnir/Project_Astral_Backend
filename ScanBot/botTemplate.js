const encoder64 = require("./Encoder64.js");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
async function checkInternetConnection() {
	try {
		await fetch("https://www.google.com", { mode: "no-cors" });
		return true;
	} catch (error) {
		throw new Error("No internet connection.");
	}
}

const fetchData = async (page, choosedWebsite) => {
	let conditionMet = false;
	let i = 1;
	let f = -1;
	let website;
	const scrapedData = [];
	do {
		switch (choosedWebsite) {
			//add next  cases if needed
			case "Asura":
				website = `https://asuracomic.net/manga/?page=${i}&order=update`;
				break;
			case "Reaper":
				website = `https://reaperscans.com/comics?page=${i}`;
				break;
			case "Flame":
				if (f === -1) {
					website = `https://flamecomics.com/series/?type=manhua`;
				} else if (f === 0) {
					website = `https://flamecomics.com/series/?type=manga`;
				} else {
					website = `https://flamecomics.com/series/?page=${f}&status=&type=manhwa&order=`;
				}
				break;
			case "Night":
				website = `https://night-scans.com/manga/?page=${i}&status=&type=&order=`;
				break;
			case "Void":
				website = "https://hivescans.com/projects/";
				if (i != 1) {
					website = `https://hivescans.com/projects/page/${i}/`;
				}
				break;
			default:
				console.error("Wrong website provided:", choosedWebsite);
				break;
		}

		await page.goto(website, {
			waitUntil: ["networkidle2", "load"],
			timeout: 60000,
		});

		if (choosedWebsite === "Reaper") {
			await new Promise((resolve) => setTimeout(resolve, 30000));
		} else {
			await new Promise((resolve) => setTimeout(resolve, 2000)); // delay code for website to fully load ads etc.
		}

		try {
			await scrollPageToBottom(page); //lazy loading prevent
		} catch (error) {
			console.error(error);
		}

		try {
			const manhwa = await scrapManhwaDataBasedOnWebsite(page, choosedWebsite);
			if (manhwa.length === 0) {
				conditionMet = true; //signal the end
			}
			scrapedData.push(...manhwa);
		} catch (err) {
			console.error(`Cannot evaluate page and return data`, err);
		}

		if (choosedWebsite === "Flame") {
			f++; // Increment only for Flame website
		} else {
			i++;
		}
	} while (!conditionMet);

	return scrapedData;
};

const encodeImg = async (page, data) => {
	const images = [];
	for (const manhwa of data) {
		//go to the same page cause of CORS
		await page.goto(manhwa.srcImg, {
			waitUntil: ["networkidle2", "load"],
			timeout: 0,
		});
		const image = await encoder64(page);
		if (!image) {
			continue;
		} else {
			images.push(image);
		}
	}
	return images;
};

const scrollPageToBottom = async (page) => {
	await page.evaluate(async () => {
		await new Promise((resolve) => {
			let totalHeight = 0;
			const distance = 100; // Scroll distance
			const delay = 100; // Delay between scrolls

			const timer = setInterval(() => {
				const scrollHeight = document.body.scrollHeight;
				window.scrollBy(0, distance);
				totalHeight += distance;

				if (totalHeight >= scrollHeight) {
					clearInterval(timer);
					resolve();
				}
			}, delay);
		});
	});
};

const scrapManhwaDataBasedOnWebsite = async (page, choosedWebsite) => {
	let manhwa = [];
	const site = choosedWebsite;
	switch ((choosedWebsite, site)) {
		case "Flame":
			manhwa = await page.evaluate((site) => {
				const scanlationSite = site;
				const manhwaList = document.querySelectorAll("div.bsx");
				const chapterInformation = async (websiteUrl) => {
					const response = await fetch(websiteUrl);
					const html = await response.text();
					const parser = new DOMParser();
					const doc = parser.parseFromString(html, "text/html");
					return doc.querySelector("span.epcur").innerText;
				};
				return Promise.all(
					Array.from(manhwaList).map(async (manhwa) => {
						const anchorElement = manhwa.querySelector("a");
						const title = anchorElement.getAttribute("title");
						const websiteUrl = anchorElement.href;
						const srcImg = anchorElement
							.querySelector("div.limit img")
							.getAttribute("src");
						const chapter = await chapterInformation(websiteUrl);
						return { scanlationSite, title, srcImg, websiteUrl, chapter };
					})
				);
			}, site);
			break;
		case "Reaper":
			manhwa = await page.evaluate((site) => {
				Object.defineProperty(navigator, "webdriver", {
					get: () => false,
				});
				const scanlationSite = site;
				const manhwaList = document.querySelectorAll("li.col-span-1");
				return Array.from(manhwaList).map((manhuaData) => {
					const anchorElement = manhuaData.querySelector("div > a");
					const websiteUrl = anchorElement.href;
					const title = anchorElement.querySelector("img").getAttribute("alt");
					const srcImg = anchorElement.querySelector("img").getAttribute("src");
					const chapter = manhuaData.querySelector("div > dl").innerText;

					return { scanlationSite, title, srcImg, websiteUrl, chapter };
				});
			}, site);
			break;
		default:
			manhwa = await page.evaluate((site) => {
				const manhwaList = document.querySelectorAll("div.bsx");
				return Array.from(manhwaList).map((manhwa) => {
					const scanlationSite = site;
					const anchorElement = manhwa.querySelector("a");
					const title = anchorElement.getAttribute("title");
					const websiteUrl = anchorElement.href;
					const srcImg = anchorElement
						.querySelector("div.limit img")
						.getAttribute("src");
					const chapter = anchorElement.querySelector(
						"div.bigor div.adds div.epxs"
					).innerText;
					return { scanlationSite, title, srcImg, websiteUrl, chapter };
				});
			}, site);
			break;
	}
	return manhwa;
};
async function scrapData(choosedWebsite, encode) {
	await checkInternetConnection();
	const browser = await puppeteer.launch({
		headless: false,
	});
	const page = await browser.newPage();
	await page.setViewport({ width: 800, height: 600 });
	await page.setUserAgent(
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
	);
	await page.setExtraHTTPHeaders({
		"Accept-Language": "en-US,en;q=0.9",
		"Accept-Encoding": "gzip, deflate, br",
		Connection: "keep-alive",
	});

	const data = await fetchData(page, choosedWebsite);
	console.log(`Finished scraping data on website: ${choosedWebsite}`);
	if (encode) {
		const base64Images = await encodeImg(page, data);
		data.forEach((item, index) => {
			item.srcImg = base64Images[index];
		});
		console.log("Finished encoding images.");
	}
	await page.close();
	await browser.close();
	return data;
}
module.exports = scrapData;
