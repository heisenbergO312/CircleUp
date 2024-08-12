import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "./PostWidget";

const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);

  const getPosts = async () => {
    try {
      const response = await fetch("https://circleup-67p5.onrender.com/posts", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };
  

  const getUserPosts = async () => {
    try {
      const response = await fetch(
        `https://circleup-67p5.onrender.com/posts/${userId}/posts`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      
 
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  useEffect(() => {
    if (isProfile) {
      getUserPosts();
    } else {
      getPosts();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <>
      {Array.isArray(posts) && posts.length > 0 ? (
        posts.map(
          ({
            _id,
            userId,
            firstName,
            lastName,
            description,
            location,
            pictureUrl,
            pictureUser,
            likes,
            comments,
          }) => (
            <PostWidget
              key={_id}
              postId={_id}
              postUserId={userId}
              name={`${firstName} ${lastName}`}
              description={description}
              location={location}
              picturePath={pictureUrl}
              userPicturePath={pictureUser}
              likes={likes}
              comments={comments}
            />
          )
        )
      ) : (
        <p>No posts available</p>
      )}
    </>
  );
};

export default PostsWidget;
