import { graphqlRequest } from "../api/client";
import {
  User,
  Book,
  Borrowing,
  Author,
  BookCopy,
  Feedback,
  NewBookRequest,
  RequestStatus,
  BookWithStats,
} from "../utils/interfaces";

/**
 * @returns The count of borrowings with renewal status as pending
 */
export async function getPendingRenewalsCount(): Promise<number> {
  const query = `
    query GetPendingRenewalsCount {
      getPendingRenewalsCount
    }
  `;
  const data = await graphqlRequest<{ getPendingRenewalsCount: number }>(
    "circulation",
    query
  );
  return data.getPendingRenewalsCount;
}

/**
 * @returns The total count of registered books in the library
 */
export async function getTotalBooksCount(): Promise<number> {
  const query = `
    query {
      getTotalBooksCount
    }
  `;
  const data = await graphqlRequest<{ getTotalBooksCount: number }>(
    "catalog",
    query
  );
  return data.getTotalBooksCount;
}

/**
 * @returns The total count of members registered in the library
 */
export async function getTotalMembersCount(): Promise<number> {
  const query = `
    query {
      getTotalUsersByRole(role: MEMBER)
    }
  `;
  const data = await graphqlRequest<{ getTotalUsersByRole: number }>(
    "identity",
    query
  );
  return data.getTotalUsersByRole;
}

/**
 * @returns The count of borrowings that are overdue
 */
export async function getOverdueBorrowingsCount(): Promise<number> {
  const query = `
    query {
      getOverdueBorrowingsCount
    }
  `;
  const data = await graphqlRequest<{ getOverdueBorrowingsCount: number }>(
    "circulation",
    query
  );
  return data.getOverdueBorrowingsCount;
}

/**
 * @param limit The maximum number of recent borrowings to retrieve
 * @returns An array of recent borrowings for the given limit
 */
export async function getRecentBorrowings(limit: number): Promise<any[]> {
  const query = `
    query GetRecentBorrowings($limit: Int!) {
      getRecentBorrowings(limit: $limit) {
        id
        userId
        bookCopyId
        issuedDate
        receivedDate
      }
    }
  `;
  const data = await graphqlRequest<{ getRecentBorrowings: any[] }>(
    "circulation",
    query,
    { limit }
  );
  return data.getRecentBorrowings;
}

/**
 * @param name Name to search users by
 * @returns An array of users matching the given name
 */
export async function searchUsersByName(name: string): Promise<User[]> {
  const query = `
    query SearchUsers($name: String!) {
      searchUsersByName(name: $name) {
        id
        cognitoId
        username
        role
        name
        address
        age
        nic
        phone
        createdAt
      }
    }
  `;
  const data = await graphqlRequest<{ searchUsersByName: User[] }>(
    "identity",
    query,
    { name }
  );
  return data.searchUsersByName;
}

/**
 * @param bookCopyId The ID of the book copy to retrieve details for
 * @returns The details of the specified book copy
 */
export async function getBookCopyDetails(bookCopyId: string): Promise<any> {
  const query = `
    query GetBookCopy($id: ID!) {
      getBookCopyById(id: $id) {
        id
        bookId
        isAvailable
        isDamaged
      }
    }
  `;

  const bookCopyData = await graphqlRequest<{ getBookCopyById: any }>(
    "catalog",
    query,
    { id: bookCopyId }
  );

  const bookQuery = `
    query GetBook($bookCopyId: ID!) {
      getBookDataByBookCopyId(bookCopyId: $bookCopyId) {
        id
        title
        author {
          id
          name
        }
      }
    }
  `;

  const bookData = await graphqlRequest<{ getBookDataByBookCopyId: any }>(
    "catalog",
    bookQuery,
    { bookCopyId }
  );

  return {
    ...bookCopyData.getBookCopyById,
    book: bookData.getBookDataByBookCopyId,
  };
}

/**
 * @param userId The id of the user to get the details of the borrowings he currently have
 * @returns An array of borrowings
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
 * @param userId The id of the user to get the total unpaid penalties for
 * @returns The total amount of unpaid penalties for the given user
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
 * @param bookCopyId The ID of the book copy to get book details for
 * @returns The details of the book associated with the given book copy ID
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
 * @param userId The ID of the user to get unpaid penalties for
 * @returns An array of unpaid penalties for the given user
 */
export async function getAllUnpaidPenaltiesByUserId(
  userId: string
): Promise<any[]> {
  const query = `
    query GetAllUnpaidPenalties($userId: ID!) {
      getAllUnpaidPenaltiesByUserId(userId: $userId) {
        id
        amount
        reason
        createdAt
        isPaid
      }
    }
  `;

  const data = await graphqlRequest<{ getAllUnpaidPenaltiesByUserId: any[] }>(
    "circulation",
    query,
    { userId }
  );

  return data.getAllUnpaidPenaltiesByUserId;
}

/**
 * @param status The renewal status to filter borrowings by
 * @returns An array of borrowings with the specified renewal status
 */
