const Pool = require("pg").Pool;
require("dotenv").config;

const pool = new Pool({
	connectionString: process.env.DATABASE_URI,
	ssl: {
		rejectUnauthorized: false, // This is required for some hosted services like Heroku
	},
});

// const pool = new Pool({
// 	user: process.env.USER,
// 	password: process.env.PGPASSWORD,
// 	host: process.env.DBHOST,
// 	port: 5432,
// 	database: "astraldb",
// });
module.exports = pool;
