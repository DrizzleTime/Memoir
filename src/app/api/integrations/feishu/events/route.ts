import { NextRequest, NextResponse } from "next/server";
import {
  getFeishuEventSummary,
  getFeishuConfig,
  isFeishuVerificationTokenValid,
  publishFeishuMessageAsMemo,
  type FeishuEventRequestBody,
} from "@/lib/feishu";

export async function POST(request: NextRequest) {
  try {
    const config = await getFeishuConfig();
    if (!config) {
      console.warn("[feishu] 飞书机器人配置不完整，无法处理回调");
      return NextResponse.json(
        { error: "飞书机器人配置不完整" },
        { status: 400 }
      );
    }

    const body = await request.json() as FeishuEventRequestBody;
    const summary = getFeishuEventSummary(body);
    console.log("[feishu] 收到事件回调", summary);

    if (body.encrypt) {
      console.warn("[feishu] 当前收到加密事件，但服务端未实现解密", summary);
      return NextResponse.json(
        { error: "暂不支持 Encrypt Key 加密事件" },
        { status: 400 }
      );
    }

    const requestToken = body.token || body.header?.token;
    if (!isFeishuVerificationTokenValid(config, requestToken)) {
      console.warn("[feishu] token 校验失败", {
        ...summary,
        hasRequestToken: Boolean(requestToken),
      });
      return NextResponse.json({ error: "飞书 token 校验失败" }, { status: 401 });
    }

    if (body.type === "url_verification") {
      console.log("[feishu] 处理 url_verification", summary);
      return NextResponse.json({ challenge: body.challenge || "" });
    }

    const result = await publishFeishuMessageAsMemo({ config, body });
    console.log("[feishu] 事件处理完成", {
      ...summary,
      created: result.created,
      ignored: result.ignored,
      reason: result.reason,
    });

    return NextResponse.json({
      ok: true,
      created: result.created,
      ignored: result.ignored,
      reason: result.reason,
    });
  } catch (error) {
    console.error("[feishu] 处理飞书事件失败:", error);
    return NextResponse.json(
      { error: "处理飞书事件失败" },
      { status: 500 }
    );
  }
}
