import Post from "../models/Post.js";
import User from "../models/User.js";
import { bucket } from "../index.js";

/*Get Signed Url */
const getSignedUrl = async (fileName) => {
  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  try {
    const [url] = await bucket.file(fileName).getSignedUrl(options);
    // console.log(`Generated signed URL: ${url}`);
    return url;
  } catch (err) {
    console.error(`Error generating signed URL for ${fileName}:`, err);
    throw err;
  }
};

/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, description } = req.body;
    const user = await User.findById(userId);

    // Handle file upload to Google Cloud Storage
    const picture = req.file;
    const picturePath = `images/${Date.now()}_${picture.originalname}`;
    
    // Upload the picture to GCS
    await bucket.upload(picture.path, {
      destination: picturePath,
      resumable: false,
      gzip: true,
    });

    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePath, // Store relative path
      likes: {},
      comments: [], // Initialize comments array
    });
    await newPost.save();

    // Fetch all posts after creating a new one
    const posts = await Post.find();

    // Map over posts to add signed picture URLs
    const postsWithUrls = await Promise.all(posts.map(async (post) => {
      if (post.picturePath) {
        const pictureUrl = await getSignedUrl(post.picturePath);
        const pictureUser = post.userPicturePath ? await getSignedUrl(post.userPicturePath) : null;
        return {
          ...post._doc,
          pictureUrl,
          pictureUser,
        };
      } else {
        return post;
      }
    }));

    res.status(201).json(postsWithUrls);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

/*Comments */
export const addCommentToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, comment } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      userId,
      comment,
      commenterName: `${user.firstName} ${user.lastName}`
    };

    post.comments.push(newComment);
    await post.save();

    if (post.picturePath) {
      const pictureUrl = await getSignedUrl(post.picturePath);
      const pictureUser = post.userPicturePath ? await getSignedUrl(post.userPicturePath) : null;
      const postWithUrls = {
        ...post._doc,
        pictureUrl,
        pictureUser,
      };
      res.status(200).json(postWithUrls);
    } else {
      res.status(200).json(post);
    }
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* GET COMMENTS FOR POST */
export const getCommentsForPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post.comments);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    // Map over posts to add signed picture URLs
    const postsWithUrls = await Promise.all(posts.map(async (post) => {
      if (post.picturePath) {
        const pictureUrl = await getSignedUrl(post.picturePath);
        const pictureUser = post.userPicturePath ? await getSignedUrl(post.userPicturePath) : null;
        return {
          ...post._doc,
          pictureUrl,
          pictureUser,
        };
      } else {
        return post;
      }
    }));

    res.status(200).json(postsWithUrls);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId });

    // Map over posts to add signed picture URLs
    const postsWithUrls = await Promise.all(posts.map(async (post) => {
      if (post.picturePath) {
        const pictureUrl = await getSignedUrl(post.picturePath);
        return {
          ...post._doc,
          pictureUrl,
        };
      } else {
        return post;
      }
    }));

    res.status(200).json(postsWithUrls);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    if (updatedPost.picturePath) {
      const pictureUrl = await getSignedUrl(updatedPost.picturePath);
      const pictureUser = updatedPost.userPicturePath ? await getSignedUrl(updatedPost.userPicturePath) : null;
      const updatedPostWithUrl = {
        ...updatedPost._doc,
        pictureUrl,
        pictureUser,
      };
      res.status(200).json(updatedPostWithUrl);
    } else {
      res.status(200).json(updatedPost);
    }
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
