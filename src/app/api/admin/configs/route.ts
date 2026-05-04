import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import { clearSiteConfigCache, isSiteConfigKey } from "@/lib/site";

function refreshSiteConfigIfNeeded(shouldRefresh: boolean) {
  if (!shouldRefresh) return;

  clearSiteConfigCache();
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const configs = await prisma.config.findMany({
      orderBy: { key: "asc" },
    });

    const result = configs.map((config: (typeof configs)[number]) => ({
      id: config.id,
      key: config.key,
      value: config.value,
      description: config.description,
      created_at: config.createdAt.toISOString(),
      updated_at: config.updatedAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("List configs error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { key, value, description } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { detail: "key 是必填项" },
        { status: 400 }
      );
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { detail: "value 是必填项" },
        { status: 400 }
      );
    }

    const existing = await prisma.config.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json(
        { detail: "配置项已存在" },
        { status: 400 }
      );
    }

    const config = await prisma.config.create({
      data: {
        key,
        value: String(value),
        description: description || null,
      },
    });

    refreshSiteConfigIfNeeded(isSiteConfigKey(key));

    return NextResponse.json(
      {
        id: config.id,
        key: config.key,
        value: config.value,
        description: config.description,
        created_at: config.createdAt.toISOString(),
        updated_at: config.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create config error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { detail: "请求体必须是数组" },
        { status: 400 }
      );
    }

    const results = [];
    let shouldRefreshSiteConfig = false;

    for (const item of body) {
      const { key, value, description } = item;

      if (!key || typeof key !== "string") {
        continue;
      }

      if (isSiteConfigKey(key)) {
        shouldRefreshSiteConfig = true;
      }

      const config = await prisma.config.upsert({
        where: { key },
        update: {
          value: String(value),
          description: description !== undefined ? description : undefined,
        },
        create: {
          key,
          value: String(value),
          description: description || null,
        },
      });

      results.push({
        id: config.id,
        key: config.key,
        value: config.value,
        description: config.description,
        updated_at: config.updatedAt.toISOString(),
      });
    }

    refreshSiteConfigIfNeeded(shouldRefreshSiteConfig);

    return NextResponse.json({
      message: `已更新 ${results.length} 个配置项`,
      configs: results,
    });
  } catch (error) {
    console.error("Update configs error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireCurrentUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { key } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { detail: "key 是必填项" },
        { status: 400 }
      );
    }

    const config = await prisma.config.findUnique({
      where: { key },
    });

    if (!config) {
      return NextResponse.json(
        { detail: "配置项不存在" },
        { status: 404 }
      );
    }

    await prisma.config.delete({
      where: { key },
    });

    refreshSiteConfigIfNeeded(isSiteConfigKey(key));

    return NextResponse.json({
      message: "配置项已删除",
    });
  } catch (error) {
    console.error("Delete config error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
