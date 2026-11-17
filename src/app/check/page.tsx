import type { Metadata } from "next";
import { Questionnaire } from "./questionnaire";

export const metadata: Metadata = { title: "Your check", robots: { index: false } };

export default function CheckPage() {
  return <Questionnaire />;
}
