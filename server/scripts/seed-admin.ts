import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedAdmin() {
  console.log("🌱 Seeding admin users...");

  // Default admin credentials - CHANGE THESE IN PRODUCTION!
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@exoptus.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    // Check if admin already exists
    const existing = await prisma.adminUser.findUnique({
      where: { email: adminEmail },
    });

    if (existing) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      return;
    }

    // Create admin user
    const admin = await prisma.adminUser.create({
      data: {
        email: adminEmail,
        name: "Exoptus Admin",
        password: hashedPassword,
        role: "super_admin",
        isActive: true,
      },
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`\n⚠️  IMPORTANT: Change the default password in production!`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
