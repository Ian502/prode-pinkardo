import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import Login from './pages/login';
import ListaPartidos from './components/ListaPartidos';
import { Leaderboard } from './components/Leaderboard';
import { RegistroNombre } from './components/RegistroNombre'; // Importar el componente 
import { LogOut, LayoutDashboard, Calendar, Trophy } from 'lucide-react';


export default function App() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [tabActiva, setTabActiva] = useState<'partidos' | 'posiciones'>('partidos'); // Estado del Tab
  const [miApodo, setMiApodo] = useState<string | null>(null);
  const [verificandoNombre, setVerificandoNombre] = useState(true);
  const [loading, setLoading] = useState(true);

// 2. Tu useEffect principal debe controlar la sesión y el apodo de forma secuencial:
useEffect(() => {
  const inicializarApp = async () => {
    try {
      // Obtener sesión actual de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setSessionUser(session.user);
        
        // Ir a buscar el apodo inmediatamente si hay usuario logueado
        const { data, error } = await supabase
          .from('prode')
          .select('username')
          .eq('user_id', session.user.id)
          .not('username', 'is', null)
          .maybeSingle(); // Evita errores si devuelve vacío o múltiples registros

        if (data && data.username) {
          setMiApodo(data.username);
        }
      }
    } catch (err) {
      console.error("Error al inicializar la sesión o el perfil:", err);
    } finally {
      // Apagamos los loaders en orden
      setLoading(false);
      setVerificandoNombre(false);
    }
  };

  inicializarApp();

  // Escuchar cambios de estado de autenticación (Login/Logout)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      setSessionUser(session.user);
      // Si el usuario cambia o se loguea, buscamos su nombre
      const { data } = await supabase
        .from('predicciones')
        .select('username')
        .eq('user_id', session.user.id)
        .not('username', 'is', null)
        .maybeSingle();
      
      if (data && data.username) {
        setMiApodo(data.username);
      }
    } else {
      setSessionUser(null);
      setMiApodo(null);
    }
    setLoading(false);
    setVerificandoNombre(false);
  });

  return () => subscription.unsubscribe();
}, []);

// ==========================================
// 3. SECCIÓN DE GUARDAS (Evitan la pantalla blanca)
// ==========================================

// GESTIÓN DE CARGA: Si Supabase no respondió sobre la sesión, esperamos.
if (loading || verificandoNombre) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-medium text-sm animate-pulse">
      Iniciando entorno seguro...
    </div>
  );
}

// SI NO HAY USUARIO: Renderiza tu pantalla de Login/Registro habitual
if (!sessionUser) {
  return <Login/>; // 👈 Reemplázalo por el nombre de tu componente de Login
}

// SI HAY USUARIO PERO NO TIENE APODO: Forzar el formulario de registro de nombre
if (!miApodo) {
  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <RegistroNombre 
        userId={sessionUser.id} 
        onNombreGuardado={(nombre) => setMiApodo(nombre)} 
      />
    </div>
  );
}
 

  // Si está logueado, mostrar el Dashboard del Prode
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-lg">
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
              ? 'bg-indigo-600 text-slate-950 font-bold' 
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
              ? 'bg-indigo-600 text-slate-950 font-bold' 
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