import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Eye, Medal } from 'lucide-react';
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
        const { data: profiles } = await supabase.from('perfiles').select('*')

        if (!partidos || !profiles) {
          setUsers([]);
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

          // Filtramos las predicciones que pertenecen a este perfil en particular
          const misPreds = predicciones ? predicciones.filter(p => p.user_id === perfil.id) : [];
		  
		  misPreds.forEach(p => {
            const partido = partidos.find(part => part.id === p.partido_id);
            if (partido && partido.goles_a !== null && partido.goles_b !== null) {
              const realL = partido.goles_a;
              const realV = partido.goles_b;
              const predL = p.prediccion_a;
              const predV = p.prediccion_b;

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
            email: perfil.username, // Puedes cambiarlo por el email real si tienes tabla de perfiles
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
    if (id === currentUserId) return;
    setSelectedUserId(id);
    setSelectedUserEmail(email);
    setModalOpen(true);
  };

  const renderMedallaOPosicion = (index: number) => {
    if (index === 0) return <Medal className="text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]" size={22} />; 
    if (index === 1) return <Medal className="text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.3)]" size={22} />;    
    if (index === 2) return <Medal className="text-indigo-400" size={22} />;                                         
    return <span className="w-6 font-bold text-slate-500 text-center text-sm">{index + 1}</span>;
  };

  if (loading) return <div className="text-center p-8 text-slate-400 animate-pulse">Calculando la tabla general...</div>;

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto backdrop-blur-md">
      <div className="p-4 bg-slate-800/50 border-b border-slate-700/60 flex items-center space-x-2">
        <Trophy className="text-indigo-400" size={22} />
        <h2 className="font-bold text-slate-100 text-base">Tabla de Posiciones</h2>
      </div>

      <div className="divide-y divide-slate-800">
        {users.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No hay perfiles registrados todavía.</div>
        ) : (
          users.map((u, index) => {
            const esMiUsuario = u.user_id === currentUserId;
            return (
              <div
                key={u.user_id}
                onClick={() => abrirComparador(u.user_id, u.email)}
                className={`p-4 flex items-center justify-between transition-all duration-200 ${
                  esMiUsuario ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : 'hover:bg-slate-800/40 cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 flex justify-center items-center">
                    {renderMedallaOPosicion(index)}
                  </div>
                  {/* Se muestra el apodo directamente sin necesidad de usar split('@') */}
                  <span className={`font-medium text-sm ${esMiUsuario ? 'text-indigo-300 font-bold' : 'text-slate-200'}`}>
                    {u.email} {esMiUsuario && '(Tú)'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right text-[11px] text-slate-400 hidden sm:block">
                    <span>Plenos: {u.aciertos_exactos} | Int: {u.aciertos_resultado}</span>
                  </div>
                  <div className="bg-emerald-950/40 px-3 py-1 rounded-lg font-black text-sm text-emerald-400 border border-emerald-500/30">
                    {u.puntos} pts
                  </div>
                  <div className="w-6 flex justify-center">
                    {!esMiUsuario ? (
                      <Eye size={18} className="text-slate-500 hover:text-emerald-400 transition-colors" />
                    ) : (
                      <div className="w-4.5" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

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