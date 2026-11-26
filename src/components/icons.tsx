/** Stroke icons: 2.6px ink lines, round caps (design system "Iconography"). */
import type { SVGProps } from "react";

const P: Record<string, React.ReactNode> = {
  thumbUp: <><path d="M14 18v16h-6V18z" /><path d="M14 19l6-11c2.5 0 4 1.8 3.4 4.4L22 18h8.5a3 3 0 0 1 3 3.5l-2 9.5a3 3 0 0 1-3 2.5H14" /></>,
  thumbDown: <><path d="M14 22V6H8v16z" /><path d="M14 21l6 11c2.5 0 4-1.8 3.4-4.4L22 22h8.5a3 3 0 0 0 3-3.5l-2-9.5a3 3 0 0 0-3-2.5H14" /></>,
  question: <><circle cx="20" cy="20" r="14" /><path d="M15.5 15.5a4.5 4.5 0 1 1 6.4 4.1c-1.3.6-1.9 1.6-1.9 3v.9M20 28.5h.01" /></>,
  female: <><circle cx="20" cy="15" r="8" /><path d="M20 23v12M15 30h10" /></>,
  male: <><circle cx="17" cy="23" r="8" /><path d="M23 17l9-9M24 8h8v8" /></>,
  leaf: <><path d="M8 32C8 16 18 8 33 8c0 15-8 25-24 24z" /><path d="M8 32l14-14" /></>,
  trophy: <><path d="M13 7h14v8a7 7 0 0 1-14 0z" /><path d="M13 10H8a5 5 0 0 0 5 6M27 10h5a5 5 0 0 1-5 6M20 22v6M14 33h12M16 28h8" /></>,
  smoke: <><path d="M5 25h24v6H5z" /><path d="M29 25h6v6h-6M30 20c0-3 3-3 3-6s-3-3-3-6M25 20c0-3 3-3 3-6" /></>,
  gauge: <><path d="M6 28a14 14 0 1 1 28 0" /><path d="M20 28l7-8M10 28h2M28 28h2M20 14v2" /><circle cx="20" cy="28" r="2" /></>,
  family: <><circle cx="13" cy="12" r="4" /><circle cx="27" cy="12" r="4" /><circle cx="20" cy="22" r="3" /><path d="M6 33c0-7 3-12 7-12s5 2 5 2M34 33c0-7-3-12-7-12s-5 2-5 2M15 34c0-4 2-6 5-6s5 2 5 6" /></>,
  veg: <><path d="M6 20h28a14 14 0 0 1-28 0z" /><path d="M14 20c-2-5 0-9 4-10M20 20c0-6 3-10 8-10M26 20c1-3 3-5 6-5" /></>,
  calendar: <><rect x="6" y="9" width="28" height="25" rx="4" /><path d="M6 16h28M13 5v7M27 5v7M13 23h3M20 23h3M13 28h3" /></>,
  couch: <><path d="M7 22v-6a4 4 0 0 1 4-4h18a4 4 0 0 1 4 4v6" /><path d="M4 21h32v8H4z" /><path d="M8 29v4M32 29v4" /></>,
  walk: <><circle cx="21" cy="7" r="3.5" /><path d="M20 12l-2 10-5 11M18 22l6 5 1 6M19.5 15l-6 4M19.5 15l6 3" /></>,
  run: <><circle cx="27" cy="7" r="3.5" /><path d="M25 12l-5 9-8 2M20 21l5 6-4 8M24 14l7 4M24 14l-7-1M3 17h6M2 24h7" /></>,
  moon: <path d="M30 24A12 12 0 0 1 16 10a12 12 0 1 0 14 14z" />,
  sun: <><circle cx="20" cy="20" r="7" /><path d="M20 5v4M20 31v4M5 20h4M31 20h4M9.4 9.4l2.8 2.8M27.8 27.8l2.8 2.8M9.4 30.6l2.8-2.8M27.8 12.2l2.8-2.8" /></>,
  partCloud: <><path d="M15 12a6 6 0 0 1 11 2" /><path d="M14 9V6M8 13l-2-2M7 19H4" /><path d="M12 32h17a6 6 0 0 0 0-12 9 9 0 0 0-17 2 5 5 0 0 0 0 10z" /></>,
  cloud: <path d="M11 30h18a7 7 0 0 0 0-14 10 10 0 0 0-19 3 5.5 5.5 0 0 0 1 11z" />,
  rain: <><path d="M11 23h18a7 7 0 0 0 0-14 10 10 0 0 0-19 3 5.5 5.5 0 0 0 1 11z" /><path d="M14 28l-2 5M21 28l-2 5M28 28l-2 5" /></>,
  drop: <path d="M20 5s10 11 10 18a10 10 0 0 1-20 0c0-7 10-18 10-18z" />,
  shield: <><path d="M20 5l12 5v9c0 8-5 13-12 16C13 32 8 27 8 19v-9z" /><path d="M15 20l4 4 7-8" /></>,
  dna: <><path d="M12 5c0 10 16 10 16 15S12 25 12 35M28 5c0 10-16 10-16 15s16 5 16 15" /><path d="M14 11h12M14 29h12" /></>,
  heart: <path d="M20 33S7 25 7 15.5A6.5 6.5 0 0 1 20 12a6.5 6.5 0 0 1 13 3.5C33 25 20 33 20 33z" />,
  arrowRight: <path d="M8 20h24M22 10l10 10-10 10" />,
  arrowLeft: <path d="M32 20H8M18 10L8 20l10 10" />,
  check: <path d="M9 21l7 7 15-16" />,
  warning: <><path d="M20 6l15 27H5z" /><path d="M20 16v7M20 28h.01" /></>,
  alert: <><circle cx="20" cy="20" r="14" /><path d="M20 12v10M20 28h.01" /></>,
  chat: <path d="M34 20a13 13 0 0 1-19 11.5L6 33l1.8-7.5A13 13 0 1 1 34 20z" />,
  whatsapp: <><path d="M34 20a13 13 0 0 1-19 11.5L6 33l1.8-7.5A13 13 0 1 1 34 20z" /><path d="M15 14c0 7 4 11 11 11l1.5-3-3.5-1.5-1.5 1.5c-2-1-3.5-2.5-4.5-4.5l1.5-1.5L18 12.5z" /></>,
  home: <><path d="M6 19L20 7l14 12" /><path d="M10 16v17h20V16M17 33v-9h6v9" /></>,
  pill: <><rect x="5" y="14" width="30" height="12" rx="6" transform="rotate(-35 20 20)" /><path d="M16 14l8 12" /></>,
  flask: <><path d="M15 5h10M17 5v11L8 31a3 3 0 0 0 2.6 4.5h18.8A3 3 0 0 0 32 31l-9-15V5" /><path d="M12 25h16" /></>,
  share: <><circle cx="29" cy="9" r="4" /><circle cx="11" cy="20" r="4" /><circle cx="29" cy="31" r="4" /><path d="M14.5 18l11-7M14.5 22l11 7" /></>,
  download: <path d="M20 6v19M12 17l8 8 8-8M7 33h26" />,
  close: <path d="M10 10l20 20M30 10L10 30" />,
  phone: <path d="M12 5l5 8-3 3c1.8 4 5 7.2 9 9l3-3 8 5-2 6c-14 1-27-12-26-26z" />,
  user: <><circle cx="20" cy="13" r="7" /><path d="M6 35c0-8 6-13 14-13s14 5 14 13" /></>,
  link: <><path d="M17 23a6 6 0 0 0 8.5 0l6-6a6 6 0 0 0-8.5-8.5l-2 2" /><path d="M23 17a6 6 0 0 0-8.5 0l-6 6a6 6 0 0 0 8.5 8.5l2-2" /></>,
  edit: <><path d="M26 7l7 7-18 18H8v-7z" /><path d="M22 11l7 7" /></>,
  trash: <><path d="M7 11h26M16 11V7h8v4M10 11l2 22h16l2-22" /><path d="M17 17v10M23 17v10" /></>,
  clock: <><circle cx="20" cy="20" r="14" /><path d="M20 12v9l6 3" /></>,
  location: <><path d="M20 35s11-9.5 11-19a11 11 0 0 0-22 0c0 9.5 11 19 11 19z" /><circle cx="20" cy="16" r="4" /></>,
  scale: <><rect x="7" y="7" width="26" height="26" rx="7" /><path d="M13 16a9 9 0 0 1 14 0" /><path d="M20 16l3-4" /></>,
  ruler: <><rect x="5" y="14" width="30" height="12" rx="3" /><path d="M11 14v5M17 14v3M23 14v5M29 14v3" /></>,
  glass: <><path d="M12 6h16l-2 27H14z" /><path d="M13 15h14" /></>,
  lungs: <><path d="M20 6v14M20 15l-4 4M20 15l4 4" /><path d="M15 13c-5 0-8 7-8 14 0 4 4 6 7 4s3-6 3-12" /><path d="M25 13c5 0 8 7 8 14 0 4-4 6-7 4s-3-6-3-12" /></>,
  mind: <><path d="M14 33v-5c-4-2-7-6-7-11a13 13 0 0 1 26 0c0 3-1 5-3 6v4h-4v6" /><path d="M16 17a4 4 0 0 1 8 0c0 3-4 3-4 6" /></>,
  clipboard: <><rect x="9" y="8" width="22" height="27" rx="4" /><path d="M15 8V6h10v2" /><path d="M14 18l3 3 6-6M14 28h12" /></>,
  stethoscope: <><path d="M10 5v9a7 7 0 0 0 14 0V5" /><path d="M17 21v4a8 8 0 0 0 16 0v-3" /><circle cx="33" cy="19" r="3" /></>,
  box: <><path d="M6 13l14-7 14 7v15l-14 7-14-7z" /><path d="M6 13l14 7 14-7M20 20v15" /></>,
  target: <><circle cx="20" cy="20" r="14" /><circle cx="20" cy="20" r="8" /><circle cx="20" cy="20" r="2" /></>,
  chart: <><path d="M6 34h28" /><path d="M10 34V22M17 34V14M24 34V19M31 34V8" /></>,
  eye: <><path d="M3 20s6-11 17-11 17 11 17 11-6 11-17 11S3 20 3 20z" /><circle cx="20" cy="20" r="5" /></>,
  eyeOff: <><path d="M3 20s6-11 17-11c3.2 0 5.9.9 8.1 2.3M37 20s-6 11-17 11c-3.2 0-5.9-.9-8.1-2.3" /><path d="M16.5 23.5a5 5 0 0 1 7-7M6 34L34 6" /></>,
  mic: <><rect x="14" y="5" width="12" height="20" rx="6" /><path d="M9 19a11 11 0 0 0 22 0M20 30v5M14 35h12" /></>,
  lock: <><rect x="8" y="18" width="24" height="17" rx="4" /><path d="M13 18v-5a7 7 0 0 1 14 0v5M20 25v4" /></>,
};

export type IconName = keyof typeof P;

/** WhatsApp's own logo (filled), from Simple Icons (CC0). */
const WHATSAPP_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

export function Icon({ name, size = 24, strokeWidth = 2.6, ...rest }: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  if (name === "whatsapp") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...rest}>
        <path d={WHATSAPP_PATH} />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      // Keep the line about `strokeWidth` px on screen whatever the icon size.
      strokeWidth={(strokeWidth * 40) / size}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {P[name]}
    </svg>
  );
}
