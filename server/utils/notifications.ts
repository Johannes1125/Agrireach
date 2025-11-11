import { connectToDatabase } from "../lib/mongodb";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { Types } from "mongoose";
import { triggerNotification } from "../../lib/pusher-server";

export interface CreateNotificationData {
  user_id: string | Types.ObjectId;
  type: string;
  title: string;
  message: string;
  priority?: "low" | "medium" | "high";
  action_url?: string;
}

export async function createNotification(data: CreateNotificationData) {
  try {
    await connectToDatabase();
    
    const notification = await Notification.create({
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || "medium",
      action_url: data.action_url,
      read: false,
    });

    // Trigger real-time notification via Pusher
    try {
      await triggerNotification(data.user_id.toString(), {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        action_url: notification.action_url,
        read: notification.read,
        created_at: notification.created_at,
      });
    } catch (pusherError) {
      // Don't fail notification creation if Pusher fails
      console.error("Failed to trigger Pusher notification:", pusherError);
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

// Notification templates for different events
export const NotificationTemplates = {
  // Job-related notifications
  jobApplication: (applicantName: string, jobTitle: string, jobId: string) => ({
    type: "job",
    title: "New Job Application",
    message: `${applicantName} applied for ${jobTitle}`,
    priority: "high" as const,
    action_url: `/opportunities/${jobId}`,
  }),

  jobAccepted: (jobTitle: string, companyName: string, jobId: string) => ({
    type: "job",
    title: "Application Accepted",
    message: `Your application for ${jobTitle} at ${companyName} has been accepted!`,
    priority: "high" as const,
    action_url: `/opportunities/${jobId}`,
  }),

  jobRejected: (jobTitle: string, companyName: string) => ({
    type: "job",
    title: "Application Update",
    message: `Your application for ${jobTitle} at ${companyName} was not selected this time`,
    priority: "medium" as const,
    action_url: "/opportunities",
  }),

  newJobPosted: (jobTitle: string, location: string, jobId: string) => ({
    type: "job",
    title: "New Job Available",
    message: `New job posted: ${jobTitle} in ${location}`,
    priority: "medium" as const,
    action_url: `/opportunities/${jobId}`,
  }),

  // Marketplace notifications
  orderPlaced: (productName: string, buyerName: string, orderId: string) => ({
    type: "order",
    title: "New Order Received",
    message: `${buyerName} ordered ${productName}`,
    priority: "high" as const,
    action_url: `/marketplace/orders/${orderId}`,
  }),

  orderShipped: (productName: string, orderId: string) => ({
    type: "order",
    title: "Order Shipped",
    message: `Your order for ${productName} has been shipped`,
    priority: "medium" as const,
    action_url: `/marketplace/orders/${orderId}`,
  }),

  orderDelivered: (productName: string, orderId: string) => ({
    type: "order",
    title: "Order Delivered",
    message: `Your order for ${productName} has been delivered`,
    priority: "medium" as const,
    action_url: `/marketplace/orders/${orderId}`,
  }),

  newProductListed: (productName: string, sellerName: string, productId: string) => ({
    type: "marketplace",
    title: "New Product Available",
    message: `${sellerName} listed ${productName} in the marketplace`,
    priority: "low" as const,
    action_url: `/marketplace/products/${productId}`,
  }),

  // Review notifications
  reviewReceived: (reviewerName: string, rating: number, reviewId: string) => ({
    type: "review",
    title: "New Review Received",
    message: `${reviewerName} gave you a ${rating}-star review`,
    priority: "medium" as const,
    action_url: `/reviews/${reviewId}`,
  }),

  reviewResponse: (responderName: string, reviewId: string) => ({
    type: "review",
    title: "Review Response",
    message: `${responderName} responded to your review`,
    priority: "low" as const,
    action_url: `/reviews/${reviewId}`,
  }),

  // Community notifications
  threadReply: (replierName: string, threadTitle: string, threadId: string) => ({
    type: "message",
    title: "New Reply",
    message: `${replierName} replied to "${threadTitle}"`,
    priority: "low" as const,
    action_url: `/community/thread/${threadId}`,
  }),

  threadMention: (mentionerName: string, threadTitle: string, threadId: string) => ({
    type: "message",
    title: "You were mentioned",
    message: `${mentionerName} mentioned you in "${threadTitle}"`,
    priority: "medium" as const,
    action_url: `/community/thread/${threadId}`,
  }),

  newThreadPosted: (authorName: string, threadTitle: string, threadId: string) => ({
    type: "community",
    title: "New Community Thread",
    message: `${authorName} posted: "${threadTitle}"`,
    priority: "low" as const,
    action_url: `/community/thread/${threadId}`,
  }),

  // System notifications
  profileIncomplete: () => ({
    type: "system",
    title: "Complete Your Profile",
    message: "Complete your profile to get better job matches and increase trust",
    priority: "low" as const,
    action_url: "/profile",
  }),

  verificationRequired: () => ({
    type: "system",
    title: "Verify Your Account",
    message: "Verify your account to unlock all features and build trust",
    priority: "medium" as const,
    action_url: "/settings",
  }),

  trustScoreUpdate: (newScore: number) => ({
    type: "system",
    title: "Trust Score Updated",
    message: `Your trust score has been updated to ${newScore}/100`,
    priority: "low" as const,
    action_url: "/profile",
  }),
};

// Helper functions to create specific notifications
export async function notifyJobApplication(recruiterId: string, applicantName: string, jobTitle: string, jobId: string) {
  const template = NotificationTemplates.jobApplication(applicantName, jobTitle, jobId);
  return createNotification({
    user_id: recruiterId,
    ...template,
  });
}

export async function notifyJobAccepted(workerId: string, jobTitle: string, companyName: string, jobId: string) {
  const template = NotificationTemplates.jobAccepted(jobTitle, companyName, jobId);
  return createNotification({
    user_id: workerId,
    ...template,
  });
}

export async function notifyOrderPlaced(sellerId: string, productName: string, buyerName: string, orderId: string) {
  const template = NotificationTemplates.orderPlaced(productName, buyerName, orderId);
  return createNotification({
    user_id: sellerId,
    ...template,
  });
}

export async function notifyReviewReceived(revieweeId: string, reviewerName: string, rating: number, reviewId: string) {
  const template = NotificationTemplates.reviewReceived(reviewerName, rating, reviewId);
  return createNotification({
    user_id: revieweeId,
    ...template,
  });
}

export async function notifyNewProduct(userIds: string[], productName: string, sellerName: string, productId: string) {
  const template = NotificationTemplates.newProductListed(productName, sellerName, productId);
  
  const notifications = userIds.map(userId => createNotification({
    user_id: userId,
    ...template,
  }));

  return Promise.all(notifications);
}

// Bulk notification for new job postings to relevant workers
export async function notifyNewJob(workerIds: string[], jobTitle: string, location: string, jobId: string) {
  const template = NotificationTemplates.newJobPosted(jobTitle, location, jobId);
  
  const notifications = workerIds.map(workerId => createNotification({
    user_id: workerId,
    ...template,
  }));

  return Promise.all(notifications);
}

// Helper function to get all regular user IDs (excluding admins)
export async function getAllRegularUserIds(): Promise<string[]> {
  try {
    await connectToDatabase();
    // Get all users with regular roles (worker, recruiter, buyer)
    const users = await User.find(
      { role: { $in: ["worker", "recruiter", "buyer"] }, status: "active" },
      { _id: 1 }
    ).lean();
    return users.map(user => user._id.toString());
  } catch (error) {
    console.error("Failed to get regular user IDs:", error);
    return [];
  }
}

// Notify all users about new job posting
export async function notifyAllUsersNewJob(jobTitle: string, companyName: string, location: string, jobId: string) {
  const userIds = await getAllRegularUserIds();
  if (userIds.length === 0) return [];
  
  const template = NotificationTemplates.newJobPosted(jobTitle, location, jobId);
  
  const notifications = userIds.map(userId => createNotification({
    user_id: userId,
    ...template,
  }));

  return Promise.all(notifications);
}

// Notify all users about new product listing
export async function notifyAllUsersNewProduct(productName: string, sellerName: string, productId: string) {
  const userIds = await getAllRegularUserIds();
  if (userIds.length === 0) return [];
  
  const template = NotificationTemplates.newProductListed(productName, sellerName, productId);
  
  const notifications = userIds.map(userId => createNotification({
    user_id: userId,
    ...template,
  }));

  return Promise.all(notifications);
}

// Notify all users about new community thread
export async function notifyAllUsersNewThread(authorName: string, threadTitle: string, threadId: string) {
  const userIds = await getAllRegularUserIds();
  if (userIds.length === 0) return [];
  
  const template = NotificationTemplates.newThreadPosted(authorName, threadTitle, threadId);
  
  const notifications = userIds.map(userId => createNotification({
    user_id: userId,
    ...template,
  }));

  return Promise.all(notifications);
}
