import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const useMockPrisma = process.env.USE_MOCK_PRISMA === "true";

let prisma: any;

if (useMockPrisma) {
  const mockStore: any = {
    users: new Map(),
    issues: new Map(),
    recommendations: new Map(),
    skills: new Map()
  };

  prisma = {
    user: {
      findMany: async () => Array.from(mockStore.users.values()),
      create: async (data: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        const user = { id, ...data.data };
        mockStore.users.set(id, user);
        return user;
      },
      findUnique: async (data: any) => {
        const id = data.where?.id;
        return id ? mockStore.users.get(id) || null : null;
      },
      update: async (data: any) => {
        const id = data.where?.id;
        if (id && mockStore.users.has(id)) {
          const updated = { ...mockStore.users.get(id), ...data.data };
          mockStore.users.set(id, updated);
          return updated;
        }
        return data.data;
      },
      delete: async (data: any) => {
        const id = data.where?.id;
        const deleted = mockStore.users.get(id);
        if (id) mockStore.users.delete(id);
        return deleted || null;
      },
      upsert: async (data: any) => {
        const id = data.where?.id;
        const githubId = data.where?.githubId;

        let existingUser = null;
        if (githubId) {
          for (const user of mockStore.users.values()) {
            if (user.githubId === githubId) {
              existingUser = user;
              break;
            }
          }
        } else if (id) {
          existingUser = mockStore.users.get(id);
        }

        if (existingUser) {
          const updated = { ...existingUser, ...data.update };
          mockStore.users.set(existingUser.id, updated);
          return updated;
        }

        const newId = data.create.id || Math.random().toString(36).substr(2, 9);
        const newUser = { id: newId, ...data.create };
        mockStore.users.set(newId, newUser);
        return newUser;
      }
    },
    issue: {
      findMany: async () => Array.from(mockStore.issues.values()),
      create: async (data: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        const issue = { id, ...data.data };
        mockStore.issues.set(id, issue);
        return issue;
      },
      findUnique: async (data: any) => {
        const id = data.where?.id;
        return id ? mockStore.issues.get(id) || null : null;
      },
      update: async (data: any) => data.data,
      delete: async (data: any) => data.data,
      upsert: async (data: any) => ({ id: 1, ...data.create })
    },
    recommendation: {
      findMany: async () => Array.from(mockStore.recommendations.values()),
      create: async (data: any) => data.data,
      findUnique: async (data: any) => {
        const id = data.where?.id;
        return id ? mockStore.recommendations.get(id) || null : null;
      },
      update: async (data: any) => data.data,
      delete: async (data: any) => data.data,
      upsert: async (data: any) => ({ id: 1, ...data.create })
    },
    skill: {
      findMany: async () => Array.from(mockStore.skills.values()),
      create: async (data: any) => data.data,
      createMany: async (data: any) => {
        const items = Array.isArray(data.data) ? data.data : [];

        for (const item of items) {
          const id = Math.random().toString(36).substr(2, 9);
          const skill = { id, ...item };
          mockStore.skills.set(id, skill);
        }

        return { count: items.length };
      },
      findUnique: async (data: any) => {
        const id = data.where?.id;
        return id ? mockStore.skills.get(id) || null : null;
      },
      update: async (data: any) => data.data,
      delete: async (data: any) => data.data,
      deleteMany: async (data: any) => {
        const userId = data.where?.userId;
        let count = 0;

        for (const [id, skill] of mockStore.skills.entries()) {
          if (!userId || skill.userId === userId) {
            mockStore.skills.delete(id);
            count += 1;
          }
        }

        return { count };
      },
      upsert: async (data: any) => ({ id: 1, ...data.create })
    },
    $queryRaw: async () => 1,
    $disconnect: async () => {}
  };

  console.log("✅ Using mock database for development");
} else {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required when USE_MOCK_PRISMA is not true");
  }

  const adapter = new PrismaPg(connectionString);
  prisma = new PrismaClient({ adapter });
  console.log("✅ Using real Prisma database client");
}

export default prisma;