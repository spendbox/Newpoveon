/**
 * What we can arrange through WhatsApp. No prices here: our team confirms price and timing in the chat.
 * Edit these lists freely; the Lab tests and Medication pages update automatically.
 */
import type { IconName } from "@/components/icons";

export type CatalogGroup = { key: string; icon: IconName; title: string; text: string; items: string[] };

export const LAB_GROUPS: CatalogGroup[] = [
  { key: "full", icon: "clipboard", title: "Full health checks", text: "A head-to-toe check, for you or your parents.", items: ["Basic health check", "Executive health check", "Over-40s check", "Pre-employment medical"] },
  { key: "heart", icon: "heart", title: "Heart and blood pressure", text: "Know your numbers.", items: ["Home blood pressure check", "Cholesterol (lipid profile)", "ECG", "Heart risk panel"] },
  { key: "diabetes", icon: "drop", title: "Diabetes", text: "Catch high sugar early.", items: ["Fasting blood sugar", "HbA1c (3-month average)", "Diabetes follow-up panel"] },
  { key: "women", icon: "female", title: "Women's health", text: "Screening and hormones.", items: ["Cervical screening (Pap / HPV)", "Breast check referral", "Hormone panel", "Fertility hormones (AMH, FSH, LH)"] },
  { key: "men", icon: "male", title: "Men's health", text: "Checks most men skip.", items: ["Prostate (PSA)", "Testosterone", "Semen analysis"] },
  { key: "sexual", icon: "shield", title: "Sexual health", text: "Private and judgement-free.", items: ["HIV test", "Hepatitis B and C", "Syphilis (VDRL)", "Full STI screen"] },
  { key: "premarital", icon: "dna", title: "Pre-marital and pregnancy", text: "Plan ahead with confidence.", items: ["Genotype", "Blood group", "Pregnancy test", "Antenatal panel"] },
  { key: "organs", icon: "flask", title: "Kidney, liver and thyroid", text: "How your organs are working.", items: ["Kidney function (E/U/Cr)", "Liver function (LFT)", "Thyroid (TSH, T3, T4)"] },
  { key: "everyday", icon: "sun", title: "Everyday tests", text: "The common ones.", items: ["Full blood count", "Malaria", "Typhoid", "Urine test", "Vitamin D and B12"] },
];

export const MED_GROUPS: CatalogGroup[] = [
  { key: "long-term", icon: "heart", title: "Long-term conditions", text: "Never run out of your regular medicines.", items: ["Blood pressure", "Diabetes and insulin", "Cholesterol", "Asthma inhalers", "Thyroid"] },
  { key: "hard-to-find", icon: "box", title: "Hard-to-find medicines", text: "Rare, imported or out of stock where you are? Our partners can source it.", items: ["Cancer medicines", "Specialist and imported brands", "Rare-disease medicines", "Medicines that are out of stock nearby"] },
  { key: "everyday", icon: "pill", title: "Everyday medicines", text: "For common illnesses.", items: ["Malaria treatment", "Antibiotics (with prescription)", "Pain and fever relief", "Allergy relief"] },
  { key: "women-men", icon: "family", title: "Women's and men's health", text: "Delivered discreetly.", items: ["Contraception", "Fertility medicines", "Pregnancy vitamins", "Erectile dysfunction"] },
  { key: "mind", icon: "mind", title: "Mind and sleep", text: "With a doctor's guidance.", items: ["Depression and anxiety medicines", "Sleep support"] },
  { key: "wellness", icon: "leaf", title: "Vitamins and wellness", text: "Supplements from trusted brands.", items: ["Multivitamins", "Vitamin D", "Iron and folic acid", "Weight-loss support (doctor-led)"] },
];

/** The NAFDAC registration portal, where anyone can check a product's NAFDAC number. */
export const NAFDAC_CHECK_URL = "https://registration.nafdac.gov.ng/";

/** Tests the results page can point to, by code. Used only to pre-write the WhatsApp message. */
export const TEST_NAMES: Record<string, string> = {
  "bp-check": "Home blood pressure check",
  "blood-sugar": "Blood sugar test",
  "cervical-screening": "Cervical screening",
  "hepatitis-b": "Hepatitis B test",
  genotype: "Genotype test",
};
