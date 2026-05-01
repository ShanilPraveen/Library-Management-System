export interface Borrowing {
  id: number;
  bookCopyId: string;
  issuedDate: string;
  dueDate: string;
  receivedDate?: string;
  renewalStatus: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED";
  decidedDate?: string;
  book?: Book;
}
export interface User {
  id: string;
  cognitoId: string;
  username: string;
  role: string;
  name: string;
  address?: string;
  age?: number;
  nic?: string;
  phone?: string;
  createdAt: string;
}

export interface RegisterUserInput {
  username: string;
  name: string;
  role: string;
  address?: string;
  age?: number;
  nic?: string;
  phone?: string;
  temporaryPassword?: string;
}

export interface UpdateUserInput {
  name?: string;
  address?: string;
  age?: number;
  nic?: string;
  phone?: string;
}

export interface Author {
  id: number;
  name: string;
}

export interface AuthorWithStats {
  id: number;
  name: string;
  totalBooks: number;
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author?: Author;
}

export interface CreateBookInput {
  isbn: string;
  title: string;
  price: number;
  authorId: number;
}

export interface UpdateBookInput {
  isbn?: string;
  title?: string;
  price?: number;
  authorId?: number;
}

export interface BookCopy {
  id: string;
  bookId: number;
  isAvailable: boolean;
  isDamaged: boolean;
}

export interface Feedback {
  id: number;
  content: string;
  isViewed: boolean;
  createdAt: string;
}

export type RequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export interface NewBookRequest {
  id: number;
  userId: string;
  title: string;
  author: string;
  status: RequestStatus;
  createdAt: string;
}

export interface BookWithStats {
  id: number;
  isbn: string;
  title: string;
  price: number;
  authorId: number;
  author: Author;
  totalCopies: number;
  availableCopies: number;
  damagedCopies: number;
}

export interface BookFormData {
  isbn: string;
  title: string;
  price: number;
  authorId: number;
  copiesCount: number;
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

export enum NewBookRequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export enum RenewalRequestStatus {
  NONE = "NONE",
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export interface Borrowingin {
  id: number;
  bookCopyId: string;
  issuedDate: string;
  dueDate: string;
  book?: {
    title: string;
    author?: {
      name: string;
    };
  };
}

export interface Penalty {
  id: number;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface ReturnDetails {
  borrowingId: number;
  bookCopyId: string;
  isDamaged: boolean;
  damageAmount: number;
}

export interface Userin {
  id: string;
  name: string;
  username: string;
  phone?: string;
  address?: string;
}

export interface BookCopyPreview {
  id: string;
  bookTitle: string;
  authorName: string;
  isAvailable: boolean;
  isDamaged: boolean;
  exists: boolean;
  error?: string;
}

export interface StatCardData {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export interface RecentActivity {
  id: number;
  userId: string;
  bookCopyId: string;
  issuedDate: string;
  receivedDate: string | null;
  userName?: string;
  bookTitle?: string;
}

export enum Role {
  MEMBER = "MEMBER",
  LIBRARIAN = "LIBRARIAN",
  ADMIN = "ADMIN",
}

export interface RenewalRequest {
  id: number;
  borrowingId: number;
  memberId: string;
  memberName: string;
  bookCopyId: string;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string;
  memberUsername: string;
  memberPhone: string;
  issuedDate: string;
  currentDueDate: string;
  requestedDate: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  decidedDate?: string;
  penalties: number;
}

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
