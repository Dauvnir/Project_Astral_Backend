const pool = require("../db.js");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../controllers/controllerEmails.js");
require("dotenv").config();

const JWT_SECRET = process.env.RESET_TOKEN_SECRET;

const forgotPassword = async (req, res) => {
	const { email } = req.body;
	const query = "Select user_id, password from users where email = $1;";

	const dbQuery = await pool.query(query, [email]);

	if (dbQuery.rowCount === 0) {
		return res.sendStatus(404); //not found
	}

	const user_id = dbQuery.rows[0].user_id;
	const password = dbQuery.rows[0].password;

	const secret = JWT_SECRET + password;
	const payload = {
		email: email,
		id: user_id,
	};

	const token = jwt.sign(payload, secret, { expiresIn: "15m" });

	const link = `http://localhost:5173/resetPassword/${user_id}/${token}`;

	const mail_content = {
		from: {
			name: "Astral Project",
			address: process.env.EMAIL_USER_SECRET,
		},
		to: [email],
		subject: "Reset password link",
		text: "link",
		html: `<h3>Reset password link for PROJECT ASTRAL LIBRARY:</h3></br><p><span>${link}</span></p>`,
	};
	try {
		await sendMail(mail_content);
		res.sendStatus(200);
	} catch (error) {
		res.sendStatus(400);
		console.error(error);
	}
};

module.exports = { forgotPassword };
