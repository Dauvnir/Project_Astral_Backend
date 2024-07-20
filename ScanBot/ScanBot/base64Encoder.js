const puppeteer = require("puppeteer-extra");

async function encoder64(srcImg) {
	const browser = await puppeteer.launch({
		headless: true,
	});
	const page = await browser.newPage();
	await page.goto(srcImg, {
		waitUntil: ["networkidle2", "load"],
	});
	const base = await page.evaluate(async () => {
		let src = document.querySelector("img").getAttribute("src");
		const parseToURIFormat = async (blobObject) => {
			const reader = new FileReader();
			reader.readAsDataURL(blobObject);
			// eslint-disable-next-line no-unused-vars
			return new Promise((resolve, reject) => {
				reader.onload = (event) => {
					resolve(event.target.result);
				};
			});
		};
		const srcImgToBlob = async () => {
			const response = await fetch(src);
			const blob = await response.blob();
			const uri = await parseToURIFormat(blob);
			return uri;
		};
		let image = srcImgToBlob(src);
		return image;
	});
	return base;
}

module.exports = encoder64;
