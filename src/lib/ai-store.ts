// In-memory AI conversation store for Phase 2 (Prisma in Phase 3).

export type AiMessageRecord = {
  id: string;
  conversationId: string;
  sender: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AiConversationRecord = {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
};

export const mockConversations: AiConversationRecord[] = [];
export const mockMessages: AiMessageRecord[] = [];

export function createConversation(userId: string, title: string | null) {
  const convo: AiConversationRecord = {
    id: `convo_${Date.now()}`,
    userId,
    title,
    createdAt: new Date().toISOString(),
  };
  mockConversations.unshift(convo);
  return convo;
}

export function addMessage(
  conversationId: string,
  sender: "user" | "assistant",
  content: string,
) {
  const msg: AiMessageRecord = {
    id: `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    conversationId,
    sender,
    content,
    createdAt: new Date().toISOString(),
  };
  mockMessages.push(msg);
  return msg;
}

export function listConversations(userId: string) {
  return mockConversations.filter((c) => c.userId === userId);
}

export function getConversationForUser(id: string, userId: string) {
  const convo = mockConversations.find((c) => c.id === id && c.userId === userId);
  if (!convo) return null;
  const messages = mockMessages
    .filter((m) => m.conversationId === id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return { ...convo, messages };
}
