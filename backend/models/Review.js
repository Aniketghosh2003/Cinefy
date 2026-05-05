const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Content",
    required: true
  },
  worthScore: {
    type: Number,
    min: 1,
    max: 10
  },
  comment: {
    type: String,
    maxlength: 200
  }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

ReviewSchema.virtual("cenifyMeter").get(function() {
  if (!this.worthScore) return null;
  if (this.worthScore <= 4) return "Waste";
  if (this.worthScore <= 7) return "Okay";
  return "Must Watch";
});

ReviewSchema.index({ userId: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);
