import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react'; // cleaned

interface ComparativaModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserEmail: string;
  currentUserId: string;
}

interface PrediccionCompleta {
  partido_id: number;
  local: string;
  visita: string;
  bandera_local: string;
  bandera_visita: string;
  goles_real_local: number | null;
  goles_real_visita: number | null;
  fecha_limite: string;
  goles_yo_local?: number;
  goles_yo_visita?: number;
  goles_otro_local?: number;
  goles_otro_visita?: number;
}

export const ComparativaModal: React.FC<ComparativaModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserEmail,
  currentUserId,
}) => {
  const [loading, setLoading] = useState(true);
  const [partidosComparados, setPartidosComparados] = useState<PrediccionCompleta[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const cargarComparativa = async () => {
      setLoading(true);
      try {
        const { data: partidosData, error: pError } = await supabase
          .from('partidos')
          .select(`
            id, goles_a, goles_b, fecha_limite,
            local:equipos_a(nombre, bandera_url),
            visita:equipos_b(nombre, bandera_url)
          `)
          .order('fecha_limite', { ascending: true });

        if (pError) throw pError;

        const { data: predsData, error: predError } = await supabase
          .from('prode')
          .select('*')
          .in('user_id', [currentUserId, targetUserId]);

        if (predError) throw predError;

        const ahora = new Date();

        const mapeo = (partidosData as any[]).map((partido) => {
          // Tipamos explícitamente el parámetro 'p' para evitar el error TS7006 de 'any' implícito
          const miPred = predsData?.find((p: { partido_id: number; user_id: string }) => p.partido_id === partido.id && p.user_id === currentUserId);
          const otroPred = predsData?.find((p: { partido_id: number; user_id: string }) => p.partido_id === partido.id && p.user_id === targetUserId);
          
          const partidoEmpezado = new Date(partido.fecha_limite) <= ahora;

          return {
            partido_id: partido.id,
            local: partido.local.nombre,
            visita: partido.visita.nombre,
            bandera_local: partido.local.bandera_url,
            bandera_visita: partido.visita.bandera_url,
            goles_real_local: partido.goles_a,
            goles_real_visita: partido.goles_b,
            fecha_limite: partido.fecha_limite,
            goles_yo_local: miPred?.goles_a,
            goles_yo_visita: miPred?.goles_b,
            goles_otro_local: partidoEmpezado ? otroPred?.goles_a : undefined,
            goles_otro_visita: partidoEmpezado ? otroPred?.goles_b : undefined,
          };
        });

        setPartidosComparados(mapeo);
      } catch (err) {
        console.error("Error cargando la comparativa:", err);
      } finally {
        setLoading(false);
      }
    };

    cargarComparativa();
  }, [isOpen, targetUserId, currentUserId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-850 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-emerald-400 text-lg">Comparando Pronósticos</h3>
            <p className="text-xs text-slate-400">Viendo las cartas de: <span className="text-slate-200 font-medium">{targetUserEmail.split('@')[0]}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-900/50">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm animate-pulse">Analizando las jugadas...</div>
          ) : (
            partidosComparados.map((p) => {
              const empezo = new Date(p.fecha_limite) <= new Date();
              
              return (
                <div key={p.partido_id} className="bg-slate-800 border border-slate-700/60 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
                  
                  <div className="flex items-center space-x-3 w-full sm:w-2/5 justify-center sm:justify-start">
                    <div className="flex flex-col text-right items-end w-20">
                      <span className="text-xs font-semibold truncate max-w-[80px]">{p.local}</span>
                    </div>
                    <img src={p.bandera_local} alt={p.local} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                    <span className="text-xs text-slate-500 font-bold">VS</span>
                    <img src={p.bandera_visita} alt={p.visita} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                    <div className="flex flex-col text-left items-start w-20">
                      <span className="text-xs font-semibold truncate max-w-[80px]">{p.visita}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 bg-slate-850/60 px-4 py-2 rounded-xl border border-slate-700/40 w-full sm:w-auto justify-center">
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-medium">Tú</span>
                      <span className="text-sm font-bold text-slate-100">
                        {p.goles_yo_local !== undefined ? `${p.goles_yo_local} - ${p.goles_yo_visita}` : '-'}
                      </span>
                    </div>

                    <div className="text-center px-2 border-x border-slate-700">
                      <span className="block text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Real</span>
                      <span className="text-sm font-black text-emerald-400">
                        {p.goles_real_local !== null ? `${p.goles_real_local} - ${p.goles_real_visita}` : '⏳'}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-medium">Rival</span>
                      <span className="text-sm font-bold text-slate-100">
                        {!empezo ? (
                          <span className="text-slate-500 text-xs flex items-center gap-1" title="Oculto hasta que empiece el partido">
                            🔒
                          </span>
                        ) : p.goles_otro_local !== undefined ? (
                          `${p.goles_otro_local} - ${p.goles_otro_visita}`
                        ) : (
                          '-'
                        )}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};