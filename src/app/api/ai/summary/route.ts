import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { detail: "content 是必填项" },
        { status: 400 }
      );
    }

    if (content.trim().length < 50) {
      return NextResponse.json(
        { detail: "文章内容太短，无法生成摘要" },
        { status: 400 }
      );
    }

    const configs = await prisma.config.findMany({
      where: {
        key: {
          in: ["ai_endpoint", "ai_model", "ai_api_key"],
        },
      },
    });

    const configMap = new Map<string, string>(
      configs.map((config: (typeof configs)[number]) => [config.key, config.value])
    );
    const aiEndpoint = configMap.get("ai_endpoint");
    const aiModel = configMap.get("ai_model");
    const aiApiKey = configMap.get("ai_api_key");

    if (!aiEndpoint || !aiModel || !aiApiKey) {
      return NextResponse.json(
        { detail: "AI 配置不完整，请先在系统设置中配置 AI 参数" },
        { status: 400 }
      );
    }

    const messages: OpenAIMessage[] = [
      {
        role: "system",
        content: `你是一个专业的文章摘要生成助手。请为用户提供的文章生成一个简洁的摘要。

要求：
1. 保持原文的写作风格和语气，可以适当修改原文的表达方式，但不要改变原文的意思
2. 突出文章核心要点
3. 保持原文的人称（第一人称/第三人称）
4. 摘要长度控制在 50-80 字之间
5. 不要添加原文没有的信息
6. 直接输出摘要内容，不要添加任何前缀或说明`,
      },
      {
        role: "user",
        content: `请为以下文章生成摘要：\n\n${content}`,
      },
    ];

    const apiUrl = aiEndpoint.endsWith("/")
      ? `${aiEndpoint}chat/completions`
      : `${aiEndpoint}/chat/completions`;

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      return NextResponse.json(
        { detail: "AI 服务调用失败，请检查配置是否正确" },
        { status: 502 }
      );
    }

    const aiResult: OpenAIChatResponse = await aiResponse.json();
    const summary = aiResult.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return NextResponse.json(
        { detail: "AI 未能生成有效的摘要" },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Generate summary error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
