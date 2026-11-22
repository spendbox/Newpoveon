import { SideNav, type NavGroup } from "@/components/side-nav";

const GROUPS: NavGroup[] = [
  { title: "", items: [["/account", "Overview", "home"], ["/account/plan", "My plan", "target"]] },
  { title: "My health", items: [["/account/results", "Results", "clipboard"], ["/account/progress", "Progress", "gauge"], ["/account/bio-age", "Biological age", "dna"], ["/account/checkups", "Check-ups", "shield"]] },
  { title: "Care", items: [["/account/bookings", "Doctor bookings", "stethoscope"], ["/home-tests", "Lab tests", "flask"], ["/medication", "Medication", "box"]] },
  { title: "Account", items: [["/account/edit", "My answers", "edit"], ["/account/settings", "Settings", "user"]] },
];

export function AccountNav({ email, appName }: { email: string; appName: string }) {
  return <SideNav email={email} appName={appName} home="/account" groups={GROUPS} logoutAction="/auth/signout" />;
}
