export default class DateParser {
    static parse(input: string): Date | null {
        input = input.trim();

        let day: number, month: number, year: number;

        const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
        const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

        let match: RegExpExecArray | null;
        if ((match = dmy.exec(input))) {
            day = Number(match[1]);
            month = Number(match[2]);
            year = Number(match[3]);
        } else if ((match = ymd.exec(input))) {
            year = Number(match[1]);
            month = Number(match[2]);
            day = Number(match[3]);
        } else {
            return null;
        }

        const date = new Date(year, month - 1, day);
        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) return null;

        return date;
    }

    static isPast(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date < today;
    }
}