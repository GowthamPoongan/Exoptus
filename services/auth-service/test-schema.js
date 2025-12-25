const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "test@example.com" },
    });

    if (user) {
      console.log("✅ User found with NEW schema fields:");
      console.log("   - authProviders:", user.authProviders);
      console.log("   - createdWith:", user.createdWith);
      console.log("   - onboardingCompleted:", user.onboardingCompleted);
      console.log("   - onboardingStep:", user.onboardingStep);
      console.log("   - lastCompletedStep:", user.lastCompletedStep);
      console.log("   - emailVerified:", user.emailVerified);
      console.log("   - googleId:", user.googleId);
    } else {
      console.log("ℹ️  User not found");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
