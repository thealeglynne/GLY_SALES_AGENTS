'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import { getCurrentUser, subscribeToAuthState } from '../../lib/supabaseClient';
import GuardarAuditoria from './saveChat';
import ListaAuditorias from './ListaAuditorias';
import ModalInicio from './AnalisisProcesos';

export default function ChatConConfiguracion() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditContent, setAuditContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [exitPromptVisible, setExitPromptVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoginPopupVisible, setIsLoginPopupVisible] = useState(false);
  const [empresaInfo, setEmpresaInfo] = useState({ nombreEmpresa: '', rol: '' });
  const [tokenCount, setTokenCount] = useState(0);
  const [isTokenWarningOpen, setIsTokenWarningOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const isMobile = windowWidth < 640;
  const API_URL = 'https://gly-ai-brain.onrender.com';
  const REQUEST_TIMEOUT = 40000;
  const MAX_TOKENS = 120; // From /estado-tokens endpoint
  const TOKEN_WARNING_THRESHOLD = MAX_TOKENS * 0.7; // 84 tokens

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (!currentUser) setIsLoginPopupVisible(true);
    };
    fetchUser();

    const subscription = subscribeToAuthState((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setIsLoginPopupVisible(false);
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length === 0 && empresaInfo.nombreEmpresa && empresaInfo.rol) {
      const fetchInitialMessage = async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

          const response = await fetch(`${API_URL}/gpt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: 'iniciar conversación',
              rol: 'Auditor',
              temperatura: 0.7,
              estilo: 'Formal',
              config: {
                empresa: empresaInfo.nombreEmpresa || '',
                rolUsuario: empresaInfo.rol || '',
              },
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail || 'Unknown error'}`);
          }

          const data = await response.json();
          const respuesta = data.respuesta || data.message || 'No se pudo procesar la respuesta';
          setMessages([{ from: 'ia', text: respuesta }]);
          setTokenCount(prev => prev + 20); // Simulate IA response token usage
          checkTokenLimit();
        } catch (error) {
          const errorMsg = error.name === 'AbortError'
            ? 'La solicitud inicial tardó demasiado. Por favor, intenta recargar la página.'
            : `Error: ${error.message}`;
          setErrorMessage(errorMsg);
          setMessages([{ from: 'ia', text: `⚠️ ${errorMsg}` }]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchInitialMessage();
    }
  }, [empresaInfo]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (messages.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        setExitPromptVisible(true);
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [messages]);

  const checkTokenLimit = () => {
    if (tokenCount >= TOKEN_WARNING_THRESHOLD && !isTokenWarningOpen) {
      setIsTokenWarningOpen(true);
    }
  };

  const fetchTokenStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/estado-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      // Assuming the backend returns current token usage; adjust as needed
      // For now, we rely on local tokenCount
    } catch (error) {
      console.error('Error fetching token status:', error.message);
    }
  };

  const sendRequest = async (query) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const response = await fetch(`${API_URL}/gpt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        rol: 'Auditor',
        temperatura: 0.7,
        estilo: 'Formal',
        config: {
          empresa: empresaInfo.nombreEmpresa || '',
          rolUsuario: empresaInfo.rol || '',
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, detail: ${errorData.detail || 'Unknown error'}`);
    }
    return await response.json();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { from: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setErrorMessage('');
    setTokenCount(prev => prev + 10); // Simulate user message token usage
    checkTokenLimit();

    try {
      if (input.trim().toLowerCase() === 'generar auditoria') {
        await handleGenerateAudit();
        return;
      }
      const data = await sendRequest(input);
      const respuesta = data.respuesta || data.message || 'No se pudo procesar la respuesta';
      setMessages(prev => [...prev, { from: 'ia', text: respuesta }]);
      setTokenCount(prev => prev + 20); // Simulate IA response token usage
      checkTokenLimit();
      await fetchTokenStatus(); // Optionally fetch real token status
    } catch (error) {
      const errorMsg = error.name === 'AbortError'
        ? 'La solicitud tardó demasiado.'
        : `Error: ${error.message}`;
      setErrorMessage(errorMsg);
      setMessages(prev => [...prev, { from: 'ia', text: `⚠️ ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAudit = async () => {
    setIsLoading(true);
    try {
      const data = await sendRequest('generar auditoria');
      if (data.propuesta) {
        setAuditContent(data.propuesta);
        setIsModalOpen(true);
        setMessages(prev => [...prev, { from: 'ia', text: data.respuesta }]);
        setTokenCount(prev => prev + 20); // Simulate IA response token usage
        checkTokenLimit();
      } else {
        setMessages(prev => [...prev, { from: 'ia', text: '⚠️ No se pudo generar la auditoría.' }]);
      }
    } catch (error) {
      const errorMsg = error.name === 'AbortError'
        ? 'La solicitud tardó demasiado.'
        : `Error: ${error.message}`;
      setErrorMessage(errorMsg);
      setMessages(prev => [...prev, { from: 'ia', text: `⚠️ ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAuditCommand = () => {
    setInput('generar auditoria');
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
     <H1>HOLAAAAA </H1>
   
    </div>
  );
}