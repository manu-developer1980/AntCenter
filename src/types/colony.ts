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
}

export interface ColonyLog {
    id: string;
    colony_id: string;
    log_type: ColonyLogType;
    details: string;
    created_at: string;
}