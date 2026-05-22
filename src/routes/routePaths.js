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
    { method: 'get', path: 'deleted', handler: 'getDeletedUsers' },        // admin: soft-deleted list
    { method: 'put', path: ':userId/restore', handler: 'restoreUser' },    // admin: restore
    { method: 'get', path: ':userId', handler: 'getUserById' },
    { method: 'get', path: '', handler: 'getAllUsers' },                    // admin: active users
    { method: 'put', path: ':userId/status', handler: 'updateUserStatus' }, // admin
    { method: 'delete', path: ':userId', handler: 'deleteUser' },           // admin: soft-delete
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
    { method: 'delete', path: ':messageId', handler: 'deleteMessage' },    // soft-delete own message
  ],
  block: [
    { method: 'post', path: '', handler: 'blockUser' },
    { method: 'delete', path: ':blockedUserId', handler: 'unblockUser' },
    { method: 'get', path: '', handler: 'getBlockedUsers' },
  ],
  report: [
    { method: 'post', path: '', handler: 'createReport' },
    { method: 'get', path: '', handler: 'getReports' },                        // admin
    { method: 'put', path: ':reportId/resolve', handler: 'resolveReport' },    // admin
  ],
  notification: [
    { method: 'get', path: 'deleted', handler: 'getDeletedNotifications' },              // own trash
    { method: 'put', path: ':notificationId/restore', handler: 'restoreNotification' },  // restore own
    { method: 'get', path: '', handler: 'getMyNotifications' },
    { method: 'put', path: ':notificationId/read', handler: 'markNotificationRead' },
    { method: 'put', path: 'mark-all-read', handler: 'markAllRead' },
    { method: 'delete', path: ':notificationId', handler: 'deleteNotification' },
  ],
  transaction: [
    { method: 'post', path: 'purchase-tokens', handler: 'purchaseTokens' },
    { method: 'get', path: 'history', handler: 'getTransactionHistory' },
    { method: 'post', path: 'send-gift', handler: 'sendGiftTransaction' },
  ],
  subscription: [
    { method: 'post', path: 'webhook/stripe', handler: 'stripeWebhook' },
    { method: 'get', path: 'me', handler: 'getMySubscription' },
    { method: 'post', path: 'cancel', handler: 'cancelSubscription' },
  ],
  interestRoom: [
    { method: 'get', path: 'active', handler: 'getActiveInterestRooms' },
    { method: 'get', path: 'deleted', handler: 'getDeletedInterestRooms' },              // admin
    { method: 'get', path: 'all', handler: 'getAllInterestRooms' },                      // admin
    { method: 'put', path: ':roomId/restore', handler: 'restoreInterestRoom' },          // admin
    { method: 'post', path: '', handler: 'createInterestRoom' },
    { method: 'put', path: ':roomId', handler: 'updateInterestRoom' },
    { method: 'delete', path: ':roomId', handler: 'deleteInterestRoom' },
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
    { method: 'get', path: 'all', handler: 'getAllVerifications' },                      // admin
    { method: 'put', path: ':verificationId/review', handler: 'reviewVerification' },    // admin
  ],
  dashboardStats: [
    { method: 'get', path: '', handler: 'getDashboardStats' },
    { method: 'get', path: 'registrations', handler: 'getRecentRegistrations' },
  ],
  credentials: [
    { method: 'get', path: 'razorpay', handler: 'razorpayCredentials' },
    { method: 'put', path: ':credentialId/restore', handler: 'restoreCredential' },      // admin
    { method: 'get', path: '', handler: 'getAllCredentials' },
    { method: 'post', path: '', handler: 'addNewCredentials' },
    { method: 'delete', path: ':credentialId', handler: 'deleteCredential' },
  ],
  plans: [
    { method: 'get', path: 'active', handler: 'getActivePlans' },
    { method: 'put', path: ':planId/restore', handler: 'restorePlan' },                  // admin
    { method: 'post', path: '', handler: 'createNewPlan' },
    { method: 'get', path: '', handler: 'getAllPlans' },
    { method: 'delete', path: ':planId', handler: 'deletePlan' },
  ],
};
