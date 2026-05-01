import { graphqlRequest } from "../api/client";
import {
  Feedback,
  NewBookRequest,
  CreateBookInput,
  UpdateBookInput,
  RegisterUserInput,
  UpdateUserInput,
} from "../utils/interfaces";

/**
 * @param userId The ID of the user checking out books
 * @param bookCopyIds An array of book copy IDs to be checked out
 * @returns An array of borrowing details created for the checked-out books
 */
export async function checkoutBooks(
  userId: string,
  bookCopyIds: string[]
): Promise<any[]> {
  const mutation = `
    mutation CheckoutBooks($input: CheckoutInput!) {
      checkoutBooks(input: $input) {
        id
        userId
        bookCopyId
        issuedDate
        dueDate
      }
    }
  `;
  const data = await graphqlRequest<{ checkoutBooks: any[] }>(
    "circulation",
    mutation,
    { input: { userId, bookCopyIds } }
  );

  for (const bookCopyId of bookCopyIds) {
    await markCopyAsUnavailable(bookCopyId);
  }

  return data.checkoutBooks;
}

/**
 * Mark a book copy as unavailable
 * @param id The ID of the book copy to be marked as unavailable
 */
export async function markCopyAsUnavailable(id: string): Promise<void> {
  const mutation = `
    mutation MarkCopyAsUnavailable($id: ID!) {
      markCopyAsUnavailable(id: $id) {
        id
        isAvailable
      }
    }
  `;
  await graphqlRequest("catalog", mutation, { id });
}

/**
 * Checkin books based on the provided return details
 * @param returnDetails An array of objects containing borrowingId, bookCopyId, isDamaged, and damageAmount
 * @returns An array of checkin results for each book
 */
export async function checkinBooks(
  returnDetails: Array<{
    borrowingId: number;
    bookCopyId: string;
    isDamaged: boolean;
    damageAmount: number;
  }>
): Promise<any[]> {
  const results = [];

  for (const detail of returnDetails) {
    const mutation = `
      mutation CheckinBook($input: CheckinInput!) {
        checkinBook(input: $input) {
          id
          bookCopyId
          receivedDate
          isReceived
        }
      }
    `;

    const result = await graphqlRequest<{ checkinBook: any }>(
      "circulation",
      mutation,
      {
        input: {
          borrowingId: detail.borrowingId,
          isDamaged: detail.isDamaged,
          damageAmount: detail.damageAmount,
          skipPenaltyCheck: returnDetails.length > 1,
        },
      }
    );

    results.push(result.checkinBook);

    if (detail.isDamaged) {
      await markCopyAsDamaged(detail.bookCopyId);
    } else {
      await markCopyAsAvailable(detail.bookCopyId);
    }
  }

  return results;
}

/** Mark a book copy as available
 * @param id The ID of the book copy to be marked as available
 */
export async function markCopyAsAvailable(id: string): Promise<void> {
  const mutation = `
    mutation MarkCopyAsAvailable($id: ID!) {
      markCopyAsAvailable(id: $id) {
        id
        isAvailable
      }
    }
  `;

  await graphqlRequest("catalog", mutation, { id });
}

/** Mark a book copy as damaged
 * @param id The ID of the book copy to be marked as damaged
 */
export async function markCopyAsDamaged(id: string): Promise<void> {
  const mutation = `
    mutation MarkCopyAsDamaged($id: ID!) {
      markCopyAsDamaged(id: $id) {
        id
        isDamaged
        isAvailable
      }
    }
  `;

  await graphqlRequest("catalog", mutation, { id });
}

/** Mark all penalties as paid for a user
 * @param userId The ID of the user whose penalties are to be marked as paid
 */
export async function markAllPenaltiesAsPaid(userId: string): Promise<void> {
  const mutation = `
    mutation MarkAllPenaltiesAsPaid($userId: ID!) {
      markAllPenaltiesAsPaidByUserId(userId: $userId)
    }
  `;

  await graphqlRequest("circulation", mutation, { userId });
}

