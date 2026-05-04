import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNumericId, requireCurrentUser } from "@/lib/api-route";
import fs from "fs";
import path from "path";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const fileId = parseNumericId(id);
    if (fileId === null) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const body = await request.json();
    const newName = String(body.newName || "").trim();
    if (!newName) {
      return NextResponse.json({ error: "新文件名不能为空" }, { status: 400 });
    }

    const existing = await prisma.uploadFile.findUnique({ where: { id: fileId } });
    if (!existing) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    const updated = await prisma.uploadFile.update({
      where: { id: fileId },
      data: {
        originalName: newName,
      },
    });

    return NextResponse.json({ ...updated, url: `/uploads/${updated.relativePath}` });
  } catch (error) {
    console.error("重命名文件失败:", error);
    return NextResponse.json({ error: "重命名文件失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const fileId = parseNumericId(id);
    if (fileId === null) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const existing = await prisma.uploadFile.findUnique({ where: { id: fileId } });
    if (!existing) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    const uploadsRoot = path.join(process.cwd(), "data", "uploads");
    const absolutePath = path.join(uploadsRoot, ...existing.relativePath.split("/"));
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await prisma.uploadFile.delete({ where: { id: fileId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除文件失败:", error);
    return NextResponse.json({ error: "删除文件失败" }, { status: 500 });
  }
}
