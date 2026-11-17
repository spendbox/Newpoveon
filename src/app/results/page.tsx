import type { Metadata } from "next";
import { ResultsView } from "./results-view";

export const metadata: Metadata = { title: "Your results", robots: { index: false } };

export default function ResultsPage() {
  return <ResultsView />;
}
