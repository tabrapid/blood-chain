import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const question = String(body?.question ?? "");

  if (!question.trim()) return NextResponse.json({ answer: "Savol yo'q." });

  const token = process.env.HF_API_TOKEN;
  const model = process.env.HF_CHAT_MODEL ?? "openai/gpt-oss-120b:fastest";

  if (!token) {
    return NextResponse.json({ answer: "AI javob berolmadi. Token yo'q." });
  }

  try {
    const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Siz donorlar uchun qon topshirish va sog'liq bo'yicha savollarga javob beradigan yordamchi botsiz. Uzbek tilida javob bering. Qon topshirish, sog'liq, ovqatlanish, donorlik intervali haqida ma'lumot bering.",
          },
          { role: "user", content: question },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
      cache: "no-store",
    });

    const json = (await res.json().catch(() => null)) as
      | { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
      | null;

    const generated = json?.choices?.[0]?.message?.content;
    if (!res.ok || !generated) {
      return NextResponse.json({ answer: "AI javob berolmadi. Keyinroq urinib ko'ring." });
    }

    return NextResponse.json({ answer: generated.trim() });
  } catch (error) {
    console.error("HF error:", error);
    return NextResponse.json({ answer: "AI javob berolmadi. Keyinroq urinib ko'ring." });
  }
}
