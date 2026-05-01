const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { BorrowingPeriod, RenewalPeriod, MaxActiveBorrowings } = require("./../utils/constants");

const resolvers = {
  Query: {
    // Find borrowing record for a given id
    getBorrowingById: async (_, { id }) => {
      return await prisma.borrowing.findUnique({
        where: { id },
      });
    },

    // Retrieve all borrowing records
    getAllBorrowings: async () => {
      return await prisma.borrowing.findMany();
    },

    // Retrieve all borrowing records for a specific user
    getAllBorrowingsByUserId: async (_, { userId }) => {
      return await prisma.borrowing.findMany({
        where: { userId },
      });
    },

    // Retrieve active borrowings (not yet returned) for a specific user
    getActiveBorrowingsByUserId: async (_, { userId }) => {
      return await prisma.borrowing.findMany({
        where: {
          userId,
          isReceived: false,
        },
      });
    },

    // Retrieve active overdue borrowings for a specific user
    getActiveOverdueBorrowingsByUserId: async (_, { userId }) => {
      const currentDate = new Date().toISOString();
      return await prisma.borrowing.findMany({
        where: {
          userId,
          isReceived: false,
          dueDate: {
            lt: currentDate,
          },
        },
      });
    },

    // Retrieve borrowings with pending renewal requests
    getPendingRenewals: async () => {
      return await prisma.borrowing.findMany({
        where: {
          renewalStatus: "PENDING",
        },
      });
    },

    // Count of borrowings with pending renewal requests
    getPendingRenewalsCount: async () => {
      return await prisma.borrowing.count({
        where: {
          renewalStatus: "PENDING",
        },
      });
    },

    // Retrieve borrowings by their renewal status
    getBorrowingsByRenewalStatus: async (_, { status }) => {
      return await prisma.borrowing.findMany({
        where: {
          renewalStatus: status,
        },
      });
    },

    // Retrieve borrowings checked out today
    getBorrowingsCheckedOutToday: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return await prisma.borrowing.findMany({
        where: {
          issuedDate: {
            gte: today,
          },
        },
        orderBy: { issuedDate: "desc" },
      });
    },

    // Count of overdue borrowings
    getOverdueBorrowingsCount: async () => {
      const now = new Date();
      return await prisma.borrowing.count({
        where: {
          isReceived: false,
          dueDate: {
            lt: now,
          },
        },
      });
    },

    // Retrieve recent borrowings limited by a specified number
    getRecentBorrowings: async (_, { limit }) => {
      return await prisma.borrowing.findMany({
        orderBy: { issuedDate: "desc" },
        take: limit,
      });
    },

    // get penalty record for a given id
    getPenaltyById: async (_, { id }) => {
      return await prisma.penalty.findUnique({
        where: { id },
      });
    },

    // Retrieve all penalty records
    getAllPenalties: async () => {
      return await prisma.penalty.findMany();
    },

    // Retrieve all penalty records for a specific user
    getAllPenaltiesByUserId: async (_, { userId }) => {
      return await prisma.penalty.findMany({
        where: { userId },
      });
    },

    // Retrieve all unpaid penalty records for a specific user
    getAllUnpaidPenaltiesByUserId: async (_, { userId }) => {
      return await prisma.penalty.findMany({
        where: {
          userId,
          isPaid: false,
        },
      });
    },

    // Calculate the total amount of unpaid penalties for a specific user
    getTotalUnpaidPenaltiesByUserId: async (_, { userId }) => {
      const result = await prisma.penalty.aggregate({
        where: {
          userId,
          isPaid: false,
        },
        _sum: {
          amount: true,
        },
      });
      return result._sum.amount || 0;
    },

    // get notification record for a given id
    getNotificationById: async (_, { id }) => {
      return await prisma.notification.findUnique({
        where: { id },
      });
    },

    // Retrieve all notification records for a specific user
    getNotificationsByUserId: async (_, { userId }) => {
      return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
    },

    // Retrieve all unread notification records for a specific user
    getUnreadNotificationsByUserId: async (_, { userId }) => {
      return await prisma.notification.findMany({
        where: {
          userId,
          isRead: false,
        },
        orderBy: { createdAt: "desc" },
      });
    },

    // Get all feedback records
    getAllFeedbacks: async () => {
      return await prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
      });
    },

    // Get all viewed feedback records
    getAllViewedFeedbacks: async () => {
      return await prisma.feedback.findMany({
        where: {
          isViewed: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },

    // Get all unviewed feedback records
    getAllUnviewedFeedbacks: async () => {
      return await prisma.feedback.findMany({
        where: {
          isViewed: false,
        },
        orderBy: { createdAt: "desc" },
      });
    },
  },
  Mutation: {
    // Checkout books for a user
    checkoutBooks: async (_, { input }) => {
      const activeBorrowingsCount = await prisma.borrowing.count({
        where: {
          userId: input.userId,
          isReceived: false,
        },
      });

      // Check if adding the new borrowings would exceed the maximum allowed
      if (
        activeBorrowingsCount + input.bookCopyIds.length >
        MaxActiveBorrowings
      ) {
        throw new Error("Maximum active borrowings reached.");
      }

      const totalUnpaidPenalties = await prisma.penalty.aggregate({
        where: {
          userId: input.userId,
          isPaid: false,
        },
        _sum: {
          amount: true,
        },
      });

      // Check if user has unpaid penalties
      if (totalUnpaidPenalties._sum.amount > 0) {
        throw new Error("User has unpaid penalties.");
      }

      //calculate due date
      const checkoutDate = new Date();
      const dueDate = new Date(checkoutDate);
      dueDate.setDate(dueDate.getDate() + BorrowingPeriod);

      const borrowings = await Promise.all(
        input.bookCopyIds.map((bookCopyId) =>
          prisma.borrowing.create({
            data: {
              userId: input.userId,
              bookCopyId: bookCopyId,
              issuedDate: checkoutDate,
              dueDate: dueDate,
              isReceived: false,
            },
          })
        )
      );
      return borrowings;
    },

    // Checkin a book copy
    checkinBook: async (_, { input }) => {
      // Get the borrowing record associated with the book copy
      const borrowing = await prisma.borrowing.findUnique({
        where: { id: input.borrowingId },
      });
      if (!borrowing) {
        throw new Error("Borrowing record not found.");
      }
      if (borrowing.isReceived) {
        throw new Error("Book already checked in.");
      }

      // If skipPenaltyCheck is not set, check for unpaid penalties
      // This is done to allow check-in multiple books when a one or all books are damaged.if one book is damaged,
      // user may have unpaid penalties but should be allowed to check-in other books.
      if (!input.skipPenaltyCheck) {
        const unpaidPenalties = await prisma.penalty.findMany({
          where: {
            userId: borrowing.userId,
            isPaid: false,
          },
        });

        if (unpaidPenalties.length > 0) {
          throw new Error(
            "User has unpaid penalties. Cannot check in the book."
          );
        }
      }
      const currentDate = new Date();
      const updatedBorrowing = await prisma.borrowing.update({
        where: {
          id: input.borrowingId,
        },
        data: {
          isReceived: true,
          receivedDate: currentDate,
        },
      });

      // if the book is damaged, create a penalty record
      if (input.isDamaged) {
        await prisma.penalty.create({
          data: {
            userId: borrowing.userId,
            borrowingId: borrowing.id,
            amount: input.damageAmount,
            reason: "Damaged",
            isPaid: false,
          },
        });
      }
      return updatedBorrowing;
    },

    // Request renewal for a borrowing
    requestRenewal: async (_, { borrowingId }) => {
      const borrowing = await prisma.borrowing.findUnique({
        where: { id: borrowingId },
      });
      if (!borrowing) {
        throw new Error("Borrowing record not found.");
      }
      if (borrowing.renewalStatus === "ACCEPTED") {
        throw new Error("This book has already been renewed once.");
      }
      if (borrowing.renewalStatus === "PENDING") {
        throw new Error(
          "There is already a pending renewal request for this book."
        );
      }
      if (borrowing.renewalStatus === "REJECTED") {
        throw new Error(
          "Your previous renewal request was rejected. Further renewals are not allowed."
        );
      }
      if (borrowing.isReceived) {
        throw new Error("Cannot renew a returned book.");
      }

      // Check if the book is overdue
      const currentDate = new Date();
      if (borrowing.dueDate < currentDate) {
        throw new Error("Cannot renew an overdue book.");
      }

      const updatedBorrowing = await prisma.borrowing.update({
        where: { id: borrowingId },
        data: {
          renewalStatus: "PENDING",
        },
      });
      return updatedBorrowing;
    },

    // Approve a renewal request
    approveRenewal: async (_, { borrowingId }) => {
      const borrowing = await prisma.borrowing.findUnique({
        where: { id: borrowingId },
      });
      if (!borrowing) {
        throw new Error("Borrowing record not found.");
      }
      if (borrowing.renewalStatus !== "PENDING") {
        throw new Error("No pending renewal request for this book.");
      }
      const newDueDate = new Date(borrowing.dueDate);
      newDueDate.setDate(newDueDate.getDate() + RenewalPeriod);

      const updatedBorrowing = await prisma.borrowing.update({
        where: { id: borrowingId },
        data: {
          dueDate: newDueDate,
          renewalStatus: "ACCEPTED",
          decidedDate: new Date(),
        },
      });

      // Create a notification for the user about the approved renewal
      await prisma.notification.create({
        data: {
          userId: borrowing.userId,
          content: `Your renewal request has been approved. New due date is ${newDueDate.toDateString()}.`,
        },
      });
      return updatedBorrowing;
    },

    // Reject a renewal request
    rejectRenewal: async (_, { borrowingId }) => {
      const borrowing = await prisma.borrowing.findUnique({
        where: { id: borrowingId },
      });
      if (!borrowing) {
        throw new Error("Borrowing record not found.");
      }
      if (borrowing.renewalStatus !== "PENDING") {
        throw new Error("No pending renewal request for this book.");
      }
      const updatedBorrowing = await prisma.borrowing.update({
        where: { id: borrowingId },
        data: {
          renewalStatus: "REJECTED",
          decidedDate: new Date(),
        },
      });

      // Create a notification for the user about the rejected renewal
      await prisma.notification.create({
        data: {
          userId: borrowing.userId,
          content: `Your renewal request has been rejected.`,
        },
      });
      return updatedBorrowing;
    },

    // Create a penalty record
    createPenalty: async (_, { input }) => {
      return await prisma.penalty.create({
        data: input,
      });
    },

    // Mark a penalty as paid by its ID
    markPenaltyAsPaidById: async (_, { id }) => {
      return await prisma.penalty.update({
        where: { id },
        data: { isPaid: true },
      });
    },

    // Mark all penalties as paid for a specific user
    markAllPenaltiesAsPaidByUserId: async (_, { userId }) => {
      await prisma.penalty.updateMany({
        where: {
          userId,
          isPaid: false,
        },
        data: { isPaid: true },
      });
      return true;
    },

    // create a notification record
    createNotification: async (_, { input }) => {
      return await prisma.notification.create({
        data: input,
      });
    },

    // Mark a notification as read by its ID
    markNotificationAsReadById: async (_, { id }) => {
      return await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    },

    // Mark all notifications as read for a specific user
    markAllNotificationsAsReadByUserId: async (_, { userId }) => {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: { isRead: true },
      });
      return true;
    },

    // create a feedback record
    createFeedback: async (_, { input }) => {
      return await prisma.feedback.create({
        data: input,
      });
    },

    // Mark a feedback as viewed by its ID
    markFeedbackAsViewedById: async (_, { id }) => {
      return await prisma.feedback.update({
        where: { id },
        data: { isViewed: true },
      });
    },

    // delete a feedback by its ID
    deleteFeedbackById: async (_, { id }) => {
      await prisma.feedback.delete({
        where: { id },
      });
      return true;
    },
  },
  Borrowing: {
    user: async (parent) => {
      return { __typename: "User", id: parent.userId };
    },

    bookCopy: async (parent) => {
      return { __typename: "BookCopy", id: parent.bookCopyId };
    },

    penalties: async (parent) => {
      return await prisma.penalty.findMany({
        where: { borrowingId: parent.id },
      });
    },

    __resolveReference: async (reference) => {
      return await prisma.borrowing.findUnique({
        where: { id: reference.id },
      });
    },
  },

  Penalty: {
    user: async (parent) => {
      return { __typename: "User", id: parent.userId };
    },

    borrowing: async (parent) => {
      return await prisma.borrowing.findUnique({
        where: { id: parent.borrowingId },
      });
    },
  },

  Notification: {
    user: async (parent) => {
      return { __typename: "User", id: parent.userId };
    },
  },
};

module.exports = resolvers;
