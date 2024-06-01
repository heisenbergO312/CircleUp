import express from "express";
import { getFeedPosts, getUserPosts, likePost,createPost, addCommentToPost, getCommentsForPost } from "../controllers/posts.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/", verifyToken, getFeedPosts);
router.get("/:userId/posts", verifyToken, getUserPosts);
router.get("/:id/comments",verifyToken, getCommentsForPost);

/* UPDATE */
router.patch("/:id/like", verifyToken, likePost);
router.patch("/:id/comment", verifyToken, addCommentToPost);


export default router;
