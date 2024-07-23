import { useState } from "react";
import { Box, Divider, IconButton, Typography, useTheme, InputBase, Button } from "@mui/material";
import { ChatBubbleOutlineOutlined, FavoriteBorderOutlined, FavoriteOutlined, ShareOutlined } from "@mui/icons-material";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useDispatch, useSelector } from "react-redux";
import { setPost } from "state";

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
  userPicturePath,
  likes,
  comments,
}) => {
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;

  const { palette } = useTheme();
  const primary = palette.primary.main;

  const patchLike = async () => {
    try {
      const response = await fetch(`https://circleup-67p5.onrender.com/posts/${postId}/like`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async () => {
    try {
      const response = await fetch(`https://circleup-67p5.onrender.com/posts/${postId}/comment`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId, comment: commentText }),
      });
      const updatedPost = await response.json();
      console.log("This is the comment updated post,",updatedPost);
      dispatch(setPost({ post: updatedPost }));
      setCommentText(""); 
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };
  return (
    <WidgetWrapper m="2rem 0">
      <Friend
        friendId={postUserId}
        name={name}
        subtitle={location}
        userPicturePath={userPicturePath}
      />
      <Typography color="textPrimary" sx={{ mt: "1rem" }}>
        {description}
      </Typography>
      {picturePath && (
        <img
          width="100%"
          height="auto"
          alt="post"
          style={{ borderRadius: "0.75rem", marginTop: "0.75rem" }}
          src={picturePath}
        />
      )}
      <FlexBetween mt="0.25rem">
        <FlexBetween gap="1rem">
          <FlexBetween gap="0.3rem">
            <IconButton onClick={patchLike}>
              {isLiked ? (
                <FavoriteOutlined sx={{ color: primary }} />
              ) : (
                <FavoriteBorderOutlined />
              )}
            </IconButton>
            <Typography>{likeCount}</Typography>
          </FlexBetween>

          <FlexBetween gap="0.3rem">
            <IconButton onClick={() => setIsCommentsVisible(!isCommentsVisible)}>
              <ChatBubbleOutlineOutlined />
            </IconButton>
            <Typography>{comments.length}</Typography>
          </FlexBetween>
        </FlexBetween>

        <IconButton>
          <ShareOutlined />
        </IconButton>
      </FlexBetween>
      {isCommentsVisible && (
        <Box mt="1rem">
          <InputBase
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            sx={{ width: "100%", backgroundColor: palette.background.paper, borderRadius: "4px", padding: "8px", marginBottom: "8px" }}
          />
          <Button onClick={handleComment} variant="contained" color="primary">
            Comment
          </Button>
          <Box mt="0.5rem">
            {comments.map((commentObj, i) => (
              <Box key={`${commentObj.userId}-${i}`}>
                <Divider />
                <Typography sx={{ color: "textPrimary", m: "0.5rem 0", pl: "1rem" }}>
                  <strong>{commentObj.commenterName}:</strong> {commentObj.comment}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </WidgetWrapper>
  );
};

export default PostWidget;
