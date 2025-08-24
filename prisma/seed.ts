import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
enum UserType {
  REVIEWER = 'reviewer',
  AUTHOR = 'author',
  SUPERADMIN = 'super-admin',
  EDITOR_IN_CHIEF = 'Editor-in-Chief',
  MANAGING_EDITOR = 'Managing-Editor',
  SECTION_EDITOR = 'Section-Editor',
  ASSOCIATE_EDITOR = 'Associate-Editor',
  PRODUCTION_EDITOR = 'Production-Editor',
  COPY_EDITOR = 'Copy-Editor',
}


const roles = [
  {
    roleName: UserType.SUPERADMIN,
    description: "Has full access to all features and settings.",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    roleName: UserType.EDITOR_IN_CHIEF,
    description: "Oversees the entire editorial process.",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    roleName: UserType.MANAGING_EDITOR,
    description: "Manages the editorial workflow.",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    roleName: UserType.SECTION_EDITOR,
    description: "Manages specific sections of the publication.",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    roleName: UserType.ASSOCIATE_EDITOR,
    description: "Assists the section editors.",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    roleName: UserType.PRODUCTION_EDITOR,
    description: "Oversees the production process.",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    roleName: UserType.COPY_EDITOR,
    description: "Edits content for grammar and style.",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    roleName: UserType.REVIEWER,
    description: "Reviews submissions for quality and accuracy.",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    roleName: UserType.AUTHOR,
    description: "Submits manuscripts for review and publication.",
    createdBy: "system",
    updatedBy: "system",
  },
];

async function main() {
  // 1. Seed roles (skip duplicates via upsert)
  for (const role of roles) {
    await prisma.role.upsert({
      where: { roleName: role.roleName },
      update: {}, // don’t overwrite existing records
      create: role,
    });
  }

  console.log('✅ Roles seeded successfully');

  // 2. Create first Editor-in-Chief if not exists
  const existingChief = await prisma.user.findFirst({
    where: { roles: { some: { roleName: UserType.EDITOR_IN_CHIEF } } },
  });

  if (!existingChief) {
    const hashedPassword = await bcrypt.hash('changeme123', 10);

    const chief = await prisma.user.create({
      data: {
        firstName: 'Chief',
        lastName: 'Editor',
        email: 'chief.editor@slujs.slu.edu.ng',
        password: hashedPassword,
        createdBy: 'system',
        updatedBy: 'system',
        roles: {
          connect: { roleName: UserType.EDITOR_IN_CHIEF },
        },
      },
    });

    console.log('👑 First Editor-in-Chief user created:', chief.email);
  } else {
    console.log('ℹ️ Editor-in-Chief already exists, skipping creation.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
