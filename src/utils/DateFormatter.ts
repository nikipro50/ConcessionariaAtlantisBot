export default class DateFormatter {
    static format(date: Date | string): string {
        const d = typeof date === "string" ? new Date(date) : date;

        return d.toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    static formatWithTime(date: Date | string): string {
        const d = typeof date === "string" ? new Date(date) : date;

        return d.toLocaleString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
}
