// routes/routePaths.js
export default {
  session: [
    { method: 'post', path: 'register', handler: 'register' },
    { method: 'post', path: 'login', handler: 'login' },
    { method: 'post', path: 'logout', handler: 'logout' },
    { method: 'post', path: 'refresh-token', handler: 'refreshToken' },
    { method: 'post', path: 'change-password', handler: 'changePassword' },
    { method: 'post', path: 'forgot-password', handler: 'forgotPassword' },
    { method: 'post', path: 'reset-password', handler: 'resetPassword' },
  ],
  user: [
    { method: 'get', path: 'profile', handler: 'getMyProfile' },
    { method: 'put', path: 'profile', handler: 'updateProfile' },
    { method: 'post', path: 'avatar', handler: 'uploadAvatar' },
    { method: 'get', path: ':userId', handler: 'getUserById' },
    { method: 'get', path: '', handler: 'getAllUsers' },           // admin only
    { method: 'put', path: ':userId/status', handler: 'updateUserStatus' }, // admin
    { method: 'delete', path: ':userId', handler: 'deleteUser' },  // admin
  ],
  match: [
    { method: 'post', path: 'random', handler: 'createRandomMatch' },
    { method: 'post', path: 'interest', handler: 'createInterestMatch' },
    { method: 'post', path: 'boost', handler: 'createBoostedMatch' },
    { method: 'put', path: ':matchId/end', handler: 'endMatch' },
    { method: 'post', path: ':matchId/rate', handler: 'rateMatch' },
    { method: 'get', path: 'history', handler: 'getMatchHistory' },
    { method: 'get', path: 'active', handler: 'getActiveMatches' },
  ],
  message: [
    { method: 'post', path: 'send', handler: 'sendMessage' },
    { method: 'get', path: 'match/:matchId', handler: 'getMatchMessages' },
    { method: 'put', path: 'mark-read/:matchId', handler: 'markMessagesAsRead' },
    { method: 'post', path: 'gift', handler: 'sendGift' },
  ],
  block: [
    { method: 'post', path: '', handler: 'blockUser' },
    { method: 'delete', path: ':blockedUserId', handler: 'unblockUser' },
    { method: 'get', path: '', handler: 'getBlockedUsers' },
  ],
  report: [
    { method: 'post', path: '', handler: 'createReport' },
    { method: 'get', path: '', handler: 'getReports' },            // admin
    { method: 'put', path: ':reportId/resolve', handler: 'resolveReport' }, // admin
  ],
  notification: [
    { method: 'get', path: '', handler: 'getMyNotifications' },
    { method: 'put', path: ':notificationId/read', handler: 'markNotificationRead' },
    { method: 'delete', path: ':notificationId', handler: 'deleteNotification' },
  ],
  transaction: [
    { method: 'post', path: 'purchase-tokens', handler: 'purchaseTokens' },
    { method: 'get', path: 'history', handler: 'getTransactionHistory' },
    { method: 'post', path: 'send-gift', handler: 'sendGiftTransaction' }, // alternative
  ],
  subscription: [
    { method: 'post', path: 'webhook/stripe', handler: 'stripeWebhook' },   // no auth
    { method: 'get', path: 'me', handler: 'getMySubscription' },
    { method: 'post', path: 'cancel', handler: 'cancelSubscription' },
  ],
  interestRoom: [
    { method: 'get', path: 'active', handler: 'getActiveInterestRooms' },
    { method: 'post', path: '', handler: 'createInterestRoom' },     // admin
    { method: 'put', path: ':roomId', handler: 'updateInterestRoom' }, // admin
    { method: 'delete', path: ':roomId', handler: 'deleteInterestRoom' }, // admin
  ],
  scheduledEvent: [
    { method: 'post', path: '', handler: 'createScheduledEvent' },
    { method: 'get', path: '', handler: 'getScheduledEvents' },
    { method: 'post', path: ':eventId/join', handler: 'joinScheduledEvent' },
    { method: 'delete', path: ':eventId', handler: 'cancelScheduledEvent' },
  ],
  adminAction: [
    { method: 'get', path: '', handler: 'getAdminActions' },
    { method: 'post', path: '', handler: 'logAdminAction' },
  ],
  verification: [
    { method: 'post', path: 'submit', handler: 'submitVerification' },
    { method: 'get', path: 'my-status', handler: 'getMyVerificationStatus' },
    { method: 'put', path: ':verificationId/review', handler: 'reviewVerification' }, // admin
  ],
  dashboardStats: [
    { method: 'get', path: '', handler: 'getDashboardStats' },
    { method: 'get', path: 'registrations', handler: 'getRecentRegistrations' },
  ],
  credentials: [
    { method: 'get', path: 'razorpay', handler: 'razorpayCredentials' },
    { method: 'get', path: '', handler: 'getAllCredentials' },
    { method: 'post', path: '', handler: 'addNewCredentials' },
    { method: 'delete', path: ':credentialId', handler: 'deleteCredential' },
  ],
  plans: [
    { method: 'post', path: '', handler: 'createNewPlan' },
    { method: 'get', path: '', handler: 'getAllPlans' },
    { method: 'get', path: 'active', handler: 'getActivePlans' },
    { method: 'delete', path: ':planId', handler: 'deletePlan' },
  ],
};