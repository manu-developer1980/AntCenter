export default function getFeedingBadge(lastFedAt?:string | null, icon?:string|null){
    if(!lastFedAt){
        return {
            badge:'Sin alimentar',
            classes: 'bg-gray-100 text-gray-600 border border-gray-200 p-2'
        }
    }

    const diffHours = (Date.now() - new Date(lastFedAt).getTime()) / (1000*60*60);
    const diffDays = Math.floor(diffHours / 24);

    let timeText = '';
    if(diffHours < 24){
        timeText='Hoy';
    }else if (diffDays === 1){
        timeText = 'Ayer';
    }else {
        timeText=`Hace ${diffDays} dias`;
    }

    const label = `${icon || "🍽️"} ${timeText}`;

    if (diffDays < 3) {
    return { badge: label, classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200 p-1 rounded-2xl' };
    } else if (diffDays <= 6) {
        return { badge: label, classes: 'bg-amber-50 text-amber-700 border border-amber-200 p-1 rounded-2xl' };
    } else {
        return { badge: label, classes: 'bg-rose-50 text-rose-700 border border-rose-200 p-1 rounded-2xl' };
    }
}