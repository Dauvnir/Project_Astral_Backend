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

module.exports = { sendMail };
