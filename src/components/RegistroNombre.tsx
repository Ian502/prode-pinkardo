import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserCheck } from 'lucide-react';

interface RegistroNombreProps {
  userId: string;
  onNombreGuardado: (nuevoNombre: string) => void;
}

export const RegistroNombre: React.FC<RegistroNombreProps> = ({ userId, onNombreGuardado }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const guardarNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Guardamos o actualizamos el username en la base de datos
      const { error: dbError } = await supabase
        .from('predicciones')
        .upsert({ user_id: userId, username: username.trim() }, { onConflict: 'user_id' });

      if (dbError) throw dbError;

      onNombreGuardado(username.trim());
    } catch (err: any) {
      setError('Error al guardar el nombre. Intenta con otro.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-amber-500/10 text-amber-500 rounded-full mb-3">
          <UserCheck size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-100">¡Configura tu apodo!</h2>
        <p className="text-sm text-slate-400 mt-1">Elige el nombre con el que aparecerás en la Tabla de Posiciones ante tus amigos.</p>
      </div>

      <form onSubmit={guardarNombre} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Nombre de Usuario / Apodo</label>
          <input
            type="text"
            placeholder="Ej: El_Diez_2026"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '_'))} // Reemplaza espacios por guiones bajos
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            maxLength={15}
          />
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Guardando...' : 'Comenzar a Jugar'}
        </button>
      </form>
    </div>
  );
};