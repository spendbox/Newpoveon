import { SideNav, type NavGroup } from "@/components/side-nav";

const GROUPS: NavGroup[] = [
  { title: "", items: [["/admin", "Overview", "home"]] },
  { title: "People", items: [["/admin/users", "Users", "user"], ["/admin/bookings", "Doctor bookings", "stethoscope"], ["/admin/requests", "Requests", "clipboard"]] },
  { title: "Setup", items: [["/admin/consults", "Consults and fees", "edit"], ["/admin/slots", "Availability", "calendar"], ["/admin/contacts", "Emergency contacts", "phone"]] },
  { title: "Next launch", items: [["/admin/plans", "Care plans", "target"], ["/admin/pricing", "Pricing", "scale"]] },
];

export function AdminNav({ email, appName }: { email: string; appName: string }) {
  return <SideNav email={email} appName={appName} badge="Admin" home="/admin" groups={GROUPS} logoutAction="/admin/logout" />;
}