/** Approve a renewal request for a borrowing
 * @param borrowingId The ID of the borrowing for which the renewal is to be approved
 * @returns The updated borrowing details after approval
 */
export async function approveRenewal(borrowingId: number): Promise<any> {
  const mutation = `
    mutation ApproveRenewal($borrowingId: Int!) {
      approveRenewal(borrowingId: $borrowingId) {
        id
        dueDate
        renewalStatus
        decidedDate
      }
    }
  `;
  const data = await graphqlRequest<{ approveRenewal: any }>(
    "circulation",
    mutation,
    { borrowingId }
  );
  return data.approveRenewal;
}

/*
 * Reject a renewal request for a borrowing
 * @param borrowingId The ID of the borrowing for which the renewal is to be rejected
 * @returns The updated borrowing details after rejection
 */
export async function rejectRenewal(borrowingId: number): Promise<any> {
  const mutation = `
    mutation RejectRenewal($borrowingId: Int!) {
      rejectRenewal(borrowingId: $borrowingId) {
        id
        renewalStatus
        decidedDate
      }
    }
  `;
  const data = await graphqlRequest<{ rejectRenewal: any }>(
    "circulation",
    mutation,
    { borrowingId }
  );
  return data.rejectRenewal;
}

/** Create a new book in the catalog
 * @param input The details of the book to be created
 * @returns The created book details
 */
export async function createBook(input: CreateBookInput): Promise<any> {
  const mutation = `
    mutation CreateBook($input: CreateBookInput!) {
      createBook(input: $input) {
        id
        isbn
        title
        price
        authorId
      }
    }
  `;
  const data = await graphqlRequest<{ createBook: any }>("catalog", mutation, {
    input,
  });
  return data.createBook;
}

/** Update an existing book in the catalog
 * @param id The ID of the book to be updated
 * @param input The updated details of the book
 * @returns The updated book details
 */
export async function updateBook(
  id: number,
  input: UpdateBookInput
): Promise<any> {
  const mutation = `
    mutation UpdateBook($id: Int!, $input: UpdateBookInput!) {
      updateBook(id: $id, input: $input) {
        id
        isbn
        title
        price
        authorId
      }
    }
  `;
  const data = await graphqlRequest<{ updateBook: any }>("catalog", mutation, {
    id,
    input,
  });
  return data.updateBook;
}

/** Delete a book from the catalog
 * @param id The ID of the book to be deleted
 * @returns A boolean indicating whether the deletion was successful
 */
export async function deleteBook(id: number): Promise<boolean> {
  const mutation = `
    mutation DeleteBook($id: Int!) {
      deleteBook(id: $id)
    }
  `;
  const data = await graphqlRequest<{ deleteBook: boolean }>(
    "catalog",
    mutation,
    { id }
  );
  return data.deleteBook;
}

/** Create multiple book copies for a book
 * @param bookId The ID of the book for which copies are to be created
 * @param count The number of copies to create
 * @returns An array of created book copy details
 */
export async function createBookCopies(
  bookId: number,
  count: number
): Promise<any[]> {
  const mutation = `
    mutation CreateBookCopies($bookId: Int!, $count: Int!) {
      createBookCopies(bookId: $bookId, count: $count) {
        id
        bookId
        isAvailable
        isDamaged
      }
    }
  `;
  const data = await graphqlRequest<{ createBookCopies: any[] }>(
    "catalog",
    mutation,
    { bookId, count }
  );
  return data.createBookCopies;
}

/** Delete a book copy from the catalog
 * @param id The ID of the book copy to be deleted
 * @returns A boolean indicating whether the deletion was successful
 */
export async function deleteBookCopy(id: string): Promise<boolean> {
  const mutation = `
    mutation DeleteBookCopy($id: ID!) {
      deleteBookCopy(id: $id)
    }
  `;
  const data = await graphqlRequest<{ deleteBookCopy: boolean }>(
    "catalog",
    mutation,
    { id }
  );
  return data.deleteBookCopy;
}

/** Create a new author in the catalog
 * @param name The name of the author to be created
 * @returns The created author details
 */
