import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNumericId, requireCurrentUser } from "@/lib/api-route";
import { revalidateMemos } from "@/lib/revalidate";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const memoId = parseNumericId(id);
    if (memoId === null) {
      return NextResponse.json({ detail: "无效的 ID", error: "无效的 ID" }, { status: 400 });
    }

    const memo = await prisma.memo.findUnique({
      where: { id: memoId },
    });

    if (!memo) {
      return NextResponse.json(
        { detail: "Memo 不存在", error: "Memo 不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(memo);
  } catch (error) {
    console.error("获取 memo 失败:", error);
    return NextResponse.json(
      { detail: "获取 memo 失败", error: "获取 memo 失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const memoId = parseNumericId(id);
    if (memoId === null) {
      return NextResponse.json({ detail: "无效的 ID", error: "无效的 ID" }, { status: 400 });
    }

    const body = await request.json();
    const { content, isPublished } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { detail: "内容不能为空", error: "内容不能为空" },
        { status: 400 }
      );
    }

    const memo = await prisma.memo.update({
      where: { id: memoId },
      data: {
        content: content.trim(),
        isPublished: isPublished ?? false,
      },
    });

    revalidateMemos();

    return NextResponse.json(memo);
  } catch (error) {
    console.error("更新 memo 失败:", error);
    return NextResponse.json(
      { detail: "更新 memo 失败", error: "更新 memo 失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireCurrentUser(request, "detail-error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const memoId = parseNumericId(id);
    if (memoId === null) {
      return NextResponse.json({ detail: "无效的 ID", error: "无效的 ID" }, { status: 400 });
    }

    await prisma.memo.delete({
      where: { id: memoId },
    });

    revalidateMemos();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除 memo 失败:", error);
    return NextResponse.json(
      { detail: "删除 memo 失败", error: "删除 memo 失败" },
      { status: 500 }
    );
  }
}
