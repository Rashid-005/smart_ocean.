import {
  mockPredictions,
  mockReports,
  mockUsers,
  mockZones,
  type FishingReport,
  type User,
} from "@/lib/mock-backend";

// Temporary in-memory repositories for Phase 2 (replaced by Prisma in Phase 3).
// Business logic should use these instead of importing mock arrays directly.

export const userRepository = {
  findByIdentifier(identifier: string) {
    const lowered = identifier.toLowerCase();
    return (
      mockUsers.find(
        (u) => u.phone === identifier || u.email.toLowerCase() === lowered,
      ) ?? null
    );
  },
  findById(id: string): User | null {
    return mockUsers.find((u) => u.id === id) ?? null;
  },
  create(data: Omit<User, "id" | "createdAt"> & { id?: string }) {
    const user: User = {
      ...data,
      id: data.id ?? `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(user);
    return user;
  },
};

export const zoneRepository = {
  list() {
    return mockZones.map((z) => ({ ...z }));
  },
  findById(id: string) {
    return mockZones.find((z) => z.id === id) ?? null;
  },
};

export const predictionRepository = {
  list() {
    return mockPredictions.map((p) => ({ ...p }));
  },
  findByZoneId(zoneId: string) {
    return mockPredictions.find((p) => p.zoneId === zoneId) ?? null;
  },
};

export const reportRepository = {
  listByUser(userId: string): FishingReport[] {
    return mockReports.filter((r) => r.userId === userId);
  },
  findByIdForUser(id: string, userId: string) {
    return mockReports.find((r) => r.id === id && r.userId === userId) ?? null;
  },
};
