import { useState, useEffect } from 'react'
import { supabase } from "../../lib/supabase"
import type { Colony } from '../../types/colony'
import ColonyCard from './ColonyCard'

export default function Colonies() {

    const [colonies, setColonies] = useState<Colony[]>([]);

    useEffect(() => {
        async function fetchColonies() {
            const { data, error } = await supabase.from('ants_colonies').select('*');

            if (error) {
                console.error("Error al traer colonias", error);
            } else {
                console.log("Datos recibidos de Supabase", data)
                setColonies(data);
            }
        }
        fetchColonies();
    }, [])
    return <>
        <h1 className="p-4 text-2xl font-bold">Colonias</h1>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {colonies.map((colony) => (
                <ColonyCard colony={colony} key={colony.id} />
            ))}
        </div>
    </>
}