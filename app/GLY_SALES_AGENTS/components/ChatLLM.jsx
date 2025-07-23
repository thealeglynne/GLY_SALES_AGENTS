'use client';

import ModalInicio from '../components/AnalisisProcesos';
import Perfil from "../components/perfil"

export default function ChatConConfiguracion() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
      <ModalInicio />
      <Perfil />
    </div>
  );
}
