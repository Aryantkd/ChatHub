// src/routes/routes.js
import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import routePaths from './routePaths.js';

// Import all controllers
import * as sessionController from '../controllers/sessionController.js';
import * as userController from '../controllers/userController.js';
import * as matchController from '../controllers/matchController.js';
import * as messageController from '../controllers/messageController.js';
import * as blockController from '../controllers/blockController.js';
import * as reportController from '../controllers/reportController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as transactionController from '../controllers/transactionController.js';
import * as subscriptionController from '../controllers/subscriptionController.js';
import * as interestRoomController from '../controllers/interestRoomController.js';
import * as scheduledEventController from '../controllers/scheduledEventController.js';
import * as adminActionController from '../controllers/adminActionController.js';
import * as verificationController from '../controllers/verificationController.js';
import * as dashboardStatsController from '../controllers/dashboardStatsController.js';
import * as credentialsController from '../controllers/credentialsController.js';
import * as plansController from '../controllers/plansController.js';

// Import validation schemas
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  createReportSchema,
  blockUserSchema,
  sendMessageSchema,
  rateMatchSchema,
  purchaseTokensSchema,
  createScheduledEventSchema,
  submitVerificationSchema,
  reviewVerificationSchema,
  createInterestRoomSchema,
  createPlanSchema,
  addCredentialSchema,
} from '../validations/index.js';

const router = Router();

// Map handler names to controller functions
const handlers = {
  // session
  register: sessionController.register,
  login: sessionController.login,
  logout: sessionController.logout,
  refreshToken: sessionController.refreshToken,
  changePassword: sessionController.changePassword,
  forgotPassword: sessionController.forgotPassword,
  resetPassword: sessionController.resetPassword,

  // user
  getMyProfile: userController.getMyProfile,
  updateProfile: userController.updateProfile,
  uploadAvatar: userController.uploadAvatar,
  getUserById: userController.getUserById,
  getAllUsers: userController.getAllUsers,
  getDeletedUsers: userController.getDeletedUsers,
  updateUserStatus: userController.updateUserStatus,
  deleteUser: userController.deleteUser,
  restoreUser: userController.restoreUser,

  // match
  createRandomMatch: matchController.createRandomMatch,
  createInterestMatch: matchController.createInterestMatch,
  createBoostedMatch: matchController.createBoostedMatch,
  endMatch: matchController.endMatch,
  rateMatch: matchController.rateMatch,
  getMatchHistory: matchController.getMatchHistory,
  getActiveMatches: matchController.getActiveMatches,

  // message
  sendMessage: messageController.sendMessage,
  getMatchMessages: messageController.getMatchMessages,
  markMessagesAsRead: messageController.markMessagesAsRead,
  sendGift: messageController.sendGift,
  deleteMessage: messageController.deleteMessage,

  // block
  blockUser: blockController.blockUser,
  unblockUser: blockController.unblockUser,
  getBlockedUsers: blockController.getBlockedUsers,

  // report
  createReport: reportController.createReport,
  getReports: reportController.getReports,
  resolveReport: reportController.resolveReport,

  // notification
  getMyNotifications: notificationController.getMyNotifications,
  getDeletedNotifications: notificationController.getDeletedNotifications,
  markNotificationRead: notificationController.markNotificationRead,
  deleteNotification: notificationController.deleteNotification,
  restoreNotification: notificationController.restoreNotification,
  markAllRead: notificationController.markAllRead,

  // transaction
  purchaseTokens: transactionController.purchaseTokens,
  getTransactionHistory: transactionController.getTransactionHistory,
  sendGiftTransaction: transactionController.sendGift,

  // subscription
  stripeWebhook: subscriptionController.stripeWebhook,
  getMySubscription: subscriptionController.getMySubscription,
  cancelSubscription: subscriptionController.cancelSubscription,

  // interestRoom
  getActiveInterestRooms: interestRoomController.getActiveInterestRooms,
  getAllInterestRooms: interestRoomController.getAllInterestRooms,
  getDeletedInterestRooms: interestRoomController.getDeletedInterestRooms,
  createInterestRoom: interestRoomController.createInterestRoom,
  updateInterestRoom: interestRoomController.updateInterestRoom,
  deleteInterestRoom: interestRoomController.deleteInterestRoom,
  restoreInterestRoom: interestRoomController.restoreInterestRoom,

  // scheduledEvent
  createScheduledEvent: scheduledEventController.createScheduledEvent,
  getScheduledEvents: scheduledEventController.getScheduledEvents,
  joinScheduledEvent: scheduledEventController.joinScheduledEvent,
  cancelScheduledEvent: scheduledEventController.cancelScheduledEvent,

  // adminAction
  getAdminActions: adminActionController.getAdminActions,
  logAdminAction: adminActionController.logAdminAction,

  // verification
  submitVerification: verificationController.submitVerification,
  getMyVerificationStatus: verificationController.getMyVerificationStatus,
  reviewVerification: verificationController.reviewVerification,
  getAllVerifications: verificationController.getAllVerifications,

  // dashboardStats
  getDashboardStats: dashboardStatsController.getDashboardStats,
  getRecentRegistrations: dashboardStatsController.getRecentRegistrations,

  // credentials
  razorpayCredentials: credentialsController.razorpayCredentials,
  getAllCredentials: credentialsController.getAllCredentials,
  addNewCredentials: credentialsController.addNewCredentials,
  deleteCredential: credentialsController.deleteCredential,
  restoreCredential: credentialsController.restoreCredential,

  // plans
  createNewPlan: plansController.createNewPlan,
  getAllPlans: plansController.getAllPlans,
  getActivePlans: plansController.getActivePlans,
  deletePlan: plansController.deletePlan,
  restorePlan: plansController.restorePlan,
};

