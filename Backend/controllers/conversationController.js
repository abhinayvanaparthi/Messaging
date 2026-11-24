const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// Helper to check participant
const isParticipant = (conversation, userId) => {
  if (!conversation || !conversation.participants) return false;
  return conversation.participants.some((p) => p.toString() === userId.toString());
};

// Create or get conversation
exports.createOrGetConversation = async (req, res) => {
  try {
    const { userId } = req.body; // the person you want to chat with
    const currentUser = req.user.id;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "userId is required" });
    }

    if (userId.toString() === currentUser.toString()) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: { $ne: true },
      participants: { $all: [currentUser, userId] },
    }).populate("participants", "name email");

    // If not, create new
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUser, userId],
      });
      conversation = await Conversation.findById(conversation._id).populate(
        "participants",
        "name email"
      );
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name email")
      .sort({ updatedAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          readBy: { $ne: userId },
        });

        return {
          ...conversation.toObject(),
          unreadCount,
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createGroupConversation = async (req, res) => {
  try {
    const { groupName, participants } = req.body;
    const admin = req.user.id;

    if (!groupName || !participants || participants.length < 2) {
      return res.status(400).json({
        message: "Group name and at least 2 participants required",
      });
    }

    const group = await Conversation.create({
      participants: [...participants, admin],
      isGroup: true,
      groupName,
      groupAdmin: admin,
    });

    const populatedGroup = await Conversation.findById(group._id)
      .populate("participants", "name email")
      .populate("groupAdmin", "name email");

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addGroupMember = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admin can add members
    if (conversation.groupAdmin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    if (conversation.participants.includes(userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    conversation.participants.push(userId);

    await conversation.save();

    const updatedGroup = await Conversation.findById(conversationId)
      .populate("participants", "name email")
      .populate("groupAdmin", "name email");

    res.json(updatedGroup);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeGroupMember = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    // only admin can remove members
    if (conversation.groupAdmin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    conversation.participants = conversation.participants.filter(
      (participant) => participant.toString() !== userId
    );

    await conversation.save();

    const updatedGroup = await Conversation.findById(conversationId)
      .populate("participants", "name email")
      .populate("groupAdmin", "name email");

    res.json(updatedGroup);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!isParticipant(conversation, userId)) {
      return res.status(403).json({ message: "You are not a participant in this group" });
    }

    // remove user from participants
    conversation.participants = conversation.participants.filter(
      (participant) => participant.toString() !== userId
    );

    // If admin leaves, transfer admin to another participant if available
    if (conversation.groupAdmin.toString() === userId && conversation.participants.length > 0) {
      conversation.groupAdmin = conversation.participants[0];
    }

    await conversation.save();

    res.json({ message: "Left group successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.renameGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { groupName } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    // only admin can rename group
    if (conversation.groupAdmin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only admin can rename group" });
    }

    conversation.groupName = groupName;

    await conversation.save();

    const updatedGroup = await Conversation.findById(conversationId)
      .populate("participants", "name email")
      .populate("groupAdmin", "name email");

    res.json(updatedGroup);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changeGroupAdmin = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { newAdminId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    // only current admin can change admin
    if (conversation.groupAdmin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only admin can change admin" });
    }

    // new admin must be part of the group
    if (!conversation.participants.includes(newAdminId)) {
      return res.status(400).json({ message: "User is not a participant in the group" });
    }

    conversation.groupAdmin = newAdminId;

    await conversation.save();

    const updatedGroup = await Conversation.findById(conversationId)
      .populate("participants", "name email")
      .populate("groupAdmin", "name email");

    res.json(updatedGroup);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};