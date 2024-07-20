const pool = require("../db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.RESET_TOKEN_SECRET;

const verifyReset = async (req, res) => {
	const { id, token } = req.params;

	const query = "select password from users where user_id = $1;";
	const dbQuery = await pool.query(query, [id]);

	if (dbQuery.rowCount === 0) {
		return res.sendStatus(404); // not found
	}

	const userPassword = dbQuery.rows[0].password;

	const secret = JWT_SECRET + userPassword;

	try {
		jwt.verify(token, secret);
		console.log("thats work");
		res.status(200).json({ message: "Token verified" });
	} catch (error) {
		console.log(error);
		res.status(400).json({ message: "Invalid token" });
	}
	res.send("Done");
};

const resetPassword = async (req, res) => {
	const { id, token } = req.params;
	const { pwd, matchPwd } = req.body;

	const query = "select password from users where user_id = $1;";
	const dbQuery = await pool.query(query, [id]);

	if (dbQuery.rowCount === 0) {
		return res.sendStatus(404); // not found
	}

	const userPassword = dbQuery.rows[0].password;

	const secret = JWT_SECRET + userPassword;

	try {
		jwt.verify(token, secret);

		if (pwd !== matchPwd) {
			return res.sendStatus(409); // conflict
		}

		const hashedPwd = await bcrypt.hash(pwd, 10);

		const updateQuery = "UPDATE users SET password  = $1 where user_id = $2;";
		await pool.query(updateQuery, [hashedPwd, id]);

		res.sendStatus(200);
	} catch (error) {
		console.log(error);
		res.sendStatus(498); //token expired/invalid
	}
};
module.exports = { verifyReset, resetPassword };
