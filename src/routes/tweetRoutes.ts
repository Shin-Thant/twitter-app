import { Router } from "express";
import { getTweetComments } from "../controllers/commentController";
import {
	createTweetHandler,
	deleteTweetHandler,
	getTweetById,
	getTweets,
	handleLikes,
	shareTweet,
	editTweet,
} from "../controllers/tweetController";
import verifyJWT from "../middlewares/verifyJWT";
import verifyTweetOwner from "../middlewares/verifyTweetOwner";
import validateResource from "../middlewares/validateResource";
import { createTweetSchema, editTweetSchema } from "../schema/tweetSchema";

const router = Router();

router
	.route("/")
	.get(getTweets)
	.post(verifyJWT, validateResource(createTweetSchema), createTweetHandler);

router
	.route("/:tweetId")
	.get(getTweetById)
	.put(
		verifyJWT,
		validateResource(editTweetSchema),
		verifyTweetOwner,
		editTweet
	)
	.delete(verifyJWT, verifyTweetOwner, deleteTweetHandler);

router.route("/:tweetId/like").patch(verifyJWT, handleLikes);

router.route("/:tweetId/share").post(verifyJWT, shareTweet);

router.route("/:tweetId/comments").get(getTweetComments);

export default router;
