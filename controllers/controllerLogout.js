const pool = require("../db.js");

const handleLogout = async (req, res) => {
	// On client, also delete accessToken
	const cookies = req.cookies;
	if (!cookies?.jwt) return res.sendStatus(204); // No content
	const refreshToken = cookies.jwt;
	try {
		// Check if token exists
		const checkToken = await pool.query(
			"SELECT username FROM users WHERE refresh_token = $1;",
			[refreshToken]
		);

		// Refresh token in db ?
		if (checkToken.rowCount === 0) {
			return res.clearCookie("jwt", { httpOnly: true }).sendStatus(204); // No Content
		}

		//Delete refresh token
		await pool.query(
			"UPDATE users SET refresh_token = ''  WHERE refresh_token = $1;",
			[refreshToken]
		);
		res
			.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true })
			.sendStatus(204); // No Content     //secure:true - only serves on https
	} catch (error) {
		console.error("Error during login:", error);
		res.sendStatus(500); // Internal Server Error
	}
};

module.exports = { handleLogout };