// Map validation schemas to handler names
const validationSchemas = {
  register: registerSchema,
  login: loginSchema,
  changePassword: changePasswordSchema,
  updateProfile: updateProfileSchema,
  createReport: createReportSchema,
  blockUser: blockUserSchema,
  sendMessage: sendMessageSchema,
  rateMatch: rateMatchSchema,
  purchaseTokens: purchaseTokensSchema,
  createScheduledEvent: createScheduledEventSchema,
  submitVerification: submitVerificationSchema,
  reviewVerification: reviewVerificationSchema,
  createInterestRoom: createInterestRoomSchema,
  createNewPlan: createPlanSchema,
  addNewCredentials: addCredentialSchema,
};

// Handlers that skip authentication entirely
const bypassAuth = new Set([
  'register', 'login', 'refreshToken', 'forgotPassword', 'resetPassword',
  'stripeWebhook', 'razorpayCredentials', 'getActivePlans', 'getActiveInterestRooms',
  'getScheduledEvents', 'getUserById',
]);

// Role requirements — applied after authenticate
const authRoles = {
  // Admin only
  getAdminActions: ['admin'],
  logAdminAction: ['admin'],
  getDashboardStats: ['admin'],
  getRecentRegistrations: ['admin'],
  getAllCredentials: ['admin'],
  addNewCredentials: ['admin'],
  deleteCredential: ['admin'],
  restoreCredential: ['admin'],
  createNewPlan: ['admin'],
  deletePlan: ['admin'],
  restorePlan: ['admin'],
  deleteUser: ['admin'],
  restoreUser: ['admin'],
  getDeletedUsers: ['admin'],
  getAllUsers: ['admin'],
  getAllVerifications: ['admin'],
  getAllInterestRooms: ['admin', 'moderator'],
  getDeletedInterestRooms: ['admin', 'moderator'],
  restoreInterestRoom: ['admin', 'moderator'],
  // Admin or moderator
  getReports: ['admin', 'moderator'],
  resolveReport: ['admin', 'moderator'],
  reviewVerification: ['admin', 'moderator'],
  updateUserStatus: ['admin', 'moderator'],
  createInterestRoom: ['admin', 'moderator'],
  updateInterestRoom: ['admin', 'moderator'],
  deleteInterestRoom: ['admin', 'moderator'],
};

const setupRoutes = () => {
  for (const [group, routes] of Object.entries(routePaths)) {
    for (const route of routes) {
      const { method, path, handler } = route;
      const controllerFn = handlers[handler];
      if (!controllerFn) {
        console.warn(`⚠️  Handler '${handler}' not found for ${group}/${path}`);
        continue;
      }

      const fullPath = path ? `/${group}/${path}` : `/${group}`;
      const middlewares = [];

      if (!bypassAuth.has(handler)) {
        middlewares.push(authenticate);
        if (authRoles[handler]) {
          middlewares.push(authorize(...authRoles[handler]));
        }
      }

      const schema = validationSchemas[handler];
      if (schema) middlewares.push(validate(schema));

      middlewares.push(controllerFn);
      router[method](fullPath, ...middlewares);
    }
  }
};

setupRoutes();

export default router;
