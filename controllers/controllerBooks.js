const pool = require("../db.js");

const getUsername = async (nickname) => {
	const queryUserID = `SELECT user_id from user_profiles where nickname = $1;`;
	try {
		const userResult = await pool.query(queryUserID, [nickname]);
		if (userResult.rows.length === 0) {
			console.error("User not found");
			return null;
		}
		return userResult.rows[0].user_id;
	} catch (error) {
		console.error("Error while fetching nickname");
		return null;
	}
};

const libraryExists = async (req, res) => {
	let isExists = false;
	const { nickname } = req.body;
	const user_id = await getUsername(nickname);
	const query = `
        SELECT 1
        FROM UserManhwa um
        JOIN Users u ON um.user_id = u.user_id
        WHERE u.user_id = $1
        LIMIT 1;
    `;
	try {
		const response = await pool.query(query, [user_id]);
		if (response.rowCount > 0) {
			isExists = true;
		}
		return res.status(200).json({ exists: isExists });
	} catch (error) {
		console.error("Database query error:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

const fetchLibrary = async (req, res) => {
	const { nickname } = req.body;
	const query = `
    SELECT manhwa_id, user_chapter, is_favourite
    FROM UserManhwa 
    WHERE user_id = $1;
`;
	try {
		const user_id = await getUsername(nickname);
		const result = await pool.query(query, [user_id]);
		const library = result.rows;
		return res.status(200).json({ library: library });
	} catch (error) {
		console.error("Database query error:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

const addBook = async (req, res) => {
	const { nickname, manhwa_id, user_chapter } = req.body;
	const addToDB =
		"INSERT INTO UserManhwa (user_id, manhwa_id, user_chapter) VALUES ($1, $2, $3);";
	try {
		const userID = await getUsername(nickname);
		await pool.query(addToDB, [userID, manhwa_id, user_chapter]);
		return res.status(200).json({ message: "Book added successfully" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};
const removeBook = async (req, res) => {
	const { nickname, manhwa_id } = req.body;
	const removeFromDB =
		"DELETE FROM UserManhwa where user_id = $1 and manhwa_id = $2";
	try {
		const userID = await getUsername(nickname);

		await pool.query(removeFromDB, [userID, manhwa_id]);
		return res.status(200).json({ message: "Removed succesfuly" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};
const toggleFavourite = async (req, res) => {
	const { nickname, manhwa_id, favourite } = req.body;
	const toggleQuery = `UPDATE UserManhwa
	SET is_favourite = $1
	WHERE user_id = $2 AND manhwa_id = $3;`;
	try {
		const userID = await getUsername(nickname);
		await pool.query(toggleQuery, [favourite, userID, manhwa_id]);
		return res
			.status(200)
			.json({ message: "Toggled status favoured successfully" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};
const userChapter = async (req, res) => {
	const { nickname, manhwa_id, user_chapter } = req.body;
	const queryUserChapter = `UPDATE UserManhwa
	SET user_chapter = $1
	WHERE user_id = $2 AND manhwa_id = $3;`;
	try {
		const userID = await getUsername(nickname);
		await pool.query(queryUserChapter, [user_chapter, userID, manhwa_id]);
		return res
			.status(200)
			.json({ message: "Changed  personal user chapter  successfully" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};
module.exports = {
	libraryExists,
	fetchLibrary,
	addBook,
	removeBook,
	toggleFavourite,
	userChapter,
};
