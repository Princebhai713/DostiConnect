import { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  username: string;
  email: string; // Added email field
  avatar?: string;
  online: boolean;
  registrationDate: string;
  friendIds?: string[];
  isAnonymous?: boolean;
};

export type Message = {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Timestamp | Date;
};

export type FriendRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  sentDate: Timestamp | Date;
};

export type Chat = {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
};

export type UserWithAvatar = User & { avatar: string };
