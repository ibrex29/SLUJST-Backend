// import { PrismaClient } from '@prisma/client';


// const prisma = new PrismaClient();

// const roles = [
//   { roleName: "super-admin", description: "Has full access to all features and settings.", createdBy: "system", updatedBy: "system" },
//   { roleName: "Editor-in-Chief", description: "Oversees the entire editorial process.", createdBy: "system", updatedBy: "system" },
//   { roleName: " ", description: "Manages the editorial workflow.", createdBy: "system", updatedBy: "system" },
//   { roleName: "Section-Editor", description: "Manages specific sections of the publication.", createdBy: "system", updatedBy: "system" },
//   { roleName: "Associate-Editor", description: "Assists the section editors.", createdBy: "system", updatedBy: "system" },
//   { roleName: "Production-Editor", description: "Oversees the production process.", createdBy: "system", updatedBy: "system" },
//   { roleName: "Copy-Editor", description: "Edits content for grammar and style.", createdBy: "system", updatedBy: "system" },
//   { roleName: "reviewer", description: "Reviews submissions for quality and accuracy.", createdBy: "system", updatedBy: "system" },
//   { roleName: "author", description: "Submits manuscript for review and publication", createdBy: "system", updatedBy: "system" }
// ];

// async function main() {
//   // Insert roles
//   for (const role of roles) {
//     await prisma.role.create({
//       data: role
//     });
//   }

// //   // Create a sample user with a specific role
// //   const user = await prisma.user.create({
// //     data: {
// //       firstName: "John",
// //       lastName: "Doe",
// //       password: "hashed_password_here", // Make sure to hash the password in a real application
// //       email: "john.doe@example.com",
// //       createdBy: "system",
// //       updatedBy: "system",
// //       roles: {
// //         connect: { roleName: "super-admin" }
// //       },
// //       Editor: {
// //         create: {
// //           roleN: "Editor-in-Chief"
// //         }
// //       }
// //     }
// //   });

// //   console.log('User with Editor-in-Chief role created:', user);
// // }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });}