export async function getBorrowingsByRenewalStatus(
  status: string
): Promise<Borrowing[]> {
  const query = `
    query GetBorrowingsByRenewalStatus($status: RenewalStatus!) {
      getBorrowingsByRenewalStatus(status: $status) {
        id
        userId
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
    getBorrowingsByRenewalStatus: Borrowing[];
  }>("circulation", query, { status });
  return data.getBorrowingsByRenewalStatus;
}

/**
 * @param userId The ID of the user to get details for
 * @returns The details of the specified user
 */
export async function getUserById(userId: string): Promise<User | null> {
  const query = `
    query GetUserById($id: ID!) { 
      getUser(id: $id) {
        id
        name
        username
        phone
        address
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

/**
 * @param query The search query to find books
 * @returns An array of books matching the search query along with their statistics
 */
export async function searchBooksWithStats(
  query: string
): Promise<BookWithStats[]> {
  const gqlQuery = `
    query SearchBooksWithStats($query: String!) {
      searchBooksWithStats(query: $query) {
        id
        isbn
        title
        price
        authorId
        author {
          id
          name
        }
        totalCopies
        availableCopies
        damagedCopies
      }
    }
  `;
  const data = await graphqlRequest<{ searchBooksWithStats: BookWithStats[] }>(
    "catalog",
    gqlQuery,
    { query }
  );
  return data.searchBooksWithStats;
}

/**
 * @param name The name to search authors by
 * @returns An array of authors matching the given name
 */
export async function searchAuthorsByName(name: string): Promise<Author[]> {
  const query = `
    query SearchAuthorsByName($name: String!) {
      searchAuthorsByName(name: $name) {
        id
        name
      }
    }
  `;
  const data = await graphqlRequest<{ searchAuthorsByName: Author[] }>(
    "catalog",
    query,
    { name }
  );
  return data.searchAuthorsByName;
}

/**
 * @param bookId The ID of the book to get all copies for
 * @returns An array of book copies associated with the given book ID
 */
export async function getAllBookCopiesByBookId(
  bookId: number
): Promise<BookCopy[]> {
  const query = `
    query GetAllBookCopiesByBookId($bookId: Int!) {
      getAllBookCopiesByBookId(bookId: $bookId) {
        id
        bookId
        isAvailable
        isDamaged
      }
    }
  `;
  const data = await graphqlRequest<{ getAllBookCopiesByBookId: BookCopy[] }>(
    "catalog",
    query,
    { bookId }
  );
  return data.getAllBookCopiesByBookId;
}

/**
 * @param authorId The ID of the author to get books for
 * @returns An array of books written by the specified author
 */
export async function getBooksByAuthorId(authorId: number): Promise<Book[]> {
  const query = `
    query GetBooksByAuthorId($authorId: Int!) {
      getBooksByAuthorId(authorId: $authorId) {
        id
        title
        isbn
        price
      }
    }
  `;
  const data = await graphqlRequest<{ getBooksByAuthorId: Book[] }>(
    "catalog",
    query,
    { authorId }
  );
  return data.getBooksByAuthorId;
}

/**
 * @param role The role to filter users by
 * @returns An array of users with the specified role
 */
export async function getUsersByRole(role: string): Promise<User[]> {
  const query = `
    query GetUsersByRole($role: Role!) {
      getUsersByRole(role: $role) {
        id
        cognitoId
        username
        role
        name
        address
        age
        nic
        phone
        createdAt
      }
    }
  `;
  const data = await graphqlRequest<{ getUsersByRole: User[] }>(
    "identity",
    query,
    { role }
  );
  return data.getUsersByRole;
}

/**
 * @returns An array of all feedback entries
 */
export async function getAllFeedbacks(): Promise<Feedback[]> {
  const query = `
    query GetAllFeedbacks {
      getAllFeedbacks {
        id
        content
        isViewed
        createdAt
      }
    }
  `;
  const data = await graphqlRequest<{ getAllFeedbacks: Feedback[] }>(
    "circulation",
    query
  );
  return data.getAllFeedbacks;
}

/**
 * @returns An array of all viewed feedback entries
 */
export async function getAllViewedFeedbacks(): Promise<Feedback[]> {
  const query = `
    query GetAllViewedFeedbacks {
      getAllViewedFeedbacks {
        id
        content
        isViewed
        createdAt
      }
    }
  `;
  const data = await graphqlRequest<{ getAllViewedFeedbacks: Feedback[] }>(
    "circulation",
    query
  );
  return data.getAllViewedFeedbacks;
}

/**
 * @returns An array of all unviewed feedback entries
 */
export async function getAllUnviewedFeedbacks(): Promise<Feedback[]> {
  const query = `
    query GetAllUnviewedFeedbacks {
      getAllUnviewedFeedbacks {
        id
        content
        isViewed
        createdAt
      }
    }
  `;
  const data = await graphqlRequest<{ getAllUnviewedFeedbacks: Feedback[] }>(
    "circulation",
    query
  );
  return data.getAllUnviewedFeedbacks;
}

/**
 * @returns An array of all new book requests
 */
export async function getAllNewBookRequests(): Promise<NewBookRequest[]> {
  const query = `
    query GetAllNewBookRequests {
      getAllNewBookRequests {
        id
        userId
        title
        author
        status
        createdAt
      }
    }
  `;
  const data = await graphqlRequest<{
    getAllNewBookRequests: NewBookRequest[];
  }>("catalog", query);
  return data.getAllNewBookRequests;
}

/**
 * @param status The status to filter new book requests by
 * @returns An array of new book requests with the specified status
 */
export async function getAllNewBookRequestsByStatus(
  status: RequestStatus
): Promise<NewBookRequest[]> {
  const query = `
    query GetAllNewBookRequestsByStatus($status: RequestStatus!) {
      getAllNewBookRequestsByStatus(status: $status) {
        id
        userId
        title
        author
        status
        createdAt
      }
    }
  `;
  const data = await graphqlRequest<{
    getAllNewBookRequestsByStatus: NewBookRequest[];
  }>("catalog", query, { status });
  return data.getAllNewBookRequestsByStatus;
}
