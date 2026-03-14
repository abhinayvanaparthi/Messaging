import API from "./api";

// send text message
export const sendMessage = async (
  conversationId: string,
  content: string
) => {
  const res = await API.post("/api/messages", {
    conversationId,
    content,
  });

  return res.data;
};

// send file message
export const sendFileMessage = async (
  conversationId: string,
  file: File
) => {
  const formData = new FormData();
  formData.append("conversationId", conversationId);
  formData.append("file", file);

  const res = await API.post("/api/messages/file", formData);

  return res.data;
};

// get messages with pagination
export const getMessages = async (
  conversationId: string,
  page: number
) => {
  const res = await API.get(
    `/api/messages/${conversationId}?page=${page}`
  );

  return res.data;
};

// search messages
export const searchMessages = async (
  conversationId: string,
  query: string
) => {
  const res = await API.get(
    `/api/messages/search/${conversationId}?query=${query}`
  );

  return res.data;
};

// edit message
export const editMessage = async (
  messageId: string,
  content: string
) => {
  const res = await API.put(`/api/messages/edit/${messageId}`, {
    content,
  });

  return res.data;
};

// delete message
export const deleteMessage = async (messageId: string) => {
  const res = await API.delete(`/api/messages/delete/${messageId}`);
  return res.data;
};