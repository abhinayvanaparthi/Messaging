export type User = {
  _id: string;
  name: string;
  email: string;
};

export type Conversation = {
  _id: string;
  participants: User[];
};