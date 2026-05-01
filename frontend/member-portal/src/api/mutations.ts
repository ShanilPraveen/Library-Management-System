import { graphqlRequest } from "./client";
import { Borrowing, Notification } from "../utils/interfaces";
import {
  NewBookRequest,
  CreateBookRequestInput,
  RequestStatus,
  CreateFeedbackInput,
  Feedback,
} from "../utils/interfaces";

/**
 * Request renewal for a borrowing by its ID
 */
export async function requestRenewal(borrowingId: number): Promise<Borrowing> {
  const mutation = `
    mutation RequestRenewal($borrowingId: Int!) {
      requestRenewal(borrowingId: $borrowingId) {
        id
        bookCopyId
        dueDate
        renewalStatus
      }
    }
  `;

  const data = await graphqlRequest<{ requestRenewal: Borrowing }>(
    "circulation",
    mutation,
    {
      borrowingId,
    }
  );
  return data.requestRenewal;
}

/**
 * Mark a notification as read by its ID
 */
export async function markNotificationAsReadById(
  id: number
): Promise<Notification> {
  const mutation = `
    mutation MarkNotificationAsRead($id: Int!) {
    markNotificationAsReadById(id: $id) {
        id
        isRead
      }
    }
  `;

  const data = await graphqlRequest<{
    markNotificationAsReadById: Notification;
  }>("circulation", mutation, { id });
  return data.markNotificationAsReadById;
}

/**
 * Mark all notifications as read for a user by their user ID
 */
export async function markAllNotificationsAsReadByUserId(
  userId: string
): Promise<boolean> {
  const mutation = `
    mutation MarkAllNotificationsAsRead($userId: ID!) {
      markAllNotificationsAsReadByUserId(userId: $userId)
    }
  `;

  const data = await graphqlRequest<{
    markAllNotificationsAsReadByUserId: boolean;
  }>("circulation", mutation, { userId });
  return data.markAllNotificationsAsReadByUserId;
}

/**
 * Create feedback from a user
 */
export async function createFeedback(
  input: CreateFeedbackInput
): Promise<Feedback> {
  const mutation = `
    mutation CreateFeedback($input: CreateFeedbackInput!) {
      createFeedback(input: $input) {
        id
        content
        isViewed
        createdAt
      }
    }
  `;

  const data = await graphqlRequest<{ createFeedback: Feedback }>(
    "circulation",
    mutation,
    { input }
  );
  return data.createFeedback;
}

/**
 * Create a new book request
 */
export async function createNewBookRequest(
  input: CreateBookRequestInput
): Promise<NewBookRequest> {
  const mutation = `
        mutation CreateNewBookRequest($input: CreateBookRequestInput!) {
            createNewBookRequest(input: $input) {
                id
                userId
                title
                author
                status
                createdAt
            } 
        }
    `;
  const data = await graphqlRequest<{ createNewBookRequest: NewBookRequest }>(
    "catalog",
    mutation,
    { input }
  );
  return data.createNewBookRequest;
}
