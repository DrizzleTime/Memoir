import { NextRequest, NextResponse } from "next/server";
import { lookupGeoIp } from "@/lib/geoip";
import { prisma } from "@/lib/prisma";
import {
  buildVisitorKey,
  getClientIp,
  isPublicVisitPath,
  normalizeVisitPath,
  parseDeviceInfo,
} from "@/lib/visits";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const rawPath = typeof body?.path === "string" ? body.path : "/";
    const path = normalizeVisitPath(rawPath);
    const title =
      typeof body?.title === "string" ? body.title.trim().slice(0, 255) || null : null;
    const bodyReferrer =
      typeof body?.referrer === "string"
        ? body.referrer.trim().slice(0, 500) || null
        : null;

    if (!isPublicVisitPath(path)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const ipAddress = getClientIp(request).slice(0, 255);
    const userAgent = (request.headers.get("user-agent") || "").slice(0, 500);
    const deviceInfo = parseDeviceInfo(userAgent);
    const geoIp = await lookupGeoIp(ipAddress);

    await prisma.visitLog.create({
      data: {
        path,
        title,
        referrer: bodyReferrer,
        ipAddress,
        userAgent: userAgent || null,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        visitorKey: buildVisitorKey(ipAddress, userAgent),
        countryCode: geoIp.countryCode,
        countryName: geoIp.countryName,
        regionName: geoIp.regionName,
        cityName: geoIp.cityName,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Create visit log error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
