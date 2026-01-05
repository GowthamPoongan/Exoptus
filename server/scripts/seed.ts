/**
 * Database Seeder - Populate initial roles and jobs
 * Run: npx ts-node scripts/seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with roles and jobs...");

  // Clear existing data
  await prisma.job.deleteMany();
  await prisma.role.deleteMany();

  // Create Roles
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        title: "Frontend Developer",
        description: "Build responsive user interfaces with React/Vue",
        salaryMin: 50000,
        salaryMax: 100000,
        salaryCurrency: "USD",
        skillsRequired: JSON.stringify([
          "React",
          "JavaScript",
          "HTML/CSS",
          "REST APIs",
        ]),
        experienceYears: 1,
        educationLevel: "Bachelor's",
        category: "Frontend",
        difficulty: "intermediate",
        demandLevel: "high",
      },
    }),

    prisma.role.create({
      data: {
        title: "Backend Developer",
        description: "Build scalable server-side applications",
        salaryMin: 60000,
        salaryMax: 120000,
        salaryCurrency: "USD",
        skillsRequired: JSON.stringify([
          "Node.js",
          "Python",
          "SQL",
          "APIs",
          "Databases",
        ]),
        experienceYears: 2,
        educationLevel: "Bachelor's",
        category: "Backend",
        difficulty: "intermediate",
        demandLevel: "high",
      },
    }),

    prisma.role.create({
      data: {
        title: "Full Stack Developer",
        description: "Work on both frontend and backend",
        salaryMin: 70000,
        salaryMax: 140000,
        salaryCurrency: "USD",
        skillsRequired: JSON.stringify([
          "React",
          "Node.js",
          "JavaScript",
          "SQL",
          "REST APIs",
        ]),
        experienceYears: 2,
        educationLevel: "Bachelor's",
        category: "Fullstack",
        difficulty: "advanced",
        demandLevel: "high",
      },
    }),

    prisma.role.create({
      data: {
        title: "Data Analyst",
        description: "Analyze data and create insights",
        salaryMin: 55000,
        salaryMax: 110000,
        salaryCurrency: "USD",
        skillsRequired: JSON.stringify([
          "SQL",
          "Python",
          "Excel",
          "Tableau",
          "Statistics",
        ]),
        experienceYears: 1,
        educationLevel: "Bachelor's",
        category: "Data",
        difficulty: "intermediate",
        demandLevel: "high",
      },
    }),

    prisma.role.create({
      data: {
        title: "Machine Learning Engineer",
        description: "Build ML models and AI solutions",
        salaryMin: 80000,
        salaryMax: 160000,
        salaryCurrency: "USD",
        skillsRequired: JSON.stringify([
          "Python",
          "TensorFlow",
          "ML Algorithms",
          "Statistics",
          "SQL",
        ]),
        experienceYears: 2,
        educationLevel: "Bachelor's",
        category: "ML",
        difficulty: "advanced",
        demandLevel: "high",
      },
    }),

    prisma.role.create({
      data: {
        title: "DevOps Engineer",
        description: "Manage infrastructure and deployment",
        salaryMin: 75000,
        salaryMax: 140000,
        salaryCurrency: "USD",
        skillsRequired: JSON.stringify([
          "Docker",
          "Kubernetes",
          "AWS",
          "CI/CD",
          "Linux",
        ]),
        experienceYears: 2,
        educationLevel: "Bachelor's",
        category: "DevOps",
        difficulty: "advanced",
        demandLevel: "high",
      },
    }),
  ]);

  console.log(`✅ Created ${roles.length} roles`);

  // Create sample Jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: "Senior Frontend Developer",
        description: "5+ years building scalable React applications",
        company: "TechCorp",
        location: "San Francisco, CA",
        salaryMin: 120000,
        salaryMax: 180000,
        roleId: roles[0].id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    }),

    prisma.job.create({
      data: {
        title: "Backend Engineer (Python/Node.js)",
        description: "Build APIs and microservices",
        company: "StartupXYZ",
        location: "Remote",
        salaryMin: 80000,
        salaryMax: 130000,
        roleId: roles[1].id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),

    prisma.job.create({
      data: {
        title: "Full Stack Engineer (MERN)",
        description: "MongoDB, Express, React, Node.js stack",
        company: "WebServices Inc",
        location: "Austin, TX",
        salaryMin: 90000,
        salaryMax: 140000,
        roleId: roles[2].id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),

    prisma.job.create({
      data: {
        title: "Junior Data Analyst",
        description: "Entry-level analytics role with SQL and Tableau",
        company: "DataCorp",
        location: "New York, NY",
        salaryMin: 55000,
        salaryMax: 75000,
        roleId: roles[3].id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),

    prisma.job.create({
      data: {
        title: "ML Engineer (NLP Focus)",
        description: "Build NLP models for text analysis",
        company: "AILabs",
        location: "Boston, MA",
        salaryMin: 120000,
        salaryMax: 180000,
        roleId: roles[4].id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),

    prisma.job.create({
      data: {
        title: "DevOps/SRE Engineer",
        description: "Kubernetes, Docker, AWS, CI/CD pipelines",
        company: "CloudSys",
        location: "Seattle, WA",
        salaryMin: 110000,
        salaryMax: 160000,
        roleId: roles[5].id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`✅ Created ${jobs.length} jobs`);
  console.log("🎉 Database seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
