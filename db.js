const Pool = require("pg").Pool;
const pool = new Pool({
	user: "samedi",
	password: "samedi",
	host: "localhost",
	port: 5432,
	database: "manhwalist",
});
console.log(pool);
module.exports = pool;
