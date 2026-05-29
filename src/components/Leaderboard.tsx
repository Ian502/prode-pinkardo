import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, User } from 'lucide-react';
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
        // ... (Tu lógica actual para traer partidos, predicciones y calcular puntos permanece exactamente igual) ...
        // [Mantén el algoritmo de cálculo de puntos intacto aquí]
        
        // Supongamos que tu variable de resultado final se llama 'ranking'
        // setUsers(ranking);
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