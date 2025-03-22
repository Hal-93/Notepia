import { prisma } from "~/db.server";
import type { Subscription } from "@prisma/client";

export async function addSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
  userId: string
): Promise<Subscription> {
  return await prisma.subscription.upsert({
    where: { endpoint: endpoint },
    update: {
      p256dh: p256dh,
      auth: auth,
    },
    create: {
      endpoint: endpoint,
      p256dh: p256dh,
      auth: auth,
      userId: userId,
    },
  });
}

export async function removeSubscription(endpoint: string) {
  return await prisma.subscription.delete({
    where: { endpoint: endpoint },
  });
}

export async function getSubscriptions(): Promise<Subscription[]> {
  return await prisma.subscription.findMany();
}

export async function isDeviceSubscribed(endpoint: string): Promise<boolean> {
  const device = await prisma.subscription.findFirst({
    where: {
      endpoint: endpoint,
    },
  });
  return device ? true : false;
}
