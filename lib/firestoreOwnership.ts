export type OwnershipDocument = {
  ownerId?: string;
  authorId?: string;
};

export function withOwnershipMetadata<T extends object>(record: T, userId: string): T & { ownerId: string; authorId: string } {
  const ownerId = (record as OwnershipDocument).ownerId ?? userId;
  const authorId = (record as OwnershipDocument).authorId ?? ownerId;

  return {
    ...record,
    ownerId,
    authorId,
  } as T & { ownerId: string; authorId: string };
}

export function normalizeOwnershipCollection<T extends object>(records: T[], userId: string) {
  return records.map((record) => withOwnershipMetadata(record, userId));
}

export function getOwnershipId<T extends object>(record: T, fallbackUserId?: string) {
  return (record as OwnershipDocument).ownerId ?? (record as OwnershipDocument).authorId ?? fallbackUserId ?? '';
}
