/**
 * Shared constants for post status across the app.
 * Single source of truth — import from here, never redefine locally.
 */

export const POST_STATUSES = [
  "HANYA_INFORMASI",
  "PERLU_PERHATIAN",
  "DALAM_TINDAK_LANJUT",
  "SUDAH_DITINDAKLANJUTI",
  "TIDAK_DAPAT_DITINDAKLANJUTI",
] as const;

export type PostStatusValue = (typeof POST_STATUSES)[number];

/** Human-readable Indonesian labels */
export const STATUS_LABELS: Record<string, string> = {
  HANYA_INFORMASI: "Laporan Diterima",
  PERLU_PERHATIAN: "Perlu Perhatian",
  DALAM_TINDAK_LANJUT: "Dalam Tindak Lanjut",
  SUDAH_DITINDAKLANJUTI: "Sudah Ditindaklanjuti",
  TIDAK_DAPAT_DITINDAKLANJUTI: "Tidak Dapat Ditindaklanjuti",
};

/** Tailwind text-color classes */
export const STATUS_COLORS: Record<string, string> = {
  HANYA_INFORMASI: "text-blue-400",
  PERLU_PERHATIAN: "text-yellow-400",
  DALAM_TINDAK_LANJUT: "text-orange-400",
  SUDAH_DITINDAKLANJUTI: "text-green-400",
  TIDAK_DAPAT_DITINDAKLANJUTI: "text-gray-400",
};

/** Tailwind bg-color classes (for dot indicators) */
export const STATUS_DOT_COLORS: Record<string, string> = {
  HANYA_INFORMASI: "bg-blue-400",
  PERLU_PERHATIAN: "bg-yellow-400",
  DALAM_TINDAK_LANJUT: "bg-orange-400",
  SUDAH_DITINDAKLANJUTI: "bg-green-400",
  TIDAK_DAPAT_DITINDAKLANJUTI: "bg-gray-400",
};

/** Background + text badge classes (for status pills) */
export const STATUS_BG: Record<string, string> = {
  HANYA_INFORMASI: "bg-blue-900/50 text-blue-300",
  PERLU_PERHATIAN: "bg-yellow-900/50 text-yellow-300",
  DALAM_TINDAK_LANJUT: "bg-orange-900/50 text-orange-300",
  SUDAH_DITINDAKLANJUTI: "bg-green-900/50 text-green-300",
  TIDAK_DAPAT_DITINDAKLANJUTI: "bg-gray-800/50 text-gray-300",
};

/** Notification messages sent to users when admin changes status */
export const STATUS_NOTIFICATION_MESSAGES: Record<string, string> = {
  HANYA_INFORMASI: "Laporan Anda telah diterima.",
  PERLU_PERHATIAN: "Laporan Anda memerlukan perhatian lebih lanjut.",
  DALAM_TINDAK_LANJUT: "Laporan Anda sedang dalam tindak lanjut.",
  SUDAH_DITINDAKLANJUTI: "Laporan Anda telah selesai ditindaklanjuti.",
  TIDAK_DAPAT_DITINDAKLANJUTI:
    "Laporan Anda tidak dapat ditindaklanjuti saat ini.",
};

/** Array form for selects / dropdowns */
export const STATUS_OPTIONS = POST_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
  color: STATUS_COLORS[value],
  dot: STATUS_DOT_COLORS[value],
}));
