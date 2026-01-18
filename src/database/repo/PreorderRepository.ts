import BaseDatabase from "../Database";

export default class PreorderRepository {

    async createPreorder(employee: string, client: string, vehicle: string): Promise<number> {
        const db = BaseDatabase.get();
        const result = await db.run(
            `INSERT INTO preorders (employee_nickname, client_nickname, vehicle, created_at)
             VALUES (?, ?, ?, ?)`,
            employee, client, vehicle, new Date().toISOString()
        );
        return result.lastID!;
    }

    async getPendingPreorders() {
        const db = BaseDatabase.get();
        return db.all(`SELECT * FROM preorders WHERE status = 'PENDING' ORDER BY created_at ASC`);
    }

    async getPreorderById(id: number) {
        const db = BaseDatabase.get();
        return db.get(`SELECT * FROM preorders WHERE id = ?`, id);
    }

    async confirmPreorder(id: number) {
        const db = BaseDatabase.get();
        await db.run(`UPDATE preorders SET status = 'CONFIRMED' WHERE id = ?`, id);
    }

    async cancelPreorder(id: number) {
        const db = BaseDatabase.get();
        await db.run(`UPDATE preorders SET status = 'CANCELLED' WHERE id = ?`, id);
    }

    async getPreordersByEmployee(employee: string) {
        const db = BaseDatabase.get();
        return db.all(`SELECT * FROM preorders WHERE employee_nickname = ? ORDER BY created_at DESC`, employee);
    }
}
