import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversation = await db.aiConversation.findFirst({
    where: { id: params.id, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation)
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  return NextResponse.json({ success: true, conversation });
}
