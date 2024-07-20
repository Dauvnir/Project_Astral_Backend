const pool = require("../db.js");

const getLeaderboard = async (req, res) => {
	const query = `
    SELECT manhwa_id, COUNT(DISTINCT user_id) AS favorite_count
    FROM UserManhwa
    WHERE is_favourite = TRUE
    GROUP BY manhwa_id
    ORDER BY favorite_count DESC
    LIMIT 10;
`;
	try {
		const leaderboardQuery = await pool.query(query);
		const leaderboard = leaderboardQuery.rows;
		return res.status(200).json({ leaderboard });
	} catch (error) {
		console.error("Error while retriving leaderboard");
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

module.exports = { getLeaderboard };
