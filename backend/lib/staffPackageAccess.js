import prisma from "./prismaClient.js";

export function buildAvailablePackagesWhere(user) {
  if (user?.role === "SUPER_ADMIN") {
    return { sellable: true };
  }

  return {
    sellable: true,
    staffAssignments: {
      some: {
        staffId: user?.id,
      },
    },
  };
}

export async function getAllowedPackageIdsForUser(user) {
  const rows = await prisma.package.findMany({
    where: buildAvailablePackagesWhere(user),
    select: { id: true },
  });

  return rows.map((row) => row.id);
}

export function normalizePackageIds(input) {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) {
    const err = new Error("packageIds must be an array");
    err.code = "INVALID_PACKAGE_IDS";
    throw err;
  }

  const normalized = [];
  const seen = new Set();

  for (const rawId of input) {
    const packageId = Number(rawId);

    if (!Number.isInteger(packageId) || packageId <= 0) {
      const err = new Error("packageIds must contain positive integers");
      err.code = "INVALID_PACKAGE_IDS";
      throw err;
    }

    if (!seen.has(packageId)) {
      seen.add(packageId);
      normalized.push(packageId);
    }
  }

  return normalized;
}

export async function validateGrantablePackageIds(user, packageIdsInput) {
  const packageIds = normalizePackageIds(packageIdsInput);
  const allowedPackageIds = await getAllowedPackageIdsForUser(user);
  const allowedSet = new Set(allowedPackageIds);
  const invalidPackageIds = packageIds.filter((packageId) => !allowedSet.has(packageId));

  return {
    packageIds,
    invalidPackageIds,
    allowedPackageIds,
  };
}
