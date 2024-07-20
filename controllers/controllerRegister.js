const pool = require("../db.js");
const bcrypt = require("bcrypt");
const ROLES_LIST = require("../config/roles_list.js");

const createUser = async (req, res) => {
	const { user, pwd, email } = req.body;
	//Check if it is empty
	if (!user || !pwd || !email) return res.sendStatus(400);
	//If username name exist
	const duplicate = await pool.query(
		"SELECT username FROM users WHERE username=$1",
		[user]
	);
	const hasDuplicate = duplicate.rowCount > 0;
	if (hasDuplicate) return res.sendStatus(409);
	// Query user to database
	try {
		//hash pwd
		const hashedPwd = await bcrypt.hash(pwd, 10);
		//query to db
		const query =
			"INSERT INTO users(username, password, email) VALUES ($1, $2, $3) RETURNING user_id;";
		const insertUser = await pool.query(query, [user, hashedPwd, email]);
		const userID = insertUser.rows[0].user_id;
		//add user role
		await pool.query(
			"INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2);",
			[userID, ROLES_LIST.User]
		);
		await pool.query(
			"INSERT INTO user_profiles(user_id, nickname) VALUES ($1, $2);",
			[userID, user]
		);
		res.status(201).json({ succes: `New user ${user} created!` });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = { createUser };
