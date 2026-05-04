export type ClassValue = string | null | undefined | false;

export function cn(...values: ClassValue[]) {
  return values.filter(Boolean).join(" ");
}

