'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Message } from '@/types/message';

export default function AdminPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map(m => m.id)));
    }
  };

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.size} messages?`)) return;
    
    setDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/messages/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedIds(new Set());
      await fetchMessages();
    } catch (error) {
      console.error('Failed to delete messages:', error);
    } finally {
      setDeleting(false);
    }
  };

  const deleteAll = async () => {
    if (!confirm('Delete ALL messages? This cannot be undone!')) return;
    
    setDeleting(true);
    try {
      await fetch('/api/clear', { method: 'POST' });
      setSelectedIds(new Set());
      await fetchMessages();
    } catch (error) {
      console.error('Failed to delete all messages:', error);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-light text-black">Admin Panel</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            ← Back to home
          </Link>
        </div>

        <div className="bg-white border border-black rounded-xl p-6 mb-6">
          <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={selectAll}
                className="border border-black rounded-full px-4 py-1 text-sm hover:bg-black hover:text-white transition-colors"
              >
                {selectedIds.size === messages.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={deleteSelected}
                disabled={selectedIds.size === 0 || deleting}
                className="border border-red-500 rounded-full px-4 py-1 text-sm text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-40"
              >
                Delete Selected ({selectedIds.size})
              </button>
              <button
                onClick={deleteAll}
                disabled={messages.length === 0 || deleting}
                className="border border-red-700 rounded-full px-4 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white transition-colors disabled:opacity-40"
              >
                Delete All ({messages.length})
              </button>
            </div>
            <span className="text-sm text-gray-500">
              Total: {messages.length} messages
            </span>
          </div>

          {messages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No messages yet</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`border rounded-lg p-4 flex items-start gap-4 ${
                    selectedIds.has(msg.id) ? 'bg-gray-50 border-black' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(msg.id)}
                    onChange={() => toggleSelect(msg.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {msg.type === 'text' ? '📝 Text' : '🎤 Voice'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(msg.created)}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-gray-400">
                        {msg.id.slice(0, 8)}...
                      </span>
                    </div>

                    {msg.type === 'text' ? (
                      <p className="text-black whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    ) : (
                      <audio controls src={msg.voiceUrl} className="w-full max-w-md" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}