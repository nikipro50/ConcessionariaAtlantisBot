import EmployeeRepository from "../database/repo/EmployeeRepository";

export const SECONDARY_ROLES: string[] = [
    "CTV",
    "FORMATORE",
];

export const ROLES_ORDER: string[] = [
    "DIRETTORE",
    "VICE_DIRETTORE",
    "AMMINISTRATORE_GENERALE",
	"CONTABILE",
    "CAPO_REPARTO",
    "RESPONSABILE",
    "VICE_RESPONSABILE",
    "VENDITORE_SENIOR",
    "VENDITORE",
	"VENDITORE_JUNIOR",
	"STAGISTA",

    "CTV",
    "FORMATORE",
];

export const ADMIN_ROLES = ["DIRETTORE", "VICE_DIRETTORE"];

export const ROLE_ICONS: Record<string, string> = {
	DIRETTORE: "👑 Direttore",
	VICE_DIRETTORE: "🧭 Vice Direttore",
	AMMINISTRATORE_GENERALE: "🏛️ Amministratore Generale",
	CONTABILE: "📊 Contabile",
	CAPO_REPARTO: "🛠️ Capo Reparto",
	RESPONSABILE: "📌 Responsabile",
	VICE_RESPONSABILE: "📎 Vice Responsabile",
	VENDITORE_SENIOR: "⭐️ Venditore Senior",
	VENDITORE: "💼 Venditore",
	VENDITORE_JUNIOR: "🆕 Venditore Junior",
	STAGISTA: "🎓 Stagista",
	
	CTV: "🚗 CTV – Centro Tecnico Veicoli",
	FORMATORE: "📚 Formatore"
}

export const hasAdminRole = async (userId: number): Promise<boolean> => {
    const database = new EmployeeRepository();

    if (userId === 889247008 || userId === 6851460784) return true;
    
    const role = (await database.getEmployeeByUser(String(userId))).main_role;
    if (!role) return false;

    return role ? ADMIN_ROLES.includes(role) : false;
}