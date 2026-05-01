const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { cognito, userPoolId, clientId } = require("../cognito");
const { v4: uuidv4 } = require("uuid");

// Helper function to format phone numbers for Cognito
const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  if (phone.startsWith("+")) return phone;
  return `+94${phone}`;
};

const resolvers = {
  Query: {
    // Get user by ID
    getUser: async (_, { id }) => {
      return await prisma.user.findUnique({
        where: { id },
      });
    },

    // Get all users
    getAllUsers: async () => {
      return await prisma.user.findMany();
    },

    // Get users by role
    getUsersByRole: async (_, { role }) => {
      return await prisma.user.findMany({
        where: { role },
      });
    },

    // Get total number of users by role
    getTotalUsersByRole: async (_, { role }) => {
      return await prisma.user.count({
        where: { role },
      });
    },

    // Search users by name (case-insensitive, partial match)
    searchUsersByName: async (_, { name }) => {
      return await prisma.user.findMany({
        where: {
          name: {
            contains: name,
            mode: "insensitive",
          },
        },
      });
    },
  },

  Mutation: {
    // Register a new user and create Cognito user
    registerUser: async (_, { input }) => {
      const newUserId = uuidv4();

      const user = await prisma.user.create({
        data: {
          id: newUserId,
          cognitoId: `temp_${Date.now()}`, // will update after Cognito creation
          username: input.username,
          role: input.role,
          name: input.name,
          address: input.address,
          age: input.age,
          nic: input.nic,
          phone: input.phone,
        },
      });

      const params = {
        UserPoolId: userPoolId,
        Username: input.username,
        TemporaryPassword: input.temporaryPassword,
        UserAttributes: [
          { Name: "name", Value: input.name },
          { Name: "phone_number", Value: formatPhoneNumber(input.phone) || "" },
          { Name: "custom:role", Value: input.role },
          { Name: "custom:userId", Value: newUserId },
        ],
        MessageAction: "SUPPRESS",
      };

      // Create Cognito user and update the cognitoId in the database
      try {
        const cognitoUser = await cognito.adminCreateUser(params).promise();
        await prisma.user.update({
          where: { id: newUserId },
          data: { cognitoId: cognitoUser.User.Username },
        });

        return user;
      } catch (error) {
        await prisma.user.delete({
          where: { id: newUserId },
        });
        throw new Error(`Cognito user creation failed: ${error.message}`);
      }
    },

    // Update user details
    updateUser: async (_, { id, input }) => {
      const user = await prisma.user.update({
        where: { id },
        data: {
          name: input.name,
          address: input.address,
          age: input.age,
          nic: input.nic,
          phone: input.phone,
        },
      });

      return user;
    },
  },
  User: {
    __resolveReference: async (reference) => {
      return await prisma.user.findUnique({
        where: { id: reference.id },
      });
    },
  },
};

module.exports = resolvers;
