const mongoose = require("mongoose");

const CollectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content"
    }
  ],
  likesCount: {
    type: Number,
    default: 0
  },
  isPrivate: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Collection", CollectionSchema);
