export type ColonyStatus = 'active' | 'inactive' | 'deceased';
export type ColonyLogType = 'feeding' | 'count_update' | 'event' | 'note'

export interface Colony {
    id: string;
    name: string;
    queen_name: string;
    species: string;
    foundation_date: string;
    worker_count: number;
    nest_type?: string;
    status: ColonyStatus;
    notes?: string;
    created_at: string;
    last_fed_at?:string|null;
    last_food_icon?:string|null;
    last_food_name?:string|null
}

export interface ColonyLog {
    id: string;
    colony_id: string;
    log_type: ColonyLogType;
    details: string;
    amount?: number;
    unit?: string;
    created_at: string;
}

export interface Food {
    id: string;
    name: string;
    unit: string;
    icon?: string;
}

export const FOOD_OPTIONS = ['🪱 Tenebrio', '🍯 Agua-miel', '🌾 Semillas', '🍗 Pavo'] as const;