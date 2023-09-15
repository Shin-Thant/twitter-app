import { NextFunction, Request, Response } from "express";
import AppError from "../config/AppError";
import { getSecretKeyFor } from "../lib/jwt";
import User from "../models/User";
import verifyToken from "../lib/verifyToken";

export default async function verifyJWT(
	req: Request,
	_res: Response,
	next: NextFunction
) {
	try {
		if (!hasAuthorizationHeader(req)) {
			throw new AppError("Missing authorization header!", 403);
		}

		const accessToken = getTokenFromRequest(req);
		const secretKey = getSecretKeyFor("access_token");
		const payload = verifyToken(accessToken, secretKey);

		const userId = payload.userInfo.id;
		const foundUser = await findUserByID(userId);

		if (!foundUser) {
			throw new AppError("Forbidden!", 403);
		}

		req.user = foundUser;
		next();
	} catch (err) {
		next(err);
	}
}

function hasAuthorizationHeader(req: Request): boolean {
	return "authorization" in req.headers || "Authorization" in req.headers;
}

const SPLIT_CHAR = " "; // space
const TOKEN_INDEX = 1;
function getTokenFromRequest(req: Request) {
	const bearerToken = getBearerTokenFromRequest(req);
	if (!isValidBearerToken(bearerToken)) {
		throw new AppError("Missing token in authorization header!", 403);
	}

	const token = bearerToken.split(SPLIT_CHAR)[TOKEN_INDEX];
	if (!token) {
		throw new AppError("Access token required!", 401);
	}
	return token;
}

function getBearerTokenFromRequest(req: Request) {
	return req.headers.authorization || req.headers.Authorization;
}

function isValidBearerToken(
	bearerToken?: string | string[]
): bearerToken is string {
	return (
		!!bearerToken &&
		!Array.isArray(bearerToken) &&
		bearerToken.startsWith("Bearer ") &&
		bearerToken.split(" ").length === 2
	);
}

async function findUserByID(id: string) {
	const user = await User.findById(id);
	return user;
}
