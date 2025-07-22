'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import { getCurrentUser, subscribeToAuthState } from '../../lib/supabaseClient';
import GuardarAuditoria from './saveChat';
import ListaAuditorias from './ListaAuditorias';
import ModalInicio from './AnalisisProcesos';

export default function ChatConConfiguracion() {


  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
 


    </div>
  );
}