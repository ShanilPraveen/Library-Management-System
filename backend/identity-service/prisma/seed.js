const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// HARDCODED UUIDs (SHARED ACROSS SERVICES)
const USERS = {
  ADMIN: "11111111-1111-1111-1111-111111111111",
  LIB_1: "22222222-2222-2222-2222-222222222222",
  LIB_2: "33333333-3333-3333-3333-333333333333",
  MEMBER_GOOD: "aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", // Alice (Good standing)
  MEMBER_LATE: "bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", // Bob (Always late)
  MEMBER_NEW:  "ccccccc-cccc-cccc-cccc-cccccccccccc", // Charlie (New joiner)
  MEMBER_DAMAGER: "ddddddd-dddd-dddd-dddd-dddddddddddd" // Dave (Damages books)
};

async function main() {
  // Clear existing data
  await prisma.user.deleteMany({});

  const users = [
    // --- STAFF ---
    {
      id: USERS.ADMIN,
      cognitoId: "cog-admin-01",
      username: "superadmin",
      role: "ADMIN",
      name: "Diana Prince",
      phone: "+1234567890",
      nic: "900000000V"
    },
    {
      id: USERS.LIB_1,
      cognitoId: "cog-lib-01",
      username: "librarian_clark",
      role: "LIBRARIAN",
      name: "Clark Kent",
      phone: "+1987654321",
      nic: "910000000V"
    },
    {
      id: USERS.LIB_2,
      cognitoId: "cog-lib-02",
      username: "librarian_lois",
      role: "LIBRARIAN",
      name: "Lois Lane",
      phone: "+1122334455",
      nic: "920000000V"
    },

    // --- MEMBERS ---
    {
      id: USERS.MEMBER_GOOD,
      cognitoId: "cog-mem-01",
      username: "alice_wonder",
      role: "MEMBER",
      name: "Alice Wonderland",
      address: "123 Rabbit Hole Ln",
      age: 25,
      nic: "950000001V",
      phone: "0771234567"
    },
    {
      id: USERS.MEMBER_LATE,
      cognitoId: "cog-mem-02",
      username: "bob_builder",
      role: "MEMBER",
      name: "Bob Builder",
      address: "45 Construction Ave",
      age: 34,
      nic: "950000002V",
      phone: "0777654321"
    },
    {
      id: USERS.MEMBER_NEW,
      cognitoId: "cog-mem-03",
      username: "charlie_chaplin",
      role: "MEMBER",
      name: "Charlie Chaplin",
      address: "88 Silent Movie Blvd",
      age: 40,
      nic: "950000003V"
    },
    {
      id: USERS.MEMBER_DAMAGER,
      cognitoId: "cog-mem-04",
      username: "dave_destroyer",
      role: "MEMBER",
      name: "Dave Destroyer",
      address: "99 Chaos St",
      age: 19,
      nic: "950000004V"
    }
  ];

  // Generate 6 more filler members
  for (let i = 5; i <= 10; i++) {
    users.push({
      id: `eeeeeeee-eeee-eeee-eeee-00000000000${i}`,
      cognitoId: `cog-mem-0${i}`,
      username: `member_${i}`,
      role: "MEMBER",
      name: `Member Number ${i}`,
      address: `Street ${i}`,
      age: 20 + i,
      nic: `95000000${i}V`
    });
  }

  for (const u of users) {
    await prisma.user.create({ data: u });
  }

  console.log(`Identity Service: Seeded ${users.length} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });