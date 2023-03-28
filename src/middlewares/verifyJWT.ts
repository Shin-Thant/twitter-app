import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import AppError from "../config/AppError";
import User from "../models/User";

interface IPayload {
	userInfo: {
		id: string;
	};
}

function isJWTPayloadValid(payload: string | JwtPayload): payload is IPayload {
	return (
		!!payload &&
		typeof payload === "object" &&
		"userInfo" in payload &&
		"id" in payload.userInfo
	);
}

const verifyJWT = async (req: Request, res: Response, next: NextFunction) => {
	const bearerToken = req.headers.authorization || req.headers.Authorization;
	if (
		!bearerToken ||
		Array.isArray(bearerToken) ||
		!bearerToken.startsWith("Bearer ")
	) {
		throw new AppError("You are not authorized!", 401);
	}

	const accessToken = bearerToken.split(" ")[1];
	if (!accessToken) {
		throw new AppError("You are not authorized!", 401);
	}

	const payload = jwt.verify(
		accessToken,
		process.env.ACCESS_TOKEN_SECRET_KEY
	);

	if (!isJWTPayloadValid(payload)) {
		throw new AppError("You are not authorized!", 401);
	}

	const foundUser = await User.findOne({ _id: payload.userInfo.id }).exec();
	if (!foundUser) {
		throw new AppError("Something went wrong!", 403);
	}

	req.user = foundUser;
	next();
};

export default verifyJWT;
