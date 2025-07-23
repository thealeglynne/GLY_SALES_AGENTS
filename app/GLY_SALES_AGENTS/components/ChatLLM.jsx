'use client';

import ModalInicio from '../components/AnalisisProcesos';
import Perfil from '../components/perfil';

export default function ChatConConfiguracion() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white relative">
      <ModalInicio />

      {/* Perfil posicionado en la esquina superior derecha, 50px desde el top */}
      <div className="absolute top-[50px] right-6 z-50">
        <Perfil />
      </div>
    </div>
  );
}
