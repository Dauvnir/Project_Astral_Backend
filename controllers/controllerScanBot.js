const scrapData = require("../ScanBot/ScanBot/botTemplate.js");
const base64Encoder = require("../ScanBot/ScanBot/base64Encoder.js");
const pool = require("../db.js");
//GET all manhwa list with searching
const getAllManhwa = async (req, res) => {
	try {
		const querySelectAll = await pool.query(`SELECT * FROM manhwa;`);
		res.json(querySelectAll.rows);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Internal Server Error");
	}
};

//GET all manhwa list with searching
const getManhwaBySearch = async (req, res) => {
	try {
		const { search } = req.params;
		const querySelectAllSearch = await pool.query(
			`SELECT * FROM manhwa WHERE title ILIKE $1 || '%' ;`,
			[search]
		);
		res.json(querySelectAllSearch.rows);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Internal Server Error");
	}
};

//GET all manhwa based on scanlation site
const getManhwaByScanlation = async (req, res) => {
	try {
		const { scanlation } = req.params;
		const querySelectAllScanlation = await pool.query(
			`SELECT manhwa_id, title, chapter FROM manhwa WHERE scanlation_site = $1;`,
			[scanlation]
		);
		res.json(querySelectAllScanlation.rows);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Internal Server Error");
	}
};
const getManhwaBasedOnId = async (req, res) => {
	try {
		const { id } = req.params;
		const querySelectManhwaBasedOnId = await pool.query(
			`SELECT manhwa_id, title, chapter, scanlation_site, websiteurl FROM manhwa WHERE manhwa_id = $1;`,
			[id]
		);
		res.json(querySelectManhwaBasedOnId.rows);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Internal Server Error");
	}
};
//GET all manhwa based on scanlation site + searching
const getManhwaByScanlationAndSearch = async (req, res) => {
	try {
		const { scanlation, search } = req.params;
		const querySelectAllScanlation = await pool.query(
			`SELECT * FROM manhwa WHERE scanlation_site = $1 AND title ILIKE $2 || '%';`,
			[scanlation, search]
		);
		res.json(querySelectAllScanlation.rows);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Internal Server Error");
	}
};
//GET  IMAGES
const getImages = async (req, res) => {
	try {
		const { id } = req.params;
		const querySelectImages = await pool.query(
			`SELECT srcimg FROM manhwa WHERE manhwa_id = $1;`,
			[id]
		);
		res.json(querySelectImages.rows);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Internal Server Error");
	}
};
const getManhwaData = async (req, res) => {
	try {
		const querySelectAllImages = await pool.query(
			`SELECT manhwa_id, title, chapter, scanlation_site,  websiteurl FROM manhwa;`
		);
		res.json(querySelectAllImages.rows);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).send("Internal Server Error");
	}
};

//PATCH manhwa  chapter + insert new one if appeard based on scanlation
const patchManhwaChapterAllScanlation = async (req, res) => {
	try {
		let scraperModule;
		const { scanlation } = req.params;
		switch (scanlation.toLowerCase()) {
			case "asura":
				console.log("Starting asura scraping");
				scraperModule = await scrapData("Asura", false);
				break;
			case "flame":
				console.log("Starting dataFlame");
				scraperModule = await scrapData("Flame", false);
				break;
			case "void":
				console.log("Starting dataVoid");
				scraperModule = await scrapData("Void", false);
				break;
			case "night":
				console.log("Starting dataNight");
				scraperModule = await scrapData("Night", false);
				break;
			case "reaper":
				console.log("Starting dataReaper");
				scraperModule = await scrapData("Reaper", false);
				break;
			default:
				console.error("Not found scanlation site");
				return res.status(404).send("Not found scanlation site");
		}

		const data = scraperModule;

		const updateQuery = `UPDATE manhwa
			SET chapter = $1
			WHERE scanlation_site = $2 AND title = $3
			RETURNING *;`;

		const selectQuery = `SELECT  * FROM manhwa WHERE scanlation_site = $1 AND title = $2;`;
		const insertQuery = `INSERT INTO manhwa(scanlation_site, title, srcimg, websiteurl, chapter)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING *;`;
		await pool.query("BEGIN");

		for (const { scanlationSite, title, chapter, srcImg, websiteUrl } of data) {
			const check = await pool.query(selectQuery, [scanlationSite, title]);
			if (check.rows.length === 0) {
				const encodedImg = base64Encoder(srcImg);
				await pool.query(insertQuery, [
					scanlationSite,
					title,
					encodedImg,
					websiteUrl,
					chapter,
				]);
				console.log(
					`New manhwa inserted: ${title}, ${chapter}, ${scanlationSite}`
				);
			} else {
				if (chapter === check.rows[0].chapter) {
					continue;
				} else {
					await pool.query(updateQuery, [chapter, scanlationSite, title]);
					console.log(`Updated manhwa: ${title}`);
				}
			}
		}
		await pool.query("COMMIT");

		console.log("Data inserted successfully into the database.");
		res.status(200).send("Data inserted successfully into the database.");
	} catch (error) {
		await pool.query("ROLLBACK");
		console.error(`Error in patchManhwaChapterAll: ${error.message}`);
		res.status(500).send("Internal Server Error");
	}
};

