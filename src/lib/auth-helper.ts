import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getAuthenticatedUser() {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        return null;
    }

    // Try to find user in DB
    let user = await prisma.user.findUnique({
        where: { clerkId },
    });

    // If not found, create (Sync Clerk user to local DB)
    if (!user) {
        const clerkUser = await currentUser();
        if (!clerkUser) return null;

        const email = clerkUser.emailAddresses[0]?.emailAddress;

        user = await prisma.user.create({
            data: {
                clerkId,
                email,
            },
        });
    }

    return user;
}
