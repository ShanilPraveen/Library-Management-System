const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:4000";

const ENDPOINTS = {
  CIRCULATION: `${GATEWAY_URL}/circulation/graphql`,
  CATALOG: `${GATEWAY_URL}/catalog/graphql`,
  IDENTITY: `${GATEWAY_URL}/identity/graphql`,
};

// Tool definitions mapped to actual backend queries
const TOOLS = {
  // A. Availability Checker - Search books by title and check availability
  searchBooks: {
    url: ENDPOINTS.CATALOG,
    description:
      "Search for books by title and check availability (use when user asks about specific books)",
    requiresArgs: { query: "book title or keywords to search" },
    query: `
      query SearchBooksWithStats($query: String!) {
        searchBooksWithStats(query: $query) {
          id
          title
          isbn
          totalCopies
          availableCopies
          damagedCopies
          author {
            id
            name
          }
        }
      }
    `,
    requiresUserId: true,
  },

  // B. Account Assistant - Check user penalties/fines
  checkPenalties: {
    url: ENDPOINTS.CIRCULATION,
    description: "Check user's unpaid fines and penalties",
    query: `
      query GetUnpaidPenalties($userId: ID!) {
        getAllUnpaidPenaltiesByUserId(userId: $userId) {
          id
          amount
          reason
          isPaid
          createdAt
          borrowing {
            id
            bookCopy {
              book {
                title
              }
            }
          }
        }
        getTotalUnpaidPenaltiesByUserId(userId: $userId)
      }
    `,
    requiresUserId: true,
  },

  // C. Due Date Reminder - Check active borrowings and due dates
  checkDueDates: {
    url: ENDPOINTS.CIRCULATION,
    description: "Check when borrowed books are due",
    query: `
      query GetActiveBorrowings($userId: ID!) {
        getActiveBorrowingsByUserId(userId: $userId) {
          id
          dueDate
          issuedDate
          isReceived
          bookCopy {
            id
            book {
              id
              title
            }
          }
        }
      }
    `,
    requiresUserId: true,
  },

  // D. Request Status - Check new book request status
  checkBookRequest: {
    url: ENDPOINTS.CATALOG,
    description:
      "Check status of requests to PURCHASE NEW books (NOT about borrowed book renewals)",
    query: `
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
    `,
    requiresUserId: true,
    filterByUserId: true,
  },

  // E. Author Explorer - Search books by author name
  searchByAuthor: {
    url: ENDPOINTS.CATALOG,
    description:
      "Find books by author name (use when user asks about books by a specific author)",
    requiresArgs: { query: "author name to search" },
    query: `
      query SearchBooksWithStats($query: String!) {
        searchBooksWithStats(query: $query) {
          id
          title
          isbn
          totalCopies
          availableCopies
          damagedCopies
          author {
            id
            name
          }
        }
      }
    `,
    requiresUserId: true,
  },

  // F. Unread Alert Whisperer - Check unread notifications
  checkNotifications: {
    url: ENDPOINTS.CIRCULATION,
    description:
      "Check for unread alerts, RENEWAL approvals, and system messages.Summerize them if asked.",
    query: `
      query GetUnreadNotifications($userId: ID!) {
        getUnreadNotificationsByUserId(userId: $userId) {
          id
          content
          isRead
          createdAt
        }
      }
    `,
    requiresUserId: true,
  },
};

module.exports = { TOOLS, ENDPOINTS };
