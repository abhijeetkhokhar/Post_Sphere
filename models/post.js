const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://abhijeetkhokhar01:lp52xSX5IEY9Uw2u@cluster0.x3xunis.mongodb.net/miniProject"
);

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  Date: {
    type: Date,
    default: Date.now,
  },
  content: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
});

module.exports = mongoose.model("post", postSchema);
