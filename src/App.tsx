import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import Login from './pages/login';
import { LogOut, LayoutDashboard } from 'lucide-react';
import ListaPartidos from './components/ListaPartidos';

export default function App() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Revisar sesión actual al cargar
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSessionUser(user);
      setLoading(false);
    });

    // 2. Escuchar cambios en el estado de autenticación (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center text-white">
        Cargando prode...
      </div>
    );
  }

  // Si no está logueado, forzar pantalla de Login
  if (!sessionUser) {
    return <Login />;
  }

  // Si está logueado, mostrar el Dashboard del Prode
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navbar Simple */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-amber-500 font-bold text-lg">
          <LayoutDashboard size={20} />
          <span>Mi Prode</span>
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

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 mt-6">
        {/* Render de la Tabla de partidos pasando el ID del usuario logueado */}
        <ListaPartidos userId={sessionUser.id} />
      </main>
    </div>
  );
}