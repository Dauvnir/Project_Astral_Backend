const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: process.env.EMAIL_USER_SECRET, // add to env
		pass: process.env.EMAIL_PASS_SECRET, // add to env
	},
});

const sendMail = async (mail_options) => {
	try {
		await transporter.sendMail(mail_options);
		console.log("Email sent successfully");
	} catch (error) {
		console.error(error);
	}
};

const contactMe = async (req, res) => {
	const { email, topic, message } = req.body;

	const mail_content = {
		from: {
			name: "Astral Project - Contact / Report",
			address: process.env.EMAIL_USER_SECRET,
		},
		to: [process.env.EMAIL_USER_SECRET],
		replyTo: email,
		subject: topic,
		text: message,
		html: message,
	};

	try {
		sendMail(mail_content);
		res.sendStatus(200);
	} catch (error) {
		console.log(error);
		res.sendStatus(400);
	}
};

module.exports = { contactMe };