export async function createAuthor(name: string): Promise<any> {
  const mutation = `
    mutation CreateAuthor($name: String!) {
      createAuthor(name: $name) {
        id
        name
      }
    }
  `;
  const data = await graphqlRequest<{ createAuthor: any }>(
    "catalog",
    mutation,
    { name }
  );
  return data.createAuthor;
}

/** Update an existing author in the catalog
 * @param id The ID of the author to be updated
 * @param name The updated name of the author
 * @returns The updated author details
 */
export async function updateAuthor(id: number, name: string): Promise<any> {
  const mutation = `
    mutation UpdateAuthor($id: Int!, $name: String!) {
      updateAuthor(id: $id, name: $name) {
        id
        name
      }
    }
  `;
  const data = await graphqlRequest<{ updateAuthor: any }>(
    "catalog",
    mutation,
    { id, name }
  );
  return data.updateAuthor;
}

/** Delete an author from the catalog
 * @param id The ID of the author to be deleted
 * @returns A boolean indicating whether the deletion was successful
 */
export async function deleteAuthor(id: number): Promise<boolean> {
  const mutation = `
    mutation DeleteAuthor($id: Int!) {
      deleteAuthor(id: $id)
    }
  `;
  const data = await graphqlRequest<{ deleteAuthor: boolean }>(
    "catalog",
    mutation,
    { id }
  );
  return data.deleteAuthor;
}

/** Register a new user in the identity service
 * @param input The details of the user to be registered
 * @returns The registered user details
 */
export async function registerUser(input: RegisterUserInput): Promise<any> {
  const mutation = `
    mutation RegisterUser($input: RegisterUserInput!) {
      registerUser(input: $input) {
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
  const data = await graphqlRequest<{ registerUser: any }>(
    "identity",
    mutation,
    { input }
  );
  return data.registerUser;
}

/** Update an existing user in the identity service
 * @param id The ID of the user to be updated
 * @param input The updated details of the user
 * @returns The updated user details
 */
export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<any> {
  const mutation = `
    mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
      updateUser(id: $id, input: $input) {
        id
        name
        address
        age
        nic
        phone
      }
    }
  `;
  const data = await graphqlRequest<{ updateUser: any }>("identity", mutation, {
    id,
    input,
  });
  return data.updateUser;
}

/** Mark feedback as viewed by ID
 * @param id The ID of the feedback to be marked as viewed
 * @returns The updated feedback details
 */
export async function markFeedbackAsViewedById(id: number): Promise<Feedback> {
  const mutation = `
    mutation MarkFeedbackAsViewedById($id: Int!) {
      markFeedbackAsViewedById(id: $id) {
        id
        content
        isViewed
        createdAt
      }
    }
  `;
  const data = await graphqlRequest<{ markFeedbackAsViewedById: Feedback }>(
    "circulation",
    mutation,
    { id }
  );
  return data.markFeedbackAsViewedById;
}

/** Delete feedback by ID
 * @param id The ID of the feedback to be deleted
 * @returns A boolean indicating whether the deletion was successful
 */
export async function deleteFeedbackById(id: number): Promise<boolean> {
  const mutation = `
    mutation DeleteFeedbackById($id: Int!) {
      deleteFeedbackById(id: $id)
    }
  `;
  const data = await graphqlRequest<{ deleteFeedbackById: boolean }>(
    "circulation",
    mutation,
    { id }
  );
  return data.deleteFeedbackById;
}

/** Update the status of a new book request
 * @param id The ID of the new book request to be updated
 * @param status The new status to be set for the book request
 * @returns The updated new book request details
 */
export async function updateNewBookRequestStatus(
  id: number,
  status: string
): Promise<NewBookRequest> {
  const mutation = `
    mutation UpdateNewBookRequestStatus($id:Int!,$status:RequestStatus!){
      updateNewBookRequestStatus(id:$id,status:$status){
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
    updateNewBookRequestStatus: NewBookRequest;
  }>("catalog", mutation, { id, status });
  return data.updateNewBookRequestStatus;
}
