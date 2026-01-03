export type User = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
};

export type Message = {
  id: string;
  sender: User;
  content: string;
  timestamp: string;
};

export type FriendRequest = {
  id: string;
  user: User;
};

export type Chat = {
  friend: User;
  messages: Message[];
};
