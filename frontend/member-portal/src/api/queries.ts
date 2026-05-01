import { graphqlRequest } from "./client";
import {
  User,
  Book,
  Borrowing,
  Penalty,
  Notification,
} from "../utils/interfaces";

/*
 * Fetch user data by user ID
 */
export async function getUserDataById(userId: string): Promise<User | null> {
  const query = `
        query GetUser($id: ID!) {
            getUser(id: $id) {
                username
                name
                address
                age
                nic
                phone
            }
        }
    `;
  const data = await graphqlRequest<{ getUser: User | null }>(
    "identity",
    query,
    { id: userId }
  );
  return data.getUser;
}

/*
 * Search and get books by title
 */
export async function searchBooksByTitle(title: string): Promise<Book[]> {
  const query = `
        query SearchBooksByTitle($title: String!) {
            searchBooksByTitle(title: $title) {
                id
                isbn
                title
                author {
                    id
                    name
                }
            }
        }
    `;
  const data = await graphqlRequest<{ searchBooksByTitle: Book[] }>(
    "catalog",
    query,
    { title }
  );
  return data.searchBooksByTitle;
}

/**
 * Search and get books by author name
 */
export async function searchBooksByAuthorName(
  authorName: string
): Promise<Book[]> {
  const query = `
        query SearchBooksByAuthorName($name: String!) {
            searchBooksByAuthorName(name: $name) {
                id
                isbn
                title
                author {
                    id
                    name
                }
            }
        }
    `;
  const data = await graphqlRequest<{ searchBooksByAuthorName: Book[] }>(
    "catalog",
    query,
    { name: authorName }
  );
  return data.searchBooksByAuthorName;
}

/**
 * Get book details by book ID
 */
export async function getBookById(bookId: number): Promise<Book | null> {
  const query = `
        query GetBookById($bookId: Int!) {
            getBookById(bookId: $bookId) {
                id
                isbn
                title
                author {
                    id
                    name
                }   
            }
        }
    `;
  const data = await graphqlRequest<{ getBookById: Book | null }>(
    "catalog",
    query,
    { bookId }
  );
  return data.getBookById;
}

/**
 * Get book data by book copy ID that belongs to the book
 */
export async function getBookDataByBookCopyId(
  bookCopyId: string
): Promise<Book | null> {
  const query = `
        query GetBookDataByBookCopyId($bookCopyId: ID!) {
            getBookDataByBookCopyId(bookCopyId: $bookCopyId) {
                id
                isbn
                title
                author {
                    id
                    name
                }
            }
        }
    `;
  const data = await graphqlRequest<{ getBookDataByBookCopyId: Book | null }>(
    "catalog",
    query,
    { bookCopyId }
  );
  return data.getBookDataByBookCopyId;
}

/**
 * Get active borrowings by user ID
 */
export async function getActiveBorrowingsByUserId(
  userId: string
): Promise<Borrowing[]> {
  const query = `
    query GetActiveBorrowings($userId: ID!) {
      getActiveBorrowingsByUserId(userId: $userId) {
        id
        bookCopyId
        issuedDate
        dueDate
        receivedDate
        renewalStatus
        decidedDate
      }
    }
  `;

  const data = await graphqlRequest<{
    getActiveBorrowingsByUserId: Borrowing[];
  }>("circulation", query, { userId });
  return data.getActiveBorrowingsByUserId;
}

/**
 *Get active overdue borrowings by user ID
 */
export async function getActiveOverdueBorrowingsByUserId(
  userId: string
): Promise<Borrowing[]> {
  const query = `
    query GetOverdueBorrowings($userId: ID!) {
      getActiveOverdueBorrowingsByUserId(userId: $userId) {
        id
        bookCopyId
        issuedDate
        dueDate
        receivedDate
        renewalStatus
        decidedDate
      }
    }
  `;

  const data = await graphqlRequest<{
    getActiveOverdueBorrowingsByUserId: Borrowing[];
  }>("circulation", query, { userId });
  return data.getActiveOverdueBorrowingsByUserId;
}

/**
 * Get all borrowings by user ID (for history)
 */
export async function getAllBorrowingsByUserId(
  userId: string
): Promise<Borrowing[]> {
  const query = `
    query GetAllBorrowings($userId: ID!) {
      getAllBorrowingsByUserId(userId: $userId) {
        id
        bookCopyId
        issuedDate
        dueDate
        receivedDate
        renewalStatus
        decidedDate
      }
    }
  `;

  const data = await graphqlRequest<{ getAllBorrowingsByUserId: Borrowing[] }>(
    "circulation",
    query,
    { userId }
  );
  return data.getAllBorrowingsByUserId;
}

/**
 * Get all penalties by user ID
 */
export async function getAllPenaltiesByUserId(
  userId: string
): Promise<Penalty[]> {
  const query = `
    query GetPenalties($userId: ID!) {
      getAllPenaltiesByUserId(userId: $userId) {
        id
        borrowingId
        amount
        reason
        isPaid
      }
    }
  `;

  const data = await graphqlRequest<{
    getAllUnpaidPenaltiesByUserId: Penalty[];
  }>("circulation", query, { userId });
  return data.getAllUnpaidPenaltiesByUserId;
}

/**
 * Get total unpaid penalties amount by user ID
 */
export async function getTotalUnpaidPenaltiesByUserId(
  userId: string
): Promise<number> {
  const query = `
    query GetTotalUnpaidPenalties($userId: ID!) {
      getTotalUnpaidPenaltiesByUserId(userId: $userId)
    }
  `;

  const data = await graphqlRequest<{
    getTotalUnpaidPenaltiesByUserId: number;
  }>("circulation", query, { userId });
  return data.getTotalUnpaidPenaltiesByUserId;
}

/**
 * Get notifications for a user by user ID
 */
export async function getNotificationsByUserId(
  userId: string
): Promise<Notification[]> {
  const query = `
    query GetNotifications($userId: ID!) {
      getNotificationsByUserId(userId: $userId) {
        id
        content
        isRead
        createdAt
      }
    }
  `;

  const data = await graphqlRequest<{
    getNotificationsByUserId: Notification[];
  }>("circulation", query, { userId });
  return data.getNotificationsByUserId;
}

/**
 * Get unread notifications for a user by user ID
 */
export async function getUnreadNotificationsByUserId(
  userId: string
): Promise<Notification[]> {
  const query = `
    query GetUnreadNotifications($userId: ID!) {
      getUnreadNotificationsByUserId(userId: $userId) {
        id
        content
        isRead
        createdAt
      }
    }
  `;

  const data = await graphqlRequest<{
    getUnreadNotificationsByUserId: Notification[];
  }>("circulation", query, { userId });
  return data.getUnreadNotificationsByUserId;
}
