const mongoose = require("mongoose");

const GridSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  items: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content"
      }
    ],
    validate: [arr => arr.length === 9, "Grid must have exactly 9 items"]
  },
  likesCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Grid", GridSchema);
