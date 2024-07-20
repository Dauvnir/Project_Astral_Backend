require("dotenv").config;

const whitelist = [
	"https://project-astral.onrender.com",
	process.env.DATABASE_URI,
];

module.exports = whitelist;
