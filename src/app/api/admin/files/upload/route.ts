import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/api-route";
import {
  saveWebFileAsUploadFile,
  type UploadedFileResult,
} from "@/lib/upload-file";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request, "error");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      const singleFile = formData.get("file");
      if (singleFile instanceof File) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    const uploadedItems: UploadedFileResult[] = [];
    const errors: Array<{ name: string; error: string }> = [];

    for (const file of files) {
      try {
        uploadedItems.push(await saveWebFileAsUploadFile(file));
      } catch (error) {
        errors.push({
          name: file.name,
          error: error instanceof Error ? error.message : "上传失败",
        });
      }
    }

    if (uploadedItems.length === 0) {
      return NextResponse.json(
        {
          error: errors[0]?.error || "上传文件失败",
          items: [],
          errors,
        },
        { status: 500 }
      );
    }

    if (uploadedItems.length === 1 && errors.length === 0) {
      return NextResponse.json(
        {
          ...uploadedItems[0],
          count: 1,
          items: uploadedItems,
          errors: [],
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        count: uploadedItems.length,
        items: uploadedItems,
        errors,
      },
      { status: errors.length > 0 ? 207 : 201 }
    );
  } catch (error) {
    console.error("上传文件失败:", error);
    return NextResponse.json({ error: "上传文件失败" }, { status: 500 });
  }
}
