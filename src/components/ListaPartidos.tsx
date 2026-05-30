import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Partido, Prode } from '../types/prode';
import { Calendar, Save, CheckCircle } from 'lucide-react';

interface Props {
  userId: string;
}

export default function ListaPartidos({ userId }: Props) {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<string, Prode>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchPartidosYPredicciones();
  }, [userId]);

  const fetchPartidosYPredicciones = async () => {
    try {
      setLoading(true);

      // 1. Traer todos los partidos junto con la info de los equipos (Inner Joins)
      const { data: partidosData, error: errorPartidos } = await supabase
        .from('partidos')
        .select(`
          id, fase, equipo_a, equipo_b, goles_a, goles_b, fecha_limite,
          equipos_a:equipo_b (idc, nombre, bandera_url, grupo),
          equipos_b:equipo_a (idc, nombre, bandera_url, grupo)
        `)
        .order('fecha_limite', { ascending: true });

      if (errorPartidos) throw errorPartidos;

      // 2. Traer las predicciones existentes de este usuario específico
      const { data: predData, error: errorPred } = await supabase
        .from('prode')
        .select('partido_id, goles_a, goles_b')
        .eq('user_id', userId);

      if (errorPred) throw errorPred;

      // 3. Mapear predicciones a un formato de diccionario { [partido_id]: prediccion }
      const localPreds: Record<string, Prode> = {};
      predData?.forEach((p) => {
        localPreds[p.partido_id] = {
          partid_id: p.partido_id,
          goles_a: p.goles_a ?? '',
          goles_b: p.goles_b ?? '',
        } as unknown as Prode;
      });

      setPartidos(partidosData as unknown as Partido[]);
      setPredicciones(localPreds);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (partidoId: string, campo: 'local' | 'visita', valor: string) => {
    // Validar que solo entren números o vacío
    if (valor !== '' && !/^\d+$/.test(valor)) return;

    setPredicciones((prev) => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        partido_id: partidoId,
        [campo === 'local' ? 'goles_a' : 'goles_b']: valor === '' ? '' : parseInt(valor, 10),
      },
    }));
  };

  const guardarTodosLosPronosticos = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
    // Convertimos el objeto de predicciones en un arreglo para Supabase
    const payloads = Object.entries(predicciones)
      .filter(([partidoId, p]) => {
        // SOLUCIÓN 1: Solo guardamos si el partidoId es válido y el usuario llenó ambos casilleros
        return (
          partidoId && 
          partidoId !== 'undefined' && 
          partidoId !== 'null' &&
          p.goles_a !== '' && 
          p.goles_b !== ''
        );
      })
      .map(([partidoId, p]) => ({
        user_id: userId,
        partido_id: Number(partidoId), // 👈 Aseguramos que el ID venga de la clave del objeto y sea número
        goles_a: Number(p.goles_a),
        goles_b: Number(p.goles_b),
      }));

    if (payloads.length === 0) {
      setSaving(false);
      return;
    }

    // Enviamos a Supabase
    const { error } = await supabase
      .from('prode')
      .upsert(payloads, { onConflict: 'user_id,partido_id' });

    if (error) throw error;

    setSuccessMsg('¡Pronósticos guardados con éxito!');
    setTimeout(() => setSuccessMsg(''), 4000);
  } catch (e) {
    console.error('Error al guardar en Supabase:', e);
    alert('Hubo un error al guardar tus predicciones. Revisa la consola.');
  } finally {
    setSaving(false);
  }
};

  if (loading) return <div className="text-center text-slate-400 mt-10">Cargando partidos...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      
      {/* Botón Flotante para Guardar */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2">
        {successMsg && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl shadow-lg font-bold text-sm flex items-center space-x-2 animate-bounce">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}
        <button
          onClick={guardarTodosLosPronosticos}
          disabled={saving}
          className="bg-indigo-600 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2 cursor-pointer transition-transform active:scale-95"
        >
          <Save size={20} />
          <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {/* Título de la sección */}
      <div className="border-b border-slate-700 pb-4">
        <h2 className="text-xl font-bold text-white">Fase de Grupos</h2>
        <p className="text-slate-400 text-sm">Ingresa tus apuestas antes del pitazo inicial de cada partido.</p>
      </div>

      {/* Lista de Partidos */}
      <div className="space-y-4">
        {partidos.map((partido) => {
          const yaEmpezo = new Date() > new Date(partido.fecha_limite);
          const pred = predicciones[partido.id] || { goles_a: '', goles_b: '' };

          return (
            <div 
              key={partido.id} 
              className={`bg-slate-800 border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between transition-all ${
                yaEmpezo ? 'border-slate-700 opacity-75' : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              {/* Info de Fecha/Estado */}
              <div className="text-xs text-slate-400 flex items-center space-x-1.5 mb-3 md:mb-0">
                <Calendar size={14} className="text-emerald-400" />
                <span>
                  {new Date(partido.fecha_limite).toLocaleDateString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                {yaEmpezo && (
                  <span className="bg-slate-900 text-red-400 font-semibold px-2 py-0.5 rounded ml-2 border border-red-500/20">
                    Cerrado
                  </span>
                )}
              </div>

              {/* Contenedor del Cruce */}
              <div className="flex items-center justify-center space-x-4 flex-1 md:px-8">
                
                {/* Equipo Local */}
                <div className="flex items-center space-x-2 justify-end w-1/3">
                  <span className="text-sm font-semibold text-white text-right hidden sm:inline">
                    {partido.equipos_a?.nombre}
                  </span>
                  <span className="text-sm font-semibold text-white sm:hidden">
                    {partido.equipos_a?.nombre.substring(0, 3).toUpperCase()}
                  </span>
                  <img src={partido.equipos_a?.bandera_url} alt="Local" className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                </div>

                {/* Inputs de Goles */}
                <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-lg border border-slate-750">
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={yaEmpezo}
                    value={pred.goles_a}
                    onChange={(e) => handleInputChange(partido.id, 'local', e.target.value)}
                    className="w-10 h-10 bg-slate-800 border border-slate-700 rounded text-center text-lg font-bold text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-950"
                    placeholder="-"
                  />
                  <span className="text-slate-600 font-bold">x</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={yaEmpezo}
                    value={pred.goles_b}
                    onChange={(e) => handleInputChange(partido.id, 'visita', e.target.value)}
                    className="w-10 h-10 bg-slate-800 border border-slate-700 rounded text-center text-lg font-bold text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-950"
                    placeholder="-"
                  />
                </div>

                {/* Equipo Visitante */}
                <div className="flex items-center space-x-2 justify-start w-1/3">
                  <img src={partido.equipos_b?.bandera_url} alt="Visita" className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                  <span className="text-sm font-semibold text-white hidden sm:inline">
                    {partido.equipos_b?.nombre}
                  </span>
                  <span className="text-sm font-semibold text-white sm:hidden">
                    {partido.equipos_b?.nombre.substring(0, 3).toUpperCase()}
                  </span>
                </div>

              </div>

              {/* Resultado Real (Si ya se jugó) */}
              {partido.goles_a !== null && (
                <div className="mt-3 md:mt-0 text-center md:text-right md:w-24 border-t md:border-t-0 md:border-l border-slate-700 pt-2 md:pt-0">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Real</p>
                  <p className="text-sm font-black text-indigo-400">
                    {partido.goles_a} - {partido.goles_b}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}