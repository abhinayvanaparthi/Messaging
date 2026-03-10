import API from "./api";

export const searchUsers = async (query: string) => {
  const res = await API.get(`/api/users?search=${query}`);
  return res.data;
};