import API from "./api";

// get all conversations for the logged-in user
export const getConversations = async () => {
  const res = await API.get("/api/conversations");
  return res.data;
};

// create 1-to-1 conversation
export const createConversation = async (userId: string) => {
  const res = await API.post("/api/conversations", { userId });
  return res.data;
};

// create group conversation
export const createGroupConversation = async (
  groupName: string,
  participants: string[]
) => {
  const res = await API.post("/api/conversations/group", {
    groupName,
    participants,
  });

  return res.data;
};