import BaseDatabase from "../Database";

export default class LeaveRepository {

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
            startDate.toISOString(),
            endDate.toISOString()
        );

        return result.lastID!;
    }


    async finishLeave(minecraftNickname: string): Promise<void> {
        const db = BaseDatabase.get();

        await db.run(
            `
            UPDATE leaves
            SET status = 'FINISHED',
                end_date = ?
            WHERE minecraft_nickname = ?
              AND status = 'ACTIVE'
            `,
            new Date().toISOString(),
            minecraftNickname
        );
    }

    async getActiveLeave(minecraftNickname: string) {
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

    async getPendingLeaves() {
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

    async getLeaveHistory(minecraftNickname: string) {
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

    async getLeavesHistory() {
        const db = BaseDatabase.get();

        return db.all(
            `
            SELECT *
            FROM leaves
            ORDER BY start_date DESC
            `
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

    async getLeaveById(leaveId: number) {
        const db = BaseDatabase.get();
        return db.get(`SELECT * FROM leaves WHERE id = ?`, leaveId);
    }
}
