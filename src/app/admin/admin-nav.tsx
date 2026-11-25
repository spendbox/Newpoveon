import { SideNav, type NavGroup } from "@/components/side-nav";
import { consultsOn } from "@/lib/help";

type Item = NavGroup["items"][number];

const GROUPS: NavGroup[] = [
  { title: "", items: [["/admin", "Overview", "home"]] },
  // Doctor bookings and availability are hidden while consults are paused (features.consults); the pages are kept.
  { title: "People", items: [["/admin/users", "Users", "user"], ...(consultsOn ? [["/admin/bookings", "Doctor bookings", "stethoscope"] as Item] : []), ["/admin/requests", "Requests", "clipboard"], ["/admin/bio-age", "Biological age", "dna"]] },
  { title: "Setup", items: [["/admin/consults", consultsOn ? "Consults and fees" : "Check price and plan", "edit"], ...(consultsOn ? [["/admin/slots", "Availability", "calendar"] as Item] : []), ["/admin/contacts", "Emergency contacts", "phone"]] },
  { title: "Next launch", items: [["/admin/plans", "Care plans", "target"], ["/admin/pricing", "Pricing", "scale"]] },
];

export function AdminNav({ email, appName }: { email: string; appName: string }) {
  return <SideNav email={email} appName={appName} badge="Admin" home="/admin" groups={GROUPS} logoutAction="/admin/logout" />;
}
