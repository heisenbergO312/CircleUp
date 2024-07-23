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
    return url;
  } catch (err) {
    console.error(`Error generating signed URL for ${fileName}:`, err);
    throw err;
  }
};

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (user.picturePath) {
      const pictureUrl = await getSignedUrl(user.picturePath);
      const userWithPictureUrl = {
        ...user._doc,
        pictureUrl,
      };
      res.status(200).json(userWithPictureUrl);
    } else {
      res.status(200).json(user);
    }
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = await Promise.all(
      friends.map(async ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        const pictureUser = picturePath ? await getSignedUrl(picturePath) : null;
        return { _id, firstName, lastName, occupation, location, pictureUser };
      })
    );
    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (user.friends.includes(friendId)) {
      user.friends = user.friends.filter((id) => id !== friendId);
      friend.friends = friend.friends.filter((id) => id !== id);
    } else {
      user.friends.push(friendId);
      friend.friends.push(id);
    }
    await user.save();
    await friend.save();

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = await Promise.all(
      friends.map(async ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        const pictureUser = picturePath ? await getSignedUrl(picturePath) : null;
        return { _id, firstName, lastName, occupation, location, pictureUser };
      })
    );

    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
