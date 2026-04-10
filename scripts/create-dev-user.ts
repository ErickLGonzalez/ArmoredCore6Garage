import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const username = "EJRaven";
  const password = "1234";
  const passwordHash = hashPassword(password);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      displayName: username,
    },
    create: {
      username,
      email: null,
      displayName: username,
      passwordHash,
      theme: "TOKYONIGHT",
    },
    select: {
      id: true,
      username: true,
      email: true,
      theme: true,
      createdAt: true,
    },
  });

  console.log("Dev user ready:", user);
  console.log("Login with username/password:", username, password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
