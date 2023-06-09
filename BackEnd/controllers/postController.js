const Post = require('../models/Post');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fs = require('fs');
const Bookmark = require('../models/Bookmark');
// Set up multer storage engine

// middleware done
const createPost = async (req, res) => {
  try {
    // await Post.collection.dropIndex('username_1');
    // await Post.collection.dropIndex('email_1');
    // console.log('Index dropped successfully');
    const { description } = req.body;
    let img;
    if (req.file) {
      img = fs.readFileSync(req.file.path); // read the image file as a buffer
      fs.unlinkSync(req.file.path); // delete the temporary file
    }
    const userId = req.userSearching._id;
    const username = req.userSearching.username;
    const profilePic = req.userSearching.img;
    const newPost = new Post({ userId, description, img, username, profilePic });
    await newPost.validate();
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
};

// middleware done
const getFeed = async (req, res) => {
  try {
    const userPosts = await Post.find({ userId: req.id }).sort({ createdAt: -1 });
    const friendPosts = await Promise.all(
      req.userSearching.following.map((friendId) => {
        return Post.find({ userId: friendId }).sort({ createdAt: -1 });
      })
    );
    const allPosts = userPosts.concat(...friendPosts).sort((a, b) => b.createdAt - a.createdAt);
    res.status(200).json(allPosts);

  } catch (err) {
    res.status(500).json(err.message);
  }
};

// middleware done
// Get post
const getPost = async (req, res) => {
  try {
    const postSearching = await Post.findById(req.params.id);
    if (postSearching) {
      const { userId, description, img, likes, username, profilePic } = postSearching;
      const imgBase64 = img ? img.toString('base64') : null;
      return res
        .status(200)
        .json({ userId, description, img: imgBase64, likes, username, profilePic });
    } else {
      res.status(404).json('Post not found');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

// middleware done
const deletePost = async (req, res) => {
  try {
    const postToDelete = await Post.findById(req.params.id).select(
      'userId description'
    );
    if (postToDelete) {
      if (req.userSearching._id.equals(postToDelete.userId)) {
        await Post.findOneAndDelete({ _id: req.params.id });
        // remove the id of this deleted post from bookmark list
        console.log("Hi");
        // const allBookmarkWithThisPost = await Bookmark.find({ postId: { $elemMatch: { $eq: postToSearch } } });
        let allBookmarks = await Bookmark.find();
        await Promise.all(
          allBookmarks.map((singleBookmark) => {
            const posts = singleBookmark.postId;
            if (posts.includes(req.params.id)) {
              const index = posts.indexOf(req.params.id);
              if (index > -1) {
                posts.splice(index, 1);
              }
              singleBookmark.postId = posts;
              singleBookmark.save();
              return singleBookmark;
            }
          })
        );
        return res.status(200).json('Deleted successfully');
      } else {
        return res.status(403).json('Delete your own posts');
      }
    } else {
      return res.status(404).json('No post with this id');
    }
  } catch (err) {
    res.json(err);
  }
};

// middleware done
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post == null) {
      return res.status(404).json("Post not found");
    }
    if (req.userSearching._id.equals(post.userId)) {
      let changeObject = {};
      let img;
      if (req.file) {
        img = fs.readFileSync(req.file.path); // read the image file as a buffer
        fs.unlinkSync(req.file.path); // delete the temporary file
        changeObject.img = img;
      }
      if (req.body.description) {
        changeObject.description = req.body.description;
      }
      const updatedPost = await Post.findOneAndUpdate(
        { _id: req.params.id },
        changeObject,
        { new: true, runValidators: true }
      );
      res.status(200).json(updatedPost);
    } else {
      return res
        .status(404)
        .json('Login again with valid credentials to edit post');
    }
  } catch (err) {
    return res.status(401).json(err.message);
  }
};

// middleware done
const likePost = async (req, res) => {
  try {
    const userIdLikingThePost = req.userSearching._id;
    const post = await Post.findById(req.params.id);
    if (post) {
      if (!post.likes.includes(userIdLikingThePost)) {
        const updatedPost = await Post.findOneAndUpdate(
          { _id: req.params.id },
          { $push: { likes: userIdLikingThePost } }
        );
        res.status(200).json('You liked the post');
      } else {
        return res.status(401).json('Already liked the post');
      }
    } else {
      return res
        .status(404)
        .json('Login again with valid credentials to edit post');
    }
  } catch (err) {
    return res.status(401).json(err);
  }
};

// middleware done
const unlikePost = async (req, res) => {
  try {
    const userIdDislikingThePost = req.userSearching._id;
    const post = await Post.findById(req.params.id);
    if (post) {
      if (post.likes.includes(userIdDislikingThePost)) {
        const updatedPost = await Post.findOneAndUpdate(
          { _id: req.params.id },
          { $pull: { likes: userIdDislikingThePost } }
        );
        res.status(200).json('You disliked the post');
      } else {
        return res.status(401).json('Did not like in the first place');
      }
    } else {
      return res
        .status(404)
        .json('Login again with valid credentials to edit post');
    }
  } catch (err) {
    return res.status(401).json(err);
  }
};

const getMyPosts = async (req, res) => {
  try {
    const allMyPosts = await Post.find({ userId: req.id });
    if (allMyPosts) {
      res.status(200).json(allMyPosts);
    } else {
      return res.status(404).json("No posts found");
    }
  } catch (err) {
    console.log("Hi");
    res.status(500).json(err.message);
  }
};


module.exports = {
  createPost,
  getPost,
  getFeed,
  deletePost,
  updatePost,
  likePost,
  unlikePost,
  getMyPosts,
};
