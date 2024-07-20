const pool = require("../db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const handleLogin = async (req, res) => {
	const { user, pwd } = req.body;

	// Fields are required
	if (!user || !pwd) return res.sendStatus(400);

	try {
		// Check if user exists
		const userData = await pool.query(
			"SELECT username, password, user_id FROM users WHERE username = $1;",
			[user]
		);

		// User not found
		if (userData.rowCount === 0) return res.sendStatus(404);
		// Compare passwords
		const hashedPassword = userData.rows[0].password;
		const match = await bcrypt.compare(pwd, hashedPassword);
		if (match) {
			const user_id = userData.rows[0].user_id;
			const nicknameQuery = await pool.query(
				"SELECT nickname FROM user_profiles WHERE user_id = $1;",
				[user_id]
			);
			const nickname = nicknameQuery.rows[0].nickname;
			const usernameDB = userData.rows[0].username;
			const queryRoles = await pool.query(
				`SELECT ur.role_id
				 FROM user_roles ur
				 WHERE ur.user_id = $1;`,
				[user_id]
			);
			const roles = queryRoles.rows.map((row) => row.role_id);
			const accessToken = jwt.sign(
				{
					UserInfo: { username: usernameDB, roles: roles, nickname: nickname },
				},
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: "30m" } // set 10 minutes
			);
			const refreshToken = jwt.sign(
				{ username: user },
				process.env.REFRESH_TOKEN_SECRET,
				{ expiresIn: "3d" }
			);
			//Save refresh token
			await pool.query(
				"UPDATE users SET refresh_token = $1 WHERE username=$2;",
				[refreshToken, user]
			);
			res.cookie("jwt", refreshToken, {
				httpOnly: true,
				sameSite: "None",
				secure: true,
				maxAge: 24 * 60 * 60 * 1000, // one day only
			});
			res.json({ accessToken });
		} else {
			res.sendStatus(401); // Unauthorized
		}
	} catch (error) {
		console.error("Error during login:", error);
		res.sendStatus(500); // Internal Server Error
	}
};

module.exports = { handleLogin };
