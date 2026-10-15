import type { Colony, Food } from '../../types/colony'
import getFeedingBadge from '../../utils/utilityFunctions'
import {useState} from 'react'  

interface ColonyCardProps {
    colony: Colony;
    onFeed?: (colonyId: string, food:Food, amount:number) => void;
    foods?: Food[];
}

export default function ColonyCard({ colony, onFeed, foods=[] }: ColonyCardProps) {

    const [amount, setAmount] = useState<number>(1);
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);

    const alimento = getFeedingBadge(colony.last_fed_at, colony.last_food_icon);

    return (

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900">
                    {colony.name}
                </h2>
                <p className="text-sm italic text-gray-500">
                    {colony.species}
                </p>
                <h2 className="text-lg font-semibold text-gray-900">
                    Reina:
                </h2>
                <p className="text-sm italic text-gray-500">
                    {colony.queen_name}
                </p>
                <div className="mt-4 flex justify-between items-center text-sm">
                    <span>Obreras: <strong>{colony.worker_count}</strong></span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs uppercase font-bold">
                        {colony.status}
                    </span>
                </div>
                <div className="mt-4 flex justify-between items-center text-sm">
                    <span>Último alimento: <span className={alimento.classes}>{alimento.badge}</span>
                    </span>
                </div>
                <div className="flex flex-wrap justify-end gap-1 mt-5">
                    {foods?.map((food) => (
                        <button
                            key={food.id}
                            type="button" onClick={() => {
                                setSelectedFood(food);
                                setAmount(1);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded whitespace-nowrap">{food.icon} {food.name}</button>

                    ))}
                </div>
                {selectedFood && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 text-gray-800">
                    {/* 1. Título y Alimento */}
                    <h3 className="font-bold text-lg">Alimentar a {colony.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Suministrar {selectedFood.icon} {selectedFood.name}
                    </p>

                    {/* 2. Stepper: [-] [ Input ] [+] y la Unidad */}
                    <div className="flex items-center justify-center gap-3 my-4">
                        <button
                            type="button"
                            onClick={() => setAmount(prev => Math.max(1, prev - 1))}
                            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-xl font-bold flex items-center justify-center"
                        >
                            -
                        </button>

                        <input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                            className="w-20 text-center font-bold text-xl border rounded-lg p-2"
                        />

                        <button
                            type="button"
                            onClick={() => setAmount(prev => prev + 1)}
                            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-xl font-bold flex items-center justify-center"
                        >
                            +
                        </button>

                        <span className="font-semibold text-gray-600 text-sm">
                            {selectedFood.unit}
                        </span>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={() => setSelectedFood(null)}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onFeed(colony.id, selectedFood,amount);
                                console.log(`Alimentando ${amount} ${selectedFood.unit} de ${selectedFood.name}`);
                                setSelectedFood(null);
                            }}
                            className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}
