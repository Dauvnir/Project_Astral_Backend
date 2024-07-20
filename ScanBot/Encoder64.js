const encoder64 = async (page) => {
	const base = await page.evaluate(async () => {
		let src = document.querySelector("img")?.getAttribute("src");
		if (src === undefined) {
			return;
		}
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
};

module.exports = encoder64;
