import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(`Error: ${error.message}`);
      else setMessage('¡Registro exitoso! Ya puedes iniciar sesión.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-full mb-3 text-slate-900">
            <Trophy size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">PRODE MUNDIAL</h1>
          <p className="text-slate-400 text-sm mt-1">Menos de 100 amigos, un solo ganador.</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors" 
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors" 
                placeholder="••••••••"
              />
            </div>
          </div>

          {message && (
            <p className={`text-sm text-center font-medium ${message.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
              {message}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Procesando...' : isRegistering ? 'Crear Cuenta' : 'Ingresar'}
          </button>
        </form>

        {/* Selector de modo */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setMessage(''); }}
            className="text-indigo-400 hover:underline text-sm font-medium"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>

      </div>
    </div>
  );
}