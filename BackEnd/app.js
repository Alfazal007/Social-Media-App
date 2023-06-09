const express = require('express');
const app = express();
const userRouter = require('./user_routes/userRoutes');
require('dotenv').config();
const connect = require('./db/connect');
const bodyParser = require('body-parser');
const postRouter = require('./user_routes/postRoutes');
const authRoutes = require('./user_routes/authRoutes');
const conversationRoutes = require('./user_routes/conversationRoute');
const messageRoutes = require('./user_routes/messageRoutes');
const storyRoutes = require("./user_routes/storyRoutes");
const bookmarkRoutes = require("./user_routes/bookmarkRoutes");
const Story = require("./models/Story");
const nodemailer = require('nodemailer');
app.use(bodyParser.json());
const path = require("path");



app.use(express.static(path.join(__dirname, "public")));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);
app.use('/api/conversation', conversationRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/bookmark/', bookmarkRoutes);

const port = process.env.PORT || 8800;



const start = async () => {
  try {
    app.listen(port, async () => {
      await connect(process.env.MONGO_URI);
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
