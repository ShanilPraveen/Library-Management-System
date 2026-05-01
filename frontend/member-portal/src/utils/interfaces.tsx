export interface NewBookRequest {
  id: number;
  userId: string;
  title: string;
  author: string;
  status: RequestStatus;
  createdAt: string;
}

export interface CreateBookRequestInput {
  userId: string;
  title: string;
  author: string;
}

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CreateFeedbackInput {
  content: string;
}

export interface Feedback {
  id: number;
  content: string;
  isViewed: boolean;
  createdAt: string;
}

export interface User {
  username: string;
  name: string;
  address: string;
  age: number;
  nic: string;
  phone: string;
}

export interface Author {
  id: number;
  name: string;
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author?: Author;
}

export interface BookCopy {
  id: string;
  bookId: number;
  isAvailable: boolean;
}

export interface Borrowing {
  id: number;
  bookCopyId: string;
  issuedDate: string;
  dueDate: string;
  receivedDate?: string;
  renewalStatus: RenewalStatus;
  decidedDate?: string;
  book?: Book;
}

export interface Penalty {
  id: number;
  borrowingId: number;
  amount: number;
  isPaid: boolean;
  reason: string;
}

export interface Notification {
  id: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface LayoutProps {
  children: React.ReactNode;
}

export enum Size {
  SMALL = "small",
  MEDIUM = "medium",
}

export enum LabelType {
  RETURNED = "Returned",
  OVERDUE = "Overdue",
  ACTIVE = "Active",
}

export enum LabelColor {
  DEFAULT = "default",
  WARNING = "warning",
  SUCCESS = "success",
  ERROR = "error",
  PRIMARY = "primary",
}

export enum RenewalStatus {
  NONE = "NONE",
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}
