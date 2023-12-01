process.on("uncaughtException", (e) => {
	console.log("Uncaught Exception!", e);
	console.log("Shutting down...");
	process.exit(1);
});

import mongoose from "mongoose";
import app from "./app/app";
import { connectDB } from "./config/database";
import { LoggerService } from "./services/loggerService";
import { LoggerProvider } from "./util/LoggerProvider";

const PORT: number = 3500 || process.env.PORT;
const logger = new LoggerService(LoggerProvider.getInstance("Server"));

// start server
const server = app.listen(PORT, async () => {
	logger.info(`Server listening on port ${PORT}!`);
	await connectDB();

	if (process.env.NODE_ENV === "production") {
		process.on("SIGTERM", () => {
			logger.debug("Graceful shutdown...");
			server.close(() => {
				logger.info("Server closed!");
			});
		});
	}
});

mongoose.connection.once("open", () => {
	logger.info("Successfully connected to DB!");
});

mongoose.connection.on("error", () => {
	logger.error("Database err!");
	logger.info("Shutting down...");
	server.close(() => {
		logger.info("Server closed!");
		return process.exit(1);
	});
});
mongoose.connection.on("disconnected", () => {
	logger.error("Database disconnected!");
	logger.info("Shutting down...");
	server.close(() => {
		logger.info("Server closed!");
		return process.exit(1);
	});
});

process.on("unhandledRejection", () => {
	logger.error("Unhandled Rejection!"); // production
	logger.info("Shutting down...");
	server.close(() => {
		logger.info("Server closed!");
		process.exit(1);
	});
});
