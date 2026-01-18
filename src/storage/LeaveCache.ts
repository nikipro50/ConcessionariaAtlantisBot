import EmployeeRepository from "../database/repo/EmployeeRepository";

const leaves: Map<number, string> = new Map<number, string>();

// nickname;datainizio;datafine
export const addLeave = async (id: number, startDate: string, endDate: string) => {
    removeLeave(id);

    leaves.set(id, `${(await new EmployeeRepository().getEmployeeByUser(String(id))).minecraft_nickname};${startDate};${endDate}`)
}

export const removeLeave = (id: number) => leaves.delete(id);

export const getLeave = (id: number): { nickname: string, startDate: string, endDate: string } | null => {
    if (!leaves.has(id)) return null;

    const leave = leaves.get(id)?.split(";");
    if (!leave) return null;

    return { nickname: leave[0], startDate: leave[1], endDate: leave[2] };
} 
