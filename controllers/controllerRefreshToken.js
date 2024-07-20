require("dotenv").config();
const pool = require("../db.js");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
	const cookies = req.cookies;
	if (!cookies?.jwt) return res.sendStatus(401); // Unauthorized
	const refreshToken = cookies.jwt;
	try {
		// Check if token exists
		const checkToken = await pool.query(
			"SELECT username, user_id FROM users WHERE refresh_token = $1;",
			[refreshToken]
		);

		// User not found
		if (checkToken.rowCount === 0) return res.sendStatus(403); //Forbidden

		// Compare jwt
		jwt.verify(
			refreshToken,
			process.env.REFRESH_TOKEN_SECRET,
			async (err, decoded) => {
				if (err || checkToken.username !== decoded.user)
					return res.sendStatus(403); //Forbidden
				const user_id = checkToken.rows[0].user_id;
				const queryRoles = await pool.query(
					`SELECT ur.role_id
					 FROM user_roles ur
					 WHERE ur.user_id = $1;`,
					[user_id]
				);
				const nicknameQuery = await pool.query(
					"SELECT nickname FROM user_profiles WHERE user_id = $1;",
					[user_id]
				);
				const nickname = nicknameQuery.rows[0].nickname;

				const roles = queryRoles.rows.map((row) => row.role_id);
				const accessToken = jwt.sign(
					{
						UserInfo: {
							username: decoded.username,
							roles: roles,
							nickname: nickname,
						},
					},
					process.env.ACCESS_TOKEN_SECRET,
					{ expiresIn: "30m" }
				);
				res.json({ accessToken });
			}
		);
	} catch (error) {
		console.error("Error during login:", error);
		res.sendStatus(500); // Internal Server Error
	}
};

module.exports = { handleRefreshToken };
