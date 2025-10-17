"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CreateSubscriptionData {
  email: string;
  username: string;
  frequency?: "daily" | "weekly" | "realtime";
}

export async function createSubscription(data: CreateSubscriptionData) {
  try {
    console.log("Creating subscription:", data);

    const subscription = await prisma.subscription.create({
      data: {
        email: data.email,
        username: data.username,
        frequency: data.frequency || "daily",
      },
    });

    console.log("Subscription created successfully:", subscription.id);

    revalidatePath("/");
    return { success: true, subscription };
  } catch (error: any) {
    console.error("Error creating subscription:", error);

    if (error.code === "P2002") {
      return { success: false, error: "You're already subscribed to this user" };
    }

    // Return more specific error information
    return {
      success: false,
      error: `Failed to create subscription: ${error.message || "Unknown error"}`
    };
  }
}

export async function getSubscriptions(email?: string) {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: email ? { email } : {},
      orderBy: { createdAt: "desc" },
    });

    return { success: true, subscriptions };
  } catch (error) {
    return { success: false, error: "Failed to fetch subscriptions" };
  }
}

export async function deleteSubscription(id: string) {
  try {
    await prisma.subscription.delete({
      where: { id },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete subscription" };
  }
}

export async function updateSubscriptionLastChecked(id: string) {
  try {
    await prisma.subscription.update({
      where: { id },
      data: { lastChecked: new Date() },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update last checked" };
  }
}
