import { Request, Response } from "express";
import AppError from "../config/AppError";
import isObjectId from "../lib/isObjectId";
import Comment from "../models/Comment";
import {
	CreateCommentInput,
	UpdateCommentInput,
} from "../validationSchemas/commentSchema";
import {
	createComment,
	findComment,
	findManyComments,
} from "../services/commentServices";
import { findTweet } from "../services/tweetServices";
import { TweetParams } from "./tweetController";
import { CommentDoc } from "../models/types/commentTypes";

//* test route
export const getAllComments = async (req: Request, res: Response) => {
	const comments = await Comment.find()
		.populateRelations({ populateComments: true })
		.lean();
	res.json(comments);
};

export const getTweetComments = async (
	req: Request<TweetParams>,
	res: Response
) => {
	const { tweetId } = req.params;
	if (!tweetId) {
		throw new AppError("Tweet ID is requried!", 400);
	}

	const comments = await findManyComments({
		filter: { tweet: tweetId, origin: { $exists: false } },
		options: {
			populate: [
				{ path: "owner", select: "-email" },
				{
					path: "comments",
					populate: { path: "owner", select: "-email" },
				},
			],
			sort: "-createdAt",
			lean: true,
		},
	});

	res.json(comments);
};

export const addNewComment = async (
	req: Request<
		CreateCommentInput["params"],
		object,
		CreateCommentInput["body"]
	>,
	res: Response
) => {
	const { user: owner } = req;
	const { body } = req.body;
	const { tweetId } = req.params;

	if (!body || !owner || !tweetId) {
		throw new AppError("All fields are required!", 400);
	}
	if (!isObjectId(tweetId)) {
		throw new AppError("Invalid Tweet ID!", 400);
	}
	const foundTweet = await findTweet({
		filter: { _id: tweetId.toString() },
		options: { lean: true },
	});
	if (!foundTweet) {
		throw new AppError("Invalid Tweet ID!", 400);
	}

	const newComment = await createComment({
		body,
		owner: owner._id.toString(),
		tweet: tweetId,
	});
	if (!newComment) {
		throw new AppError("Something went wrong!", 500);
	}

	res.json(newComment);
};

export const getCommentById = async (
	req: Request<{ commentId: string }>,
	res: Response
) => {
	const { commentId } = req.params;
	if (!commentId) {
		throw new AppError("Comment ID is required!", 400);
	}

	const foundComment = await findComment({
		filter: { _id: commentId },
		options: {
			populate: [
				{ path: "owner", select: "-email" },
				{
					path: "comments",
					populate: { path: "owner", select: "-email" },
				},
			],
		},
	});

	if (!foundComment) {
		throw new AppError("Invalid ID!", 400);
	}
	res.json(foundComment);
};

export const updateComment = async (
	req: Request<
		UpdateCommentInput["params"] & { tweetId: string },
		object,
		UpdateCommentInput["body"]
	>,
	res: Response
) => {
	const comment = req.comment as CommentDoc;
	const { body } = req.body;

	comment.body = body;
	await comment.save();

	res.json(comment);
};

export const deleteComment = async (req: Request, res: Response) => {
	const { comment } = req;
	if (!comment) {
		throw new AppError("Unauthorized!", 401);
	}

	await comment.deleteOne();
	res.json({ message: "Comment deleted successfully!" });
};
