import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import Login from './pages/login';
import ListaPartidos from './components/ListaPartidos';
import { Leaderboard } from './components/Leaderboard'; 
import { LogOut, LayoutDashboard, Calendar, Trophy } from 'lucide-react';


export default function App() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState<'partidos' | 'posiciones'>('partidos'); // Estado del Tab

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSessionUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-900 flex justify-center items-center text-white">Cargando...</div>;
  if (!sessionUser) return <Login />;

  // Si está logueado, mostrar el Dashboard del Prode
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-amber-500 font-bold text-lg">
          <LayoutDashboard size={20} />
          <span>Prode Pinkardo</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-400 text-sm hidden sm:inline">{sessionUser.email}</span>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="flex items-center space-x-1 text-sm bg-slate-750 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </nav>

 {/* Selector de Pestañas (Tabs) */}
      <div className="max-w-2xl mx-auto mt-6 px-4 flex space-x-2">
        <button
          onClick={() => setTabActiva('partidos')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
            tabActiva === 'partidos' 
              ? 'bg-amber-500 text-slate-950 font-bold' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
          }`}
        >
          <Calendar size={18} />
          <span>Mis Pronósticos</span>
        </button>
        <button
          onClick={() => setTabActiva('posiciones')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
            tabActiva === 'posiciones' 
              ? 'bg-amber-500 text-slate-950 font-bold' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
          }`}
        >
          <Trophy size={18} />
          <span>Posiciones</span>
        </button>
      </div>

      {/* Contenido Principal Dinámico */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 mt-2">
        {tabActiva === 'partidos' ? (
		  <ListaPartidos userId={sessionUser.id} />
		) : (
		  <Leaderboard currentUserId={sessionUser.id} />
		)}
      </main>
    </div>
  );
}