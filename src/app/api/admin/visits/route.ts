import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/api-route";
import { getDayRange, getTodayRange } from "@/lib/visits";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_DAILY_DAYS = 31;
const OTHER_LOCATION_NAME = "其他";
const DIRECT_REFERRER_NAME = "直接访问";

function parsePageParam(value: string | null, defaultValue: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isNaN(parsed) || parsed < 1 ? defaultValue : parsed;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string | null) {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function mergeWhere(...conditions: Prisma.VisitLogWhereInput[]) {
  const validConditions = conditions.filter(
    (condition) => Object.keys(condition).length > 0
  );

  if (validConditions.length === 0) return {};
  if (validConditions.length === 1) return validConditions[0];

  return { AND: validConditions };
}

function buildVisitWhere({
  startDate,
  endDate,
  query,
  path,
  region,
}: {
  startDate: Date | null;
  endDate: Date | null;
  query: string;
  path: string;
  region: string;
}): Prisma.VisitLogWhereInput {
  const dateWhere: Prisma.VisitLogWhereInput = {};
  if (startDate || endDate) {
    dateWhere.visitedAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lt: endDate } : {}),
    };
  }

  const queryWhere: Prisma.VisitLogWhereInput = query
    ? {
        OR: [
          { path: { contains: query } },
          { title: { contains: query } },
          { ipAddress: { contains: query } },
          { userAgent: { contains: query } },
          { referrer: { contains: query } },
          { countryName: { contains: query } },
          { regionName: { contains: query } },
          { cityName: { contains: query } },
        ],
      }
    : {};

  const pathWhere: Prisma.VisitLogWhereInput = path ? { path } : {};
  const regionWhere: Prisma.VisitLogWhereInput = region
    ? region === "未知"
      ? { OR: [{ regionName: null }, { regionName: "未知" }] }
      : { regionName: region }
    : {};

  return mergeWhere(dateWhere, queryWhere, pathWhere, regionWhere);
}

function buildDailyRanges(startDate: Date | null, endDate: Date | null) {
  const todayRange = getTodayRange();
  const end = endDate ? new Date(endDate) : todayRange.end;
  const start = startDate ? new Date(startDate) : new Date(end);

  if (!startDate) {
    start.setDate(start.getDate() - 7);
  }

  const ranges = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < end && ranges.length < MAX_DAILY_DAYS) {
    const range = getDayRange(cursor);
    ranges.push({
      date: new Date(cursor),
      start: range.start,
      end: range.end,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return ranges;
}

async function countUniqueVisitors(where?: Prisma.VisitLogWhereInput) {
  const visitors = await prisma.visitLog.findMany({
    where,
    distinct: ["visitorKey"],
    select: { visitorKey: true },
  });

  return visitors.length;
}

function mapDistribution<T extends { _count: { _all: number } }>(
  groups: T[],
  getName: (group: T) => string
) {
  return groups
    .map((group) => ({
      name: getName(group),
      value: group._count._all,
    }))
    .sort((a, b) => b.value - a.value);
}

function mapLocationDistribution<T extends { _count: { _all: number } }>(
  groups: T[],
  getName: (group: T) => string | null | undefined
) {
  const counts = new Map<string, number>();

  groups.forEach((group) => {
    const rawName = getName(group)?.trim();
    const name = rawName && rawName !== "未知" ? rawName : OTHER_LOCATION_NAME;
    counts.set(name, (counts.get(name) || 0) + group._count._all);
  });

  return Array.from(counts, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value
  );
}

function getReferrerName(referrer: string | null) {
  const trimmedReferrer = referrer?.trim();
  if (!trimmedReferrer) return DIRECT_REFERRER_NAME;

  try {
    const url = new URL(trimmedReferrer);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return trimmedReferrer;
  }
}

function mapReferrerDistribution<
  T extends { referrer: string | null; _count: { _all: number } },
>(groups: T[]) {
  const counts = new Map<string, number>();

  groups.forEach((group) => {
    const name = getReferrerName(group.referrer);
    counts.set(name, (counts.get(name) || 0) + group._count._all);
  });

  return Array.from(counts, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value
  );
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireCurrentUser(request);
    if (currentUser instanceof NextResponse) {
      return currentUser;
    }

    const { searchParams } = request.nextUrl;
    const page = parsePageParam(searchParams.get("page"), DEFAULT_PAGE);
    const pageSize = Math.min(
      parsePageParam(searchParams.get("page_size"), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    );
    const query = (searchParams.get("q") || "").trim();
    const path = (searchParams.get("path") || "").trim();
    const region = (searchParams.get("region") || "").trim();
    const startDate = parseDateOnly(searchParams.get("start_date"));
    const rawEndDate = parseDateOnly(searchParams.get("end_date"));
    const endDate = rawEndDate ? new Date(rawEndDate) : null;
    if (endDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const skip = (page - 1) * pageSize;
    const baseWhere = buildVisitWhere({ startDate, endDate, query, path, region });
    const locationBaseWhere = buildVisitWhere({
      startDate,
      endDate,
      query,
      path,
      region: "",
    });
    const todayRange = getTodayRange();
    const todayWhere = {
      visitedAt: {
        gte: todayRange.start,
        lt: todayRange.end,
      },
    };
    const dayRanges = buildDailyRanges(startDate, endDate);

    const [
      totalPv,
      totalUv,
      rangePv,
      rangeUv,
      todayPv,
      todayUv,
      totalItems,
      recentVisits,
      topPageGroups,
      deviceGroups,
      browserGroups,
      osGroups,
      countryGroups,
      regionGroups,
      cityGroups,
      referrerGroups,
      dailyStats,
    ] = await Promise.all([
      prisma.visitLog.count(),
      countUniqueVisitors(),
      prisma.visitLog.count({ where: baseWhere }),
      countUniqueVisitors(baseWhere),
      prisma.visitLog.count({ where: todayWhere }),
      countUniqueVisitors(todayWhere),
      prisma.visitLog.count({ where: baseWhere }),
      prisma.visitLog.findMany({
        take: pageSize,
        skip,
        where: baseWhere,
        orderBy: { visitedAt: "desc" },
        select: {
          id: true,
          path: true,
          title: true,
          referrer: true,
          ipAddress: true,
          userAgent: true,
          deviceType: true,
          browser: true,
          os: true,
          countryName: true,
          regionName: true,
          cityName: true,
          visitedAt: true,
        },
      }),
      prisma.visitLog.groupBy({
        by: ["path"],
        where: baseWhere,
        _count: { _all: true },
        _max: { visitedAt: true },
      }),
      prisma.visitLog.groupBy({
        by: ["deviceType"],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.visitLog.groupBy({
        by: ["browser"],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.visitLog.groupBy({
        by: ["os"],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.visitLog.groupBy({
        by: ["countryName"],
        where: locationBaseWhere,
        _count: { _all: true },
      }),
      prisma.visitLog.groupBy({
        by: ["regionName"],
        where: locationBaseWhere,
        _count: { _all: true },
      }),
      prisma.visitLog.groupBy({
        by: ["cityName"],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.visitLog.groupBy({
        by: ["referrer"],
        where: baseWhere,
        _count: { _all: true },
      }),
      Promise.all(
        dayRanges.map(async (range) => {
          const dayWhere = mergeWhere(baseWhere, {
            visitedAt: {
              gte: range.start,
              lt: range.end,
            },
          });
          const [pv, uv] = await Promise.all([
            prisma.visitLog.count({ where: dayWhere }),
            countUniqueVisitors(dayWhere),
          ]);

          return {
            date: formatDateKey(range.date),
            pv,
            uv,
          };
        })
      ),
    ]);

    const sortedTopPageGroups = topPageGroups
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 10);
    const topPages = await Promise.all(
      sortedTopPageGroups.map(async (pageGroup) => {
        const pageWhere = mergeWhere(baseWhere, { path: pageGroup.path });
        const [uv, latestVisit] = await Promise.all([
          countUniqueVisitors(pageWhere),
          prisma.visitLog.findFirst({
            where: pageWhere,
            orderBy: { visitedAt: "desc" },
            select: { title: true },
          }),
        ]);

        return {
          path: pageGroup.path,
          title: latestVisit?.title || null,
          pv: pageGroup._count._all,
          uv,
          last_visited_at: pageGroup._max.visitedAt?.toISOString() || null,
        };
      })
    );

    return NextResponse.json({
      stats: {
        total_pv: totalPv,
        total_uv: totalUv,
        range_pv: rangePv,
        range_uv: rangeUv,
        today_pv: todayPv,
        today_uv: todayUv,
      },
      daily_stats: dailyStats,
      top_pages: topPages,
      top_referrers: mapReferrerDistribution(referrerGroups).slice(0, 5),
      device_stats: {
        devices: mapDistribution(deviceGroups, (group) => group.deviceType),
        browsers: mapDistribution(browserGroups, (group) => group.browser),
        systems: mapDistribution(osGroups, (group) => group.os),
      },
      location_stats: {
        countries: mapLocationDistribution(
          countryGroups,
          (group) => group.countryName
        ),
        regions: mapLocationDistribution(
          regionGroups,
          (group) => group.regionName
        ),
        cities: mapLocationDistribution(cityGroups, (group) => group.cityName),
      },
      recent_visits: recentVisits.map((visit) => ({
        id: visit.id,
        path: visit.path,
        title: visit.title,
        referrer: visit.referrer,
        ip_address: visit.ipAddress,
        user_agent: visit.userAgent,
        device_type: visit.deviceType,
        browser: visit.browser,
        os: visit.os,
        country_name: visit.countryName,
        region_name: visit.regionName,
        city_name: visit.cityName,
        visited_at: visit.visitedAt.toISOString(),
      })),
      pagination: {
        total: totalItems,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(totalItems / pageSize),
      },
      filters: {
        start_date: startDate ? formatDateKey(startDate) : null,
        end_date: rawEndDate ? formatDateKey(rawEndDate) : null,
        q: query,
        path,
        region,
      },
    });
  } catch (error) {
    console.error("Get visit stats error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireCurrentUser(request);
    if (currentUser instanceof NextResponse) {
      return currentUser;
    }

    const body = await request.json().catch(() => null);
    const mode = body?.mode;

    if (mode === "all") {
      const result = await prisma.visitLog.deleteMany();
      return NextResponse.json({
        deleted_count: result.count,
        message: `已清空 ${result.count} 条访问统计`,
      });
    }

    if (mode === "before_date") {
      const beforeDate = parseDateOnly(
        typeof body?.before_date === "string" ? body.before_date : null
      );

      if (!beforeDate) {
        return NextResponse.json(
          { detail: "请选择有效的清理日期" },
          { status: 400 }
        );
      }

      const result = await prisma.visitLog.deleteMany({
        where: {
          visitedAt: {
            lt: beforeDate,
          },
        },
      });

      return NextResponse.json({
        deleted_count: result.count,
        message: `已删除 ${result.count} 条 ${formatDateKey(beforeDate)} 之前的访问统计`,
      });
    }

    return NextResponse.json(
      { detail: "不支持的清理方式" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Clear visit stats error:", error);
    return NextResponse.json(
      { detail: "服务器内部错误" },
      { status: 500 }
    );
  }
}
