import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Eye } from 'lucide-react';
import { ComparativaModal } from './ComparativaModal'; //

interface LeaderboardUser {
  user_id: string;
  email: string;
  puntos: number;
  aciertos_exactos: number;
  aciertos_resultado: number;
}

interface LeaderboardProps {
  currentUserId: string; // 
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId }) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para controlar el modal de comparación
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState('');

  useEffect(() => {
    const calcularTablaPosiciones = async () => {
      try {
        // 1. Traer partidos con resultados reales
        const { data: partidos } = await supabase.from('partidos').select('*');
        // 2. Traer todas las predicciones cargadas en el sistema
        const { data: predicciones } = await supabase.from('prode').select('*');
        // 3. Traer la lista de perfiles de usuarios (o deducirlos de las predicciones si usas auth puro)
        //const { data: profiles } = await supabase.from('prode').select('user_id'); 

        if (!partidos || !predicciones) {
          setLoading(false);
          return;
        }

        // Obtener usuarios únicos
        const usuariosUnicos = Array.from(new Set(predicciones.map(p => p.user_id)));

        // Calcular puntajes por usuario
        const ranking: LeaderboardUser[] = usuariosUnicos.map((uid) => {
          let puntos = 0;
          let exactos = 0;
          let resultados = 0;

          const misPreds = predicciones.filter(p => p.user_id === uid);

          misPreds.forEach(p => {
            const partido = partidos.find(part => part.id === p.partido_id);
            if (partido && partido.goles_a !== null && partido.goles_b !== null) {
              const realL = partido.goles_a;
              const realV = partido.goles_b;
              const predL = p.goles_a;
              const predV = p.goles_b;

              // REGLA: Acierto Exacto (Pleno) -> 3 puntos
              if (realL === predL && realV === predV) {
                puntos += 3;
                exactos++;
              } 
              // REGLA: Acierto de Ganador/Empate -> 1 punto
              else if (Math.sign(realL - realV) === Math.sign(predL - predV)) {
                puntos += 1;
                resultados++;
              }
            }
          });

          // Buscamos una referencia de mail ficticia o placeholder si usas auth puro desde cliente
          return {
            user_id: uid,
            email: uid.substring(0, 8) + "@torneo.com", // Puedes cambiarlo por el email real si tienes tabla de perfiles
            puntos,
            aciertos_exactos: exactos,
            aciertos_resultado: resultados
          };
        });

        // Ordenar de mayor a menor puntuación
        ranking.sort((a, b) => b.puntos - a.puntos || b.aciertos_exactos - a.aciertos_exactos);
        
        setUsers(ranking); 
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    calcularTablaPosiciones();
  }, []);

  const abrirComparador = (id: string, email: string) => {
    if (id === currentUserId) return; // No te puedes comparar contigo mismo
    setSelectedUserId(id);
    setSelectedUserEmail(email);
    setModalOpen(true);
  };

  if (loading) return <div className="text-center p-8 text-slate-400">Calculando la tabla general...</div>;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
      <div className="p-4 bg-slate-750 border-b border-slate-700 flex items-center space-x-2">
        <Trophy className="text-amber-500" size={20} />
        <h2 className="font-bold text-slate-100">Tabla de Posiciones</h2>
      </div>

      <div className="divide-y divide-slate-700/50">
        {users.map((u, index) => {
          const esMiUsuario = u.user_id === currentUserId;
          return (
            <div
              key={u.user_id}
              onClick={() => abrirComparador(u.user_id, u.email)}
              className={`p-4 flex items-center justify-between transition-colors ${
                esMiUsuario ? 'bg-slate-700/30' : 'hover:bg-slate-750 cursor-pointer'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-6 font-bold text-slate-400 text-center">{index + 1}</span>
                <span className={`font-medium ${esMiUsuario ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                  {u.email.split('@')[0]} {esMiUsuario && '(Tú)'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right text-xs text-slate-400 hidden sm:block">
                  <span>Plenos: {u.aciertos_exactos} | Int: {u.aciertos_resultado}</span>
                </div>
                <div className="bg-slate-900/60 px-3 py-1 rounded-lg font-black text-amber-500 border border-slate-700/50">
                  {u.puntos} pts
                </div>
                {!esMiUsuario && (
                  <Eye size={16} className="text-slate-500 hover:text-amber-500 transition-colors" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RENDERIZADO DEL MODAL */}
      <ComparativaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        targetUserId={selectedUserId}
        targetUserEmail={selectedUserEmail}
        currentUserId={currentUserId}
      />
    </div>
  );
};