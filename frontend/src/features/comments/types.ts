import type { Role } from '../auth/types';

export type ClaimCommentAuthor = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export type ClaimComment = {
  id: number;
  claimId: number;
  message: string;
  author: ClaimCommentAuthor;
  createdAt: string;
};

export type ClaimCommentRequest = {
  message: string;
};
