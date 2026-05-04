import fs from "fs";
import path from "path";
import { Reader, type ReaderModel } from "@maxmind/geoip2-node";
import { getDataDir } from "@/lib/runtime-config";

export interface GeoIpLocation {
  countryCode: string | null;
  countryName: string | null;
  regionName: string | null;
  cityName: string | null;
}

const EMPTY_LOCATION: GeoIpLocation = {
  countryCode: null,
  countryName: null,
  regionName: null,
  cityName: null,
};

const globalForGeoIp = globalThis as unknown as {
  geoIpReaderPromise?: Promise<ReaderModel | null>;
  geoIpDatabasePath?: string | null;
};

function getGeoIpDatabasePath() {
  const configuredPath =
    process.env.GEOIP_DATABASE_PATH?.trim() ||
    path.join(getDataDir(), "GeoLite2-City.mmdb");

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath);
}

function getName(names: { "zh-CN"?: string; en?: string } | undefined) {
  return names?.["zh-CN"] || names?.en || null;
}

async function getGeoIpReader() {
  const databasePath = getGeoIpDatabasePath();
  if (!databasePath || !fs.existsSync(databasePath)) {
    return null;
  }

  if (
    !globalForGeoIp.geoIpReaderPromise ||
    globalForGeoIp.geoIpDatabasePath !== databasePath
  ) {
    globalForGeoIp.geoIpDatabasePath = databasePath;
    globalForGeoIp.geoIpReaderPromise = Reader.open(databasePath).catch((error) => {
      console.error("Open GeoIP database error:", error);
      return null;
    });
  }

  return globalForGeoIp.geoIpReaderPromise;
}

export async function lookupGeoIp(ipAddress: string): Promise<GeoIpLocation> {
  if (!ipAddress || ipAddress === "unknown") {
    return EMPTY_LOCATION;
  }

  const reader = await getGeoIpReader();
  if (!reader) {
    return EMPTY_LOCATION;
  }

  try {
    const result = reader.city(ipAddress);
    const subdivision = result.subdivisions?.[0];

    return {
      countryCode: result.country?.isoCode || null,
      countryName: getName(result.country?.names),
      regionName: getName(subdivision?.names),
      cityName: getName(result.city?.names),
    };
  } catch {
    return EMPTY_LOCATION;
  }
}