//PATCH manhwa all chapter + insert new one if appeard
const patchManhwaChapterAll = async () => {
	try {
		console.log("Starting asura scraping");
		const dataAsura = await scrapData("Asura", false);

		console.log("Starting dataVoid");
		const dataVoid = await scrapData("Void", false);

		console.log("Starting dataFlame");
		const dataFlame = await scrapData("Flame", false);

		console.log("Starting dataNight");
		const dataNight = await scrapData("Night", false);

		// console.log("Starting dataReaper");
		// const dataReaper = await scrapData("Reaper", false);

		const data = dataFlame.concat(dataVoid, dataNight, dataAsura);

		const updateQuery = `UPDATE manhwa
			SET chapter = $1
			WHERE scanlation_site = $2 AND title = $3
			RETURNING *;`;
		const updateQueryUrl = `UPDATE manhwa
			SET websiteUrl = $1
			WHERE scanlation_site = $2 AND title = $3
			RETURNING *;`;
		const selectQuery = `SELECT  scanlation_site, title, chapter FROM manhwa WHERE scanlation_site = $1 AND title = $2;`;
		const insertQuery = `INSERT INTO manhwa(scanlation_site, title, srcimg, websiteurl, chapter)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING *;`;

		await pool.query("BEGIN");

		for (const { scanlationSite, title, chapter, srcImg, websiteUrl } of data) {
			const check = await pool.query(selectQuery, [scanlationSite, title]);
			if (check.rows.length === 0) {
				const encodedImg = base64Encoder(srcImg);
				await pool.query(insertQuery, [
					scanlationSite,
					title,
					encodedImg,
					websiteUrl,
					chapter,
				]);
				console.log(
					`New manhwa inserted: ${title}, ${chapter}, ${scanlationSite}`
				);
			} else {
				if (
					websiteUrl !== check.rows[0].websiteUrl &&
					chapter === check.rows[0].chapter
				) {
					await pool.query(updateQueryUrl, [websiteUrl, scanlationSite, title]);
					console.log(`Updated manhwa: ${title}`);
				} else if (chapter === check.rows[0].chapter) {
					continue;
				} else {
					await pool.query(updateQuery, [chapter, scanlationSite, title]);
					console.log(`Updated manhwa: ${title}`);
				}
			}
		}
		await pool.query("COMMIT");
		console.log("Data inserted successfully into the database.");
	} catch (error) {
		await pool.query("ROLLBACK");
		console.error(`Error in patchManhwaChapterAll: ${error.message}`);
	}
};

// ADD new manhwa - ver.manual
const addManhwa = async (req, res) => {
	try {
		const { scanlation_site, title, srcimg, websiteurl, chapter } = req.body;
		await pool.query("BEGIN");

		const newManhwa = await pool.query(
			`INSERT INTO manhwa(scanlation_site, title, srcimg, websiteurl, chapter)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING *;`,
			[scanlation_site, title, srcimg, websiteurl, chapter]
		);
		await pool.query("COMMIT");

		res.status(201).json(newManhwa.rows[0]);
	} catch (error) {
		await pool.query("ROLLBACK");

		console.error(error.message);
		res.status(500).send("Internal Server Error");
	}
};

//ADD WHOLE LIBRARY
const addAllManhwa = async (req, res) => {
	try {
		console.log("Starting asura scraping");
		const dataAsura = await scrapData("Asura", true);

		console.log("Starting dataVoid");
		const dataVoid = await scrapData("Void", true);

		console.log("Starting dataFlame");
		const dataFlame = await scrapData("Flame", true);

		console.log("Starting dataNight");
		const dataNight = await scrapData("Night", true);

		// console.log("Starting dataReaper");
		// const dataReaper = await scrapData("Reaper", true);

		const data = dataAsura.concat(dataVoid, dataFlame, dataNight);

		const insertQuery = `
		INSERT INTO manhwa(scanlation_site, title, srcimg, websiteurl, chapter)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING *;`;
		await pool.query("BEGIN");

		for (const { scanlationSite, title, srcImg, websiteUrl, chapter } of data) {
			await pool.query(insertQuery, [
				scanlationSite,
				title,
				srcImg,
				websiteUrl,
				chapter,
			]);
		}
		await pool.query("COMMIT");

		console.log("Data inserted successfully into the database.");
		res.status(200).send("Data inserted successfully into the database.");
	} catch (error) {
		await pool.query("ROLLBACK");

		console.error("Error:", error);
		res.status(500).send("Internal Server Error");
	}
};
module.exports = {
	getAllManhwa,
	getManhwaBySearch,
	getManhwaByScanlation,
	getManhwaByScanlationAndSearch,
	getManhwaData,
	getManhwaBasedOnId,
	patchManhwaChapterAll,
	patchManhwaChapterAllScanlation,
	addManhwa,
	addAllManhwa,
	getImages,
};
