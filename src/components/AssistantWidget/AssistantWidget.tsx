'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, X, Send, Sparkles, ExternalLink } from 'lucide-react';
import { AssistantResponse, AssistantQuickAction } from '@/lib/assistant/types';
import styles from './AssistantWidget.module.css';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  quickActions?: AssistantQuickAction[];
}

export default function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Olá! Sou o assistente virtual do **ReUse!** ♻️\nComo posso ajudar você hoje?',
      quickActions: [
        {
          label: 'Propostas Pendentes',
          actionType: 'send_message',
          payload: { messageText: 'Quais trocas pendentes eu tenho?' },
        },
        {
          label: 'Meus Itens Cadastrados',
          actionType: 'send_message',
          payload: { messageText: 'Ver meus itens cadastrados' },
        },
        {
          label: 'Como funciona uma troca?',
          actionType: 'send_message',
          payload: { messageText: 'Como funciona uma troca?' },
        },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, sessionId }),
      });

      if (!res.ok) {
        throw new Error('Falha na comunicação com o assistente');
      }

      const data: AssistantResponse = await res.json();

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        quickActions: data.quickActions,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Desculpe, não consegui processar sua mensagem no momento. Por favor, tente novamente mais tarde.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (qa: AssistantQuickAction) => {
    if (qa.actionType === 'send_message' && qa.payload.messageText) {
      handleSendMessage(qa.payload.messageText);
    }
  };

  return (
    <div className={styles.container}>
      {/* Botão de Abrir/Fechar Widget */}
      <button
        type="button"
        className={styles.floatingButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir assistente virtual"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Janela do Chat */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitleBox}>
              <Sparkles size={18} color="#FF9F1C" />
              <div>
                <h3 className={styles.headerTitle}>Assistente ReUse</h3>
                <span className={styles.headerSubtitle}>Suporte e Ações Rápidas</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Fechar chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mensagens */}
          <div className={styles.messagesArea}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.messageRow} ${
                  m.sender === 'user' ? styles.messageRowUser : styles.messageRowAssistant
                }`}
              >
                <div
                  className={`${styles.bubble} ${
                    m.sender === 'user' ? styles.bubbleUser : styles.bubbleAssistant
                  }`}
                >
                  {m.text}
                </div>

                {/* Quick actions anexadas à mensagem do assistente */}
                {m.quickActions && m.quickActions.length > 0 && (
                  <div className={styles.quickActionsContainer}>
                    {m.quickActions.map((qa, idx) => {
                      if (qa.actionType === 'navigate' && qa.payload.url) {
                        return (
                          <Link
                            key={idx}
                            href={qa.payload.url}
                            className={styles.quickActionBtn}
                            onClick={() => setIsOpen(false)}
                          >
                            <span>{qa.label}</span>
                            <ExternalLink size={12} />
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={styles.quickActionBtn}
                          onClick={() => handleQuickAction(qa)}
                        >
                          {qa.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
                <div className={styles.loadingBubble}>
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                  <div className={styles.dot} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className={styles.footer}>
            <form
              className={styles.inputForm}
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
            >
              <input
                type="text"
                className={styles.inputField}
                placeholder="Pergunte algo ou solicite uma ação..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className={styles.sendButton}
                disabled={!input.trim() || loading}
                aria-label="Enviar mensagem"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
