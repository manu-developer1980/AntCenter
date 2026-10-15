import { useState, useEffect } from 'react'
import { supabase } from "../../lib/supabase"
import type { Colony, Food } from '../../types/colony'

import ColonyCard from './ColonyCard'

export default function Colonies() {

    const [colonies, setColonies] = useState<Colony[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [foods, setFoods] = useState<Food[]>([]);

    async function fetchColonies() {
            try {
                const { data, error } = await supabase.from('ants_colonies_view').select('*');

                if (error) {
                    console.error("Error al traer colonias", error);
                    setErrorMsg(error.message);
                } else {
                    console.log("Datos recibidos de Supabase", data)
                    setColonies(data);
                }
            } catch (error) {
                console.log("Ha fallado algo.", error);
                setErrorMsg(error);
            } finally {
                setLoading(false);
            }
        }

        async function fetchFoods() {
            try {
                const { data, error } = await supabase.from('ants_foods').select('*');

                if (error) {
                    console.error("Error al traer los tipos de comida", error);
                    setErrorMsg(error.message);
                } else {
                    console.log("Datos recibidos de Supabase", data)
                    setFoods(data);
                }
            } catch (error) {
                console.log("Ha fallado algo.", error);
                setErrorMsg(error);
            } finally {
                setLoading(false);
            }
        }
    async function handleFeed(colonyId: string, food:Food, amount:number) {

        try {
            const { error } = await supabase
                .from('ants_colony_logs')
                .insert([
                    {
                        colony_id: colonyId,
                        food_id: food.id,
                        log_type: 'feeding',
                        details: `${food.name} (${amount}) ${food.unit}`,
                        amount: amount,
                        unit: food.unit
                    }
                ]);

                if(error){
                    console.log("Error al registrar alimantos: ",error);
                    setErrorMsg(error.message);
                }else{
                    const datos = {
                        colony_id: colonyId,
                        food_id: food.id,
                        log_type: 'feeding',
                        details: `${food.name} (${amount}) ${food.unit}`,
                        amount: amount,
                        unit: food.unit
                    }
                    console.log("Datos insertados correctamente: ", datos)
                    fetchColonies();
                }

        } catch (error) {
            console.log("Algo ha fallado: ",error);
            setErrorMsg(error);
        } finally {
            
        }
    }
    
    useEffect(() => {
        fetchColonies();
        fetchFoods();
    }, [])

    if (loading) {
        return (
            <div className="p-4 text-gray-500 animate-pulse">
                Cargando colonias...
            </div>
        )
    }

    if (errorMsg) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <p className="font-semibold">Ha ocurrido un error:</p>
                <p className="text-sm">{errorMsg}</p>
            </div>)
    }

    if (colonies.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 border-2 border-dashed rounder-lg">
                <p className="text-lg font-medium"> No hay colonias registradas</p>
                <p className="text-sm text-gray-400">¡Pronto podrás añadir tu colonia desde aqui!</p>
            </div>
        )
    }

    return <>
        <h1 className="p-4 text-2xl font-bold">Colonias</h1>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {colonies.map((colony) => (
                <ColonyCard key={colony.id} colony={colony} onFeed={handleFeed} foods={foods} />
            ))}
        </div>
    </>

}