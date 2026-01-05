import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedTestUsers() {
  console.log("🌱 Seeding test users...");

  const testUsers = [
    {
      email: "john.doe@test.com",
      name: "John Doe",
      onboardingCompleted: true,
      jrScore: 78.5,
      college: "MIT",
    },
    {
      email: "jane.smith@test.com",
      name: "Jane Smith",
      onboardingCompleted: true,
      jrScore: 85.0,
      college: "Stanford University",
    },
    {
      email: "bob.wilson@test.com",
      name: "Bob Wilson",
      onboardingCompleted: false,
      jrScore: 0,
      college: "UC Berkeley",
    },
    {
      email: "alice.brown@test.com",
      name: "Alice Brown",
      onboardingCompleted: true,
      jrScore: 92.3,
      college: "Harvard University",
    },
    {
      email: "charlie.davis@test.com",
      name: "Charlie Davis",
      onboardingCompleted: true,
      jrScore: 68.7,
      college: "Yale University",
    },
    {
      email: "emma.johnson@test.com",
      name: "Emma Johnson",
      onboardingCompleted: false,
      jrScore: 0,
      college: "Princeton University",
    },
    {
      email: "david.lee@test.com",
      name: "David Lee",
      onboardingCompleted: true,
      jrScore: 88.9,
      college: "Columbia University",
    },
    {
      email: "sarah.miller@test.com",
      name: "Sarah Miller",
      onboardingCompleted: true,
      jrScore: 95.2,
      college: "University of Chicago",
    },
  ];

  try {
    for (const userData of testUsers) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`⏭️  User already exists: ${userData.email}`);
        continue;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          onboardingCompleted: userData.onboardingCompleted,
          jrScore: userData.jrScore,
          emailVerified: true,
          authProviders: "email",
          createdWith: "email",
        },
      });

      // Create onboarding profile if completed
      if (userData.onboardingCompleted) {
        await prisma.onboardingProfile.create({
          data: {
            userId: user.id,
            name: userData.name,
            college: userData.college,
            status: "Student",
            flowPath: "student",
            completedAt: new Date(),
          },
        });

        // Create career analysis
        await prisma.careerAnalysis.create({
          data: {
            userId: user.id,
            jrScore: userData.jrScore,
            skillGap: Math.floor(Math.random() * 50),
            topRole: "Software Engineer",
            topRoleMatch: userData.jrScore,
          },
        });
      }

      console.log(`✅ Created user: ${userData.name} (${userData.email})`);
    }

    console.log(`\n🎉 Successfully seeded ${testUsers.length} test users!`);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUsers().catch((error) => {
  console.error(error);
  process.exit(1);
});
