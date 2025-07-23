'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function PerfilUsuario() {
  const [userInfo, setUserInfo] = useState({
    nombre: '',
    avatarUrl: '',
    correo: '',
    rol: '',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error obteniendo usuario:', userError);
        setLoading(false);
        return;
      }

      const { email, user_metadata, id } = user;

      // Consulta a la tabla usuarios para obtener el rol
      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', id)
        .single();

      if (perfilError) {
        console.error('Error obteniendo perfil:', perfilError);
      }

      setUserInfo({
        nombre: user_metadata?.full_name || 'Usuario',
        avatarUrl: user_metadata?.avatar_url || '/default-avatar.png',
        correo: email,
        rol: perfil?.rol || 'No definido',
      });

      setLoading(false);
    };

    fetchUserInfo();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Cargando perfil...</div>;
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 shadow-sm bg-white">
      <img
        src={userInfo.avatarUrl}
        alt="Avatar"
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="text-sm">
        <p className="font-semibold text-gray-800">{userInfo.nombre}</p>
        <p className="text-gray-500 text-xs">{userInfo.correo}</p>
        <p className="text-gray-600 text-xs italic mt-1">Rol: {userInfo.rol}</p>
      </div>
    </div>
  );
}
