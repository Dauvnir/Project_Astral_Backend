const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const path = require("path");
const corsOptions = require("./config/corsOptions");
const credentials = require("./middleware/credentials");
const PORT = process.env.PORT || 3500;
const manhwaController = require("./controllers/controllerScanBot");
const { logger } = require("./middleware/logEvents");
const errorHandler = require("./middleware/errorHandler");
const verifyJWT = require("./middleware/verifyJWT");
const cookieParser = require("cookie-parser");

// Connecting to database
pool
	.connect()
	.then(() => {
		console.log("Connected to the database");
		app.listen(PORT, () => {
			console.log(`Server is listening on port ${PORT}`);
		});
	})
	.catch((error) => {
		console.error("Error connecting to the database:", error);
	});
//

//custom middleware logger
app.use(logger);
//Handle options credentials check - before CORS, and fetch cookies credentials requirement
app.use(credentials);
//Cross origin resource sharing
app.use(cors(corsOptions));
//middleware to handle urlencoded from data
app.use(express.urlencoded({ extended: false }));
//middleware for json
app.use(express.json());
//middleware for cookie
app.use(cookieParser());
//serve static files
app.use(express.static(path.join(__dirname, "../src")));
//routes
app.use("/auth", require("./routes/authorized"));
app.use("/refresh", require("./routes/refresh"));
app.use("/logout", require("./routes/logout"));
app.use("/registration", require("./routes/registration"));
app.use("/manhwas", require("./routes/routesScanBot"));
app.use("/leaderboard", require("./routes/leaderboard"));
app.use("/forgotPassword", require("./routes/forgotPassword"));
app.use("/resetPassword", require("./routes/resetPassword"));
app.use("/email", require("./routes/contactReportEmail"));
app.use(verifyJWT);
app.use("/library", require("./routes/library"));
app.use("/users", require("./routes/usersCRUD"));

//update database every 2 hours
// setInterval(updateDB, 7200000); //7 200 000  it is 2 hour
async function updateDB() {
	try {
		await manhwaController.patchManhwaChapterAll();
		console.log("Database updated successfully.");
	} catch (error) {
		console.error("Error while updating database", error);
		throw error;
	}
}
//
updateDB();
app.use(errorHandler);

process.on("exit", () => {
	pool.end();
});
