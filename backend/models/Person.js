const mongoose = require("mongoose");

const PersonSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ["tmdb", "jikan"]
  },
  externalId: String,
  name: String,
  profilePic: String,
  bio: String,
  knownFor: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content"
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Person", PersonSchema);
