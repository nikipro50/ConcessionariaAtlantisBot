import BaseDatabase from "../Database";

export type LeaveStatus = "PENDING" | "ACTIVE" | "FINISHED";

export interface LeaveRow {
    id: number;
    minecraft_nickname: string;
    status: LeaveStatus;
    start_date: number; // timestamp ms
    end_date: number;   // timestamp ms
}

export default class LeaveRepository {

    /* =========================
       CREAZIONE / STATO
    ========================= */

    async createLeave(
        minecraftNickname: string,
        startDate: Date,
        endDate: Date
    ): Promise<number> {
        const db = BaseDatabase.get();

        const result = await db.run(
            `
            INSERT INTO leaves (
                minecraft_nickname,
                status,
                start_date,
                end_date
            ) VALUES (?, 'PENDING', ?, ?)
            `,
            minecraftNickname,
            startDate.getTime(),
            endDate.getTime()
        );

        return result.lastID!;
    }

    async approveLeave(leaveId: number): Promise<void> {
        const db = BaseDatabase.get();

        await db.run(
            `
            UPDATE leaves
            SET status = 'ACTIVE'
            WHERE id = ?
              AND status = 'PENDING'
            `,
            leaveId
        );
    }

    async finishLeave(leaveId: number): Promise<void> {
        const db = BaseDatabase.get();

        await db.run(
            `
            UPDATE leaves
            SET status = 'FINISHED'
            WHERE id = ?
              AND status = 'ACTIVE'
            `,
            leaveId
        );
    }

    async autoFinishExpiredLeaves(): Promise<LeaveRow[]> {
        const db = BaseDatabase.get();
        const now = Date.now();

        const expiredLeaves: LeaveRow[] = await db.all(
            `
            SELECT *
            FROM leaves
            WHERE status = 'ACTIVE'
              AND end_date <= ?
            `,
            now
        );

        if (expiredLeaves.length === 0) return [];

        await db.run(
            `
            UPDATE leaves
            SET status = 'FINISHED'
            WHERE status = 'ACTIVE'
              AND end_date <= ?
            `,
            now
        );

        return expiredLeaves;
    }

    async getActiveLeave(minecraftNickname: string): Promise<LeaveRow | undefined> {
        const db = BaseDatabase.get();

        return db.get(
            `
            SELECT *
            FROM leaves
            WHERE minecraft_nickname = ?
              AND status = 'ACTIVE'
            `,
            minecraftNickname
        );
    }

    async getPendingLeaves(): Promise<LeaveRow[]> {
        const db = BaseDatabase.get();

        return db.all(
            `
            SELECT *
            FROM leaves
            WHERE status = 'PENDING'
            ORDER BY start_date ASC
            `
        );
    }

    async getLeaveHistory(minecraftNickname: string): Promise<LeaveRow[]> {
        const db = BaseDatabase.get();

        return db.all(
            `
            SELECT *
            FROM leaves
            WHERE minecraft_nickname = ?
            ORDER BY start_date DESC
            `,
            minecraftNickname
        );
    }

    async getLeavesHistory(): Promise<LeaveRow[]> {
        const db = BaseDatabase.get();

        return db.all(
            `
            SELECT *
            FROM leaves
            ORDER BY start_date DESC
            `
        );
    }

    async getLeaveById(leaveId: number): Promise<LeaveRow | undefined> {
        const db = BaseDatabase.get();

        return db.get(
            `SELECT * FROM leaves WHERE id = ?`,
            leaveId
        );
    }

    async getLeaveCountByEmployee(nickname: string): Promise<number> {
        const db = BaseDatabase.get();

        const row = await db.get(
            `SELECT COUNT(*) as count FROM leaves WHERE minecraft_nickname = ?`,
            nickname
        );

        return row.count;
    }

    async getTotalLeaveCount(): Promise<number> {
        const db = BaseDatabase.get();

        const row = await db.get(
            `SELECT COUNT(*) as count FROM leaves`
        );

        return row.count;
    }
}
