"use client";

import { useEffect, useState } from "react";

import { useGpsLocation } from "@/hooks/useGpsLocation";

type Msg = { sender: "user" | "assistant"; content: string };
type Convo = { id: string; title: string | null; createdAt: string };

const GREETING: Msg = {
  sender: "assistant",
  content: 'Jambo! I am your Smart Ocean AI Assistant. Ask "Leo niende wapi?" or "Bahari iko salama?"',
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<Convo[]>([]);
  const [sending, setSending] = useState(false);
  const gps = useGpsLocation();

  const loadHistory = async () => {
    const res = await fetch("/api/ai/conversations");
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations ?? []);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const newChat = () => {
    setConversationId(undefined);
    setMessages([GREETING]);
  };

  const openConversation = async (id: string) => {
    const res = await fetch(`/api/ai/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setConversationId(data.conversation.id);
    setMessages(
      (data.conversation.messages ?? []).map((m: { sender: string; content: string }) => ({
        sender: m.sender === "user" ? "user" : "assistant",
        content: m.content,
      })),
    );
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { sender: "user", content: text }]);
    setSending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
          ...(gps.status === "ready"
            ? { latitude: gps.latitude, longitude: gps.longitude }
            : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setConversationId(data.conversationId);
        setMessages((m) => [...m, { sender: "assistant", content: data.message?.content ?? "No response" }]);
        loadHistory();
      } else {
        setMessages((m) => [...m, { sender: "assistant", content: data.error || "Failed to get response" }]);
      }
    } catch {
      setMessages((m) => [...m, { sender: "assistant", content: "Network error" }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-900">AI Assistant</h1>
        <button onClick={newChat} className="px-4 py-2 text-sm border border-blue-200 text-blue-800 rounded-lg hover:bg-blue-50 font-medium">+ New chat</button>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[480px]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 space-y-1 overflow-y-auto max-h-[560px]">
          <p className="text-xs font-semibold text-gray-500 px-2 py-1">History (verified app data only)</p>
          {conversations.length === 0 && (
            <p className="text-sm text-gray-400 px-2">No conversations yet.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={`w-full text-left p-2 rounded-lg text-sm hover:bg-blue-50 transition ${c.id === conversationId ? "bg-blue-50 border border-blue-200" : "border border-transparent"}`}
            >
              <span className="font-medium block truncate">{c.title || "Conversation"}</span>
              <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
            </button>
          ))}
        </div>
        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={msg.sender === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={msg.sender === "user" ? "bg-blue-800 text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%]" : "bg-blue-50 text-blue-900 p-4 rounded-2xl rounded-tl-sm max-w-[80%]"}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <div className="flex space-x-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} type="text" maxLength={1000} className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ask about zones, safety, best time..." />
              <button onClick={send} disabled={sending} className="px-6 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60">{sending ? "..." : "Send"}</button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Answers are based on Smart Ocean fishing information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
