import BaseDatabase from "../Database";

export default class EmployeeRepository {
    async createEmployee(data: {
        minecraftNickname: string;
        telegramId: string;
        loreFirstName: string;
        loreLastName: string;
        mainRole: string;
        secondaryRoles?: string[];
    }): Promise<void> {
        const db = BaseDatabase.get();

        await db.run(
            `
      INSERT INTO employees (
        minecraft_nickname,
        telegram_id,
        lore_first_name,
        lore_last_name,
        main_role,
        secondary_roles,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            data.minecraftNickname,
            data.telegramId,
            data.loreFirstName,
            data.loreLastName,
            data.mainRole,
            data.secondaryRoles?.join(",") ?? null,
            new Date().toISOString()
        );
    }

    async getEmployeeByUser(userId: string): Promise<{ minecraft_nickname: string, telegram_id: string, lore_first_name: string, lore_last_name: string, main_role: string, secondary_roles?: string }> {
        const db = BaseDatabase.get();
        return await db.get(
            `SELECT * FROM employees WHERE telegram_id = ?`,
            userId
        ) as { minecraft_nickname: string, telegram_id: string, lore_first_name: string, lore_last_name: string, main_role: string, secondary_roles?: string };
    }


    async getEmployeeByNickname(nickname: string): Promise<{ minecraft_nickname: string, telegram_id: string, lore_first_name: string, lore_last_name: string, main_role: string, secondary_roles?: string }> {
        const db = BaseDatabase.get();
        return await db.get(
            `SELECT * FROM employees WHERE minecraft_nickname = ?`,
            nickname
        ) as { minecraft_nickname: string, telegram_id: string, lore_first_name: string, lore_last_name: string, main_role: string, secondary_roles?: string };
    }

    async isEmployee(minecraftNickname: string): Promise<boolean> {
        const db = BaseDatabase.get();

        const row = await db.get(
            `SELECT 1 FROM employees WHERE minecraft_nickname = ? LIMIT 1`,
            minecraftNickname
        );

        return !!row;
    }

    async isEmployeeFromId(id: string): Promise<boolean> {
        const db = BaseDatabase.get();

        const row = await db.get(
            `SELECT 1 FROM employees WHERE telegram_id = ? LIMIT 1`,
            id
        );

        return !!row;
    }

    async getAllEmployees() {
        const db = BaseDatabase.get();
        return await db.all(`SELECT * FROM employees`);
    }
}