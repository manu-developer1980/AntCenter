import type { Colony } from '../../types/colony'
interface ColonyCardProps {
    colony: Colony;
}

export default function ColonyCard({ colony }: ColonyCardProps) {


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
        </div>
    );
}
