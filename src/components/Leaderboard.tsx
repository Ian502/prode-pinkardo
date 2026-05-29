import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, User } from 'lucide-react';

interface FilaPosicion {
  user_id: string;
  usuario_email: string;
  partidos_apostados: number;
  puntos_totales: number;
}

export default function Leaderboard() {
  const [posiciones, setPosiciones] = useState<FilaPosicion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // Consumimos directamente la vista SQL que creamos
      const { data, error } = await supabase
        .from('tabla_posiciones')
        .select('*');

      if (error) throw error;
      setPosiciones(data || []);
    } catch (error) {
      console.error('Error cargando leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center text-slate-400 mt-10">Calculando puntajes...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Título */}
      <div className="border-b border-slate-700 pb-4 flex items-center space-x-2">
        <Trophy className="text-amber-500" size={24} />
        <div>
          <h2 className="text-xl font-bold text-white">Tabla de Posiciones</h2>
          <p className="text-slate-400 text-sm">El ranking en tiempo real de todo el grupo.</p>
        </div>
      </div>

      {posiciones.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
          Aún no hay puntos calculados. ¡Los puntos aparecerán cuando cargues resultados reales en los partidos!
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold border-b border-slate-700">
                <th className="py-3 px-4 text-center w-16">Pos</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4 text-center hidden sm:table-cell">Jugados</th>
                <th className="py-3 px-4 text-center w-24">Pts Totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-750">
              {posiciones.map((fila, index) => {
                const puesto = index + 1;
                
                // Estilos dinámicos para el podio
                let iconoPuesto = null;
                let estiloFila = "text-slate-300";
                
                if (puesto === 1) {
                  iconoPuesto = <Medal className="text-amber-450 text-amber-400 inline" size={18} />;
                  estiloFila = "bg-amber-500/5 font-bold text-amber-300";
                } else if (puesto === 2) {
                  iconoPuesto = <Medal className="text-slate-300 inline" size={18} />;
                  estiloFila = "bg-slate-300/5 font-semibold text-slate-200";
                } else if (puesto === 3) {
                  iconoPuesto = <Medal className="text-amber-700 inline" size={18} />;
                  estiloFila = "bg-amber-700/5 font-semibold text-amber-600";
                }

                return (
                  <tr key={fila.user_id} className={`hover:bg-slate-750/50 transition-colors ${estiloFila}`}>
                    {/* Número de posición */}
                    <td className="py-4 px-4 text-center font-bold text-sm">
                      {iconoPuesto ? <span className="flex justify-center">{iconoPuesto}</span> : puesto}
                    </td>
                    
                    {/* Nombre/Email del usuario */}
                    <td className="py-4 px-4 flex items-center space-x-2">
                      <div className="p-1.5 bg-slate-900 rounded-full text-slate-500 hidden sm:block">
                        <User size={14} />
                      </div>
                      <span className="truncate text-sm">
                        {fila.usuario_email.split('@')[0]} {/* Muestra solo el nombre antes del @ para cuidar privacidad */}
                      </span>
                    </td>

                    {/* Partidos Pronosticados */}
                    <td className="py-4 px-4 text-center text-slate-400 text-sm hidden sm:table-cell">
                      {fila.partidos_apostados}
                    </td>

                    {/* Puntos Totales */}
                    <td className="py-4 px-4 text-center font-black text-base text-white">
                      {fila.puntos_totales}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}