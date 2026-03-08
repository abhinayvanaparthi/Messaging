const mongoose = require("mongoose");
const { encryptMessage } = require("../utils/encryption");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    contentsearch: {
      type: String
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reactions: [
      {
        emoji: String,
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
    fileUrl: {
      type: String,
    },
    fileType: {
      type: String,
    },
  },
  { timestamps: true }
);

messageSchema.pre("save", function (next) {

  if (this.isModified("content") && this.content) {

    // store searchable version
    this.contentSearch = this.content.toLowerCase();

    // encrypt stored message
    this.content = encryptMessage(this.content);
  }

  next();
});

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ contentSearch: 1 });

module.exports = mongoose.model("Message", messageSchema);