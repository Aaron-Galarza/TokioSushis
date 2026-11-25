'use client';

import { useState } from 'react';
import axios from 'axios';
import api from '@/services/api';

type Task = { status: string; operations?: Array<{ action: string; resourceId?: string; status: string; error?: string }> };
type Message = { role: 'user' | 'assistant'; text: string; pendingId?: string; task?: Task };

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: '¡Hola! ¿Qué querés consultar o cambiar en Tokyo? Los cambios se aplican solo después de tu confirmación.' },
  ]);

  async function call(path: string, body: object) {
    setBusy(true);
    try {
      const response = await api.post('/assistant/' + path, body);
      setMessages(current => [...current, { role: 'assistant', text: response.data.data.message, pendingId: response.data.data.pendingId, task: response.data.data.task }]);
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      setMessages(current => [...current, { role: 'assistant', text: message || 'No se pudo completar la solicitud. Revisá la conexión e intentá nuevamente.' }]);
    } finally {
      setBusy(false);
    }
  }

  function send(event: React.FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setMessages(current => [...current, { role: 'user', text: message }]);
    setText('');
    const history = messages.slice(-6).map(({ role, text }) => ({ role, text: text.slice(0, 800) }));
    void call('message', { message, history });
  }

  function decide(pendingId: string, action: 'confirm' | 'cancel') {
    setMessages(current => current.map(message => message.pendingId === pendingId ? { ...message, pendingId: undefined } : message));
    void call(action, { pendingId });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-40 rounded-full bg-primary px-4 py-3 text-sm font-bold text-black shadow-lg" aria-haspopup="dialog">
        Asistente AF ✨
      </button>
      {open && (
        <section role="dialog" aria-modal="true" aria-labelledby="assistant-title" className="fixed inset-0 z-50 flex items-end justify-end bg-black/70 sm:items-center sm:p-4">
          <div className="flex h-[min(80vh,36rem)] w-full max-w-md flex-col rounded-t-xl border border-white/20 bg-[#171717] text-white shadow-xl sm:rounded-xl">
            <header className="flex items-center justify-between border-b border-white/10 p-4">
              <div><h2 id="assistant-title" className="font-bold">Asistente AF ✨</h2><p className="text-xs text-white/60">Operaciones de Tokyo con confirmación</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar asistente" className="rounded p-2 text-xl">×</button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              {messages.map((message, index) => (
                <div key={index} className={message.role === 'user' ? 'ml-8 rounded-lg bg-primary/20 p-3' : 'mr-8 rounded-lg bg-white/10 p-3'}>
                  <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                  {message.task?.operations && <div className="mt-3 space-y-1 text-xs text-white/70"><p>Estado: {message.task.status}</p>{message.task.operations.map((operation, taskIndex) => <p key={taskIndex}>{operation.resourceId || operation.action}: {operation.status}{operation.error ? ` — ${operation.error}` : ''}</p>)}</div>}
                  {message.pendingId && <div className="mt-3 flex gap-2">
                    <button type="button" disabled={busy} onClick={() => decide(message.pendingId!, 'confirm')} className="rounded bg-primary px-3 py-2 text-sm font-bold text-black disabled:opacity-50">Confirmar</button>
                    <button type="button" disabled={busy} onClick={() => decide(message.pendingId!, 'cancel')} className="rounded border border-white/30 px-3 py-2 text-sm disabled:opacity-50">Cancelar</button>
                  </div>}
                </div>
              ))}
              {busy && <p className="text-sm text-white/60">Procesando…</p>}
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
              <label htmlFor="assistant-message" className="sr-only">Mensaje al asistente</label>
              <input id="assistant-message" value={text} onChange={event => setText(event.target.value)} maxLength={500} className="min-w-0 flex-1 rounded border border-white/20 bg-black px-3 py-2 text-sm" placeholder="Escribí tu solicitud" />
              <button disabled={busy || !text.trim()} className="rounded bg-primary px-4 py-2 text-sm font-bold text-black disabled:opacity-50">Enviar</button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
