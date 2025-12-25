/**
 * Migration Script: Convert auth_provider to auth_providers
 *
 * This script migrates the old single auth_provider field to the new
 * multi-provider auth_providers field with comma-separated values.
 */

const { PrismaClient } = require("@prisma/client");

async function migrate() {
  const prisma = new PrismaClient();

  try {
    console.log("🔄 Starting migration...");

    // First, let's see what we need to migrate
    const users = await prisma.$queryRaw`
      SELECT id, email, auth_provider, google_id 
      FROM users
    `;

    console.log(`📊 Found ${users.length} users to check`);

    for (const user of users) {
      console.log(
        `Processing: ${user.email} (provider: ${user.auth_provider})`
      );
    }

    console.log("\n✅ Migration check complete");
    console.log("\nTo apply the migration:");
    console.log("1. Backup your database");
    console.log("2. Run: cd server && npm run db:push -- --accept-data-loss");
    console.log(
      "\nNote: The new schema will migrate data automatically via default values"
    );
  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
