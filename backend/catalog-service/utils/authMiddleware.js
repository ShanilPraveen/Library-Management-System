const { GraphQLError } = require('graphql');
const { PERMISSIONS } = require('../config/authConfig');

// This takes ONE resolver and wraps it in a security check
const createSecureResolver = (resolverName, originalResolver) => {
  const allowedRoles = PERMISSIONS[resolverName];

  // If no rules exist for this resolver, just return the original one
  if (!allowedRoles) return originalResolver;

  // Otherwise, return a new Guarded function
  return async (parent, args, context, info) => {
    
    // Check if logged in
    if (!context.user) {
      throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
    }

    // Check role
    if (!allowedRoles.includes(context.user.role)) {
      throw new GraphQLError(`Access Denied. Needs: ${allowedRoles.join(',')}`, { extensions: { code: 'FORBIDDEN' } });
    }
    console.log(`Access granted to ${context.user.username} for ${resolverName}`);
    // If this far came it means user is Allowed. Run the original logic
    return originalResolver(parent, args, context, info);
  };
};

// This loops through resolvers object and applies the Guard
const applyAuthMiddleware = (resolvers) => {
  const secured = { ...resolvers }; // get a Copy

  // Secure Query Resolvers
  if (secured.Query) {
    for (const [name, fn] of Object.entries(secured.Query)) {
      secured.Query[name] = createSecureResolver(name, fn);
    }
  }

  // Secure Mutation Resolvers
  if (secured.Mutation) {
    for (const [name, fn] of Object.entries(secured.Mutation)) {
      secured.Mutation[name] = createSecureResolver(name, fn);
    }
  }
  console.log('Auth middleware applied to resolvers');
  return secured;
};

module.exports = { applyAuthMiddleware };