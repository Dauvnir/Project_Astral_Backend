const pool = require("../db.js");
const bcrypt = require("bcrypt");
const ROLES_LIST = require("../config/roles_list.js");

const updateUserPassword = async (req, res) => {
	const { nickname, password } = req.body;

	if (!password) {
		return res.status(400).send("Email is required.");
	}

	try {
		const isExisted = await pool.query(
			"SELECT user_id FROM user_profiles WHERE nickname = $1;",
			[nickname]
		);

		if (isExisted.rowCount === 0) {
			return res.status(404).send("User not found.");
		}

		const userID = isExisted.rows[0].user_id;
		const updateQuery = "UPDATE users SET password = $1 WHERE user_id = $2;";

		const hashedNewPassword = await bcrypt.hash(password, 10);

		await pool.query(updateQuery, [hashedNewPassword, userID]);

		res.sendStatus(200);
	} catch (error) {
		console.error("Error while searching user:", error);
		res.sendStatus(500);
	}
};

const updateUserEmail = async (req, res) => {
	const { nickname, email } = req.body;

	if (!email) {
		return res.status(400).send("Email is required.");
	}

	try {
		const isExisted = await pool.query(
			"SELECT user_id FROM user_profiles WHERE nickname = $1;",
			[nickname]
		);

		if (isExisted.rowCount === 0) {
			return res.status(404).send("User not found.");
		}

		const userID = isExisted.rows[0].user_id;

		const updateQuery = "UPDATE users SET email = $1 WHERE user_id = $2;";
		await pool.query(updateQuery, [email, userID]);

		return res.sendStatus(200);
	} catch (error) {
		console.error("Error while updating user:", error);
		return res.status(500).send("Internal server error.");
	}
};

const updateUserNickname = async (req, res) => {
	const { nickname, new_nickname } = req.body;

	if (!new_nickname) {
		return res.status(400).send("Nickname is required.");
	}

	try {
		const nicknameTaken = await pool.query(
			"SELECT user_id FROM user_profiles WHERE nickname = $1;",
			[new_nickname]
		);

		if (nicknameTaken.rowCount !== 0) {
			return res.status(409).send("Nickname taken.");
		}

		const userExists = await pool.query(
			"SELECT user_id FROM user_profiles WHERE nickname = $1;",
			[nickname]
		);

		if (userExists.rowCount === 0) {
			return res.status(404).send("User not found.");
		}

		const updateQuery =
			"UPDATE user_profiles SET nickname = $1 WHERE nickname = $2;";
		await pool.query(updateQuery, [new_nickname, nickname]);

		return res.sendStatus(200);
	} catch (error) {
		console.error("Error while updating user:", error);
		return res.status(500).send("Internal server error.");
	}
};

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

const deleteUser = async (req, res) => {
	const { nickname } = req.body;
	if (!nickname) {
		return res.status(400).send("Nickname is required.");
	}

	try {
		const isExisted = await pool.query(
			"SELECT user_id FROM user_profiles WHERE nickname = $1;",
			[nickname]
		);

		if (isExisted.rowCount === 0) {
			return res.status(404).send("User not found.");
		}

		const userID = isExisted.rows[0].user_id;
		await pool.query("BEGIN");

		const queryUsers = "DELETE FROM users WHERE user_id = $1";
		const queryUserManhwa = "DELETE FROM UserManhwa WHERE user_id = $1";
		const queryUserRoles = "DELETE FROM user_roles WHERE user_id = $1";
		const queryUserProfiles = "DELETE FROM user_profiles WHERE user_id = $1";

		await pool.query(queryUserRoles, [userID]);
		await pool.query(queryUserManhwa, [userID]);
		await pool.query(queryUserProfiles, [userID]);
		await pool.query(queryUsers, [userID]);

		await pool.query("COMMIT");
		return res.sendStatus(200);
	} catch (error) {
		await pool.query("ROLLBACK");
		console.error("Error while deleting account", error);
		return res.status(500).send("Internal server error.");
	}
};

const setUserAvatar = async (req, res) => {
	const { nickname, avatar } = req.body;
	if (!nickname) {
		return res.status(400).send("Nickname is required.");
	}

	try {
		const isExisted = await pool.query(
			"SELECT user_id FROM user_profiles WHERE nickname = $1;",
			[nickname]
		);

		if (isExisted.rowCount === 0) {
			return res.status(404).send("User not found.");
		}

		const query = "UPDATE user_profiles SET avatars = $1 WHERE nickname = $2;";

		await pool.query(query, [avatar, nickname]);
		return res.sendStatus(200);
	} catch (error) {
		console.error("Error while adding  avatar name to db", error);
		return res.status(500).send("Internal server error.");
	}
};

const avatarName = async (req, res) => {
	const { nickname } = req.body;
	if (!nickname) {
		return res.status(400).send("Nickname is required.");
	}
	try {
		const isExisted = await pool.query(
			"SELECT user_id FROM user_profiles WHERE nickname = $1;",
			[nickname]
		);

		if (isExisted.rowCount === 0) {
			return res.status(404).send("User not found.");
		}

		const query = await pool.query(
			"SELECT avatars FROM user_profiles WHERE nickname = $1;",
			[nickname]
		);
		const avatarName = query.rows[0].avatars;

		return res.status(200).json({ avatarName });
	} catch (error) {
		console.error("Error while adding  avatar name to db", error);
		return res.status(500).send("Internal server error.");
	}
};
module.exports = {
	deleteUser,
	updateUserPassword,
	updateUserEmail,
	createUser,
	updateUserNickname,
	setUserAvatar,
	avatarName,
};
