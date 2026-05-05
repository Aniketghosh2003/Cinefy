const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ["tmdb", "jikan"],
    required: true
  },
  externalId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["movie", "tv", "anime"],
    required: true
  },
  title: String,
  poster: String,
  backdrop: String,
  description: String,
  genres: [String],
  mood: [String],
  releaseDate: Date,
  rating: Number,
  popularity: Number,
  language: [String],
  country: String,
  ageRating: String,
  trailer: String,
  platforms: [String],
  cast: [
    {
      externalId: String,
      name: String,
      profilePic: String
    }
  ],
  crew: [
    {
      externalId: String,
      name: String,
      role: String
    }
  ],
  isOngoing: {
    type: Boolean,
    default: false
  },
  lastFetched: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

ContentSchema.index({ source: 1, externalId: 1 }, { unique: true });
ContentSchema.index({ title: "text" });

module.exports = mongoose.model("Content", ContentSchema);
