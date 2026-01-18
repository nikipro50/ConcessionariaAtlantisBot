interface PreorderCacheData {
    employee?: string;
    client?: string;
    vehicle?: string;
}

const preorders: Map<number, PreorderCacheData> = new Map();

export function addPreorder(userId: number, data: Partial<PreorderCacheData>) {
    const existing = preorders.get(userId) || {};
    preorders.set(userId, { ...existing, ...data });
}

export function getPreorder(userId: number) {
    return preorders.get(userId);
}

export function removePreorder(userId: number) {
    preorders.delete(userId);
}
