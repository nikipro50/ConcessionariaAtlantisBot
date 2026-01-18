import sqlite3 from "sqlite3";
import { open, Database as SQLiteDB } from "sqlite";
import path from 'path';
import fs from 'fs';

export default class BaseDatabase {
    private static instance: SQLiteDB<sqlite3.Database, sqlite3.Statement>;

    static async init(): Promise<void> {
        if (this.instance) return;

        const dir = path.dirname(path.resolve('./resources/company.db'));
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        this.instance = await open({
            filename: path.resolve('./resources/company.db'),
            driver: sqlite3.Database
        });

        await this.instance.exec(`
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                minecraft_nickname TEXT UNIQUE NOT NULL,
                telegram_id TEXT NOT NULL,
                lore_first_name TEXT NOT NULL,
                lore_last_name TEXT NOT NULL,
                main_role TEXT NOT NULL,
                secondary_roles TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS leaves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                minecraft_nickname TEXT NOT NULL,
                status TEXT CHECK(status IN ('PENDING','ACTIVE','FINISHED')) NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT,
                FOREIGN KEY (minecraft_nickname)
                    REFERENCES employees(minecraft_nickname)
                    ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS preorders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_nickname TEXT NOT NULL,
                client_nickname TEXT NOT NULL,
                vehicle TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED
                created_at TEXT NOT NULL
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_active_leave
            ON leaves(minecraft_nickname)
            WHERE status = 'ACTIVE';
        `);
    }

    static get(): SQLiteDB<sqlite3.Database, sqlite3.Statement> {
        if (!this.instance) throw new Error("Database not initalized.");

        return this.instance;
    }
}