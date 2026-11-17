# Screening tools: sources, licences and how we checked them

Every score in HealthCheck comes from a published, validated tool. Nothing is invented.
The scoring code is in `src/lib/scoring/`, with the source cited at the top of each function,
and the tests are in `src/lib/scoring/scoring.test.ts` (run `npm test`).

**How sure we are about each source.** This build ran in an environment whose network could reach
GitHub and the code-package sites but **not** WHO, The Lancet, PubMed or the tool owners' websites.
So:

- **Verified from source:** the numbers were taken directly from the authors' own published code
  and data files, and checked against a second independent copy.
- **From the published literature:** the scoring rules are widely published and implemented
  exactly as printed, but the official form was not opened during the build. **Before launch, have
  a clinician tick each one against the official form** (the links below).

| Area | Tool | Source | Licence / permission | Status |
|---|---|---|---|---|
| Heart risk and heart age | **WHO 2019 CVD risk charts, non-laboratory model**, recalibrated for **Western Sub-Saharan Africa** (Nigeria's GBD region), calibration year 2017 as in the published charts | Kaptoge S, Pennells L, De Bacquer D, et al. (WHO CVD Risk Chart Working Group). *Lancet Glob Health* 2019;7(10):e1332–e1345. doi:10.1016/S2214-109X(19)30318-3. Coefficients and recalibration values from the authors' Stata program `whocvdrisk` (Dr Stephen Kaptoge and Dr Lisa Pennells, University of Cambridge): github.com/skkceu/stata (files `whocvdrisk_erfc_score_v03.ado` and `whocvdrisk_t10_calparms_gbd_sens0.dta`, commit b7df4aa) | The paper is open access (Lancet Global Health, CC BY licence: confirm on the article page). The model is a published scientific method. The authors' GitHub repository states no licence; we use only the published numbers, not their code. | **Verified from source.** Cross-checked against the CRAN package WHORiskCalculator 1.1.0 (MIT licence, authors include the WHO CVD Risk Chart Working Group): the West Africa values match exactly. Tests match an independent Python version to 9 decimal places, and 7 West African reference cases from WHORiskCalculator. |
| Heart age definition | "The age at which a person of the same sex with healthy risk factors has the same 10-year risk" | Poveon's definition, solved on the WHO model above | n/a | ⚠️ **Clinical sign-off needed.** WHO does not define "healthy risk factors". We use systolic BP 120 mmHg, BMI 22 and non-smoker (`HEART_AGE_REFERENCE` in `src/config/site.ts`). The WHO model was built and tested on ages 40–80. **Poveon's decision (17 Nov 2026): stretch the same formula down to age 30** (`EXTENDED_MIN_AGE` in `src/config/site.ts`), because no Nigerian outcome data exists to build a separate under-40 model. No new coefficients were invented; this is the published formula used outside its tested range. Every result that relies on ages under 40 (the person is 30–39, or their heart age comes out under 40) is labelled **"Early estimate"** on screen, in the email and on the result card. Under-30s get no heart age; over-80s show "over 80". |
| Diabetes risk | **FINDRISC** (Finnish Diabetes Risk Score) | Lindström J, Tuomilehto J. *Diabetes Care* 2003;26(3):725–731. Official form: Finnish Diabetes Association (diabetes.fi) | Free to use. The form is published openly by the Finnish Diabetes Association. Confirm any conditions for commercial use with them. | From the published literature. Note: FINDRISC was developed in Finland and hasn't been calibrated for Nigerians. If the waist isn't measured, we show the score as "at least X" rather than guessing. |
| Body | **BMI** (WHO adult classes) and **waist-to-height ratio** (≥0.5 warning, ≥0.6 high) | WHO Technical Report Series 894 (2000); Ashwell M, Gunn P, Gibson S. *Obes Rev* 2012;13:275–286; NICE guideline CG189 (2022 update) | Public guidance | From the published literature |
| Blood pressure | ≥140/90 hypertension; ≥180/110 severe | WHO *Guideline for the pharmacological treatment of hypertension in adults* (2021); Unger T, et al. *ISH 2020 Global Hypertension Practice Guidelines*, Hypertension 2020;75:1334–1357 | Public guidance | From the published literature |
| Sleep apnoea | **STOP-Bang** (gate: "Do you snore loudly?") | Chung F, et al. *Anesthesiology* 2008;108:812–821; Chung F, Abdullah HR, Liao P. *Chest* 2016;149:631–638. Official site: stopbang.ca | ⚠️ **Check before launch.** STOP-Bang is the property of the University Health Network (Toronto). It's free for clinical and research use; **ask UHN (stopbang.ca) whether a commercial service needs a licence.** | From the published literature. If someone says they don't snore, the STOP-Bang section is skipped, as you asked. |
| Sleep duration | Adults: 7 or more hours | Watson NF, et al. (AASM/SRS consensus). *Sleep* 2015;38(6):843–844 | Public guidance | From the published literature |
| Mood | **PHQ-2 → PHQ-9** (PHQ-2 ≥3 opens PHQ-9) | Kroenke K, Spitzer RL, Williams JBW. *J Gen Intern Med* 2001;16:606–613; Kroenke K, et al. *Med Care* 2003;41:1284–1292. Official: phqscreeners.com | Free. "No permission required to reproduce, translate, display or distribute" (Pfizer, on phqscreeners.com). | From the published literature. **Safety rule:** item 9 above "Not at all" immediately shows the support screen. |
| Anxiety | **GAD-2 → GAD-7** (GAD-2 ≥3 opens GAD-7) | Spitzer RL, et al. *Arch Intern Med* 2006;166:1092–1097; Kroenke K, et al. *Ann Intern Med* 2007;146:317–325 | Free (same terms as PHQ, phqscreeners.com) | From the published literature |
| Alcohol | **AUDIT-C** (gate: "Do you drink alcohol?"). Positive: men ≥4, women ≥3 | Bush K, et al. *Arch Intern Med* 1998;158:1789–1795; Bradley KA, et al. *Alcohol Clin Exp Res* 2007;31:1208–1217; WHO AUDIT manual (2001) | WHO AUDIT is free to use | From the published literature. The "standard drink" help text (about 10 g of alcohol) is our plain-English explanation; please review it. |
| Smoking | Never / former / current | n/a | n/a | n/a |
| Activity | 2 questions: FINDRISC's "30 minutes daily", and days per week of brisk activity (5+ days of 30 min meets WHO's 150 minutes) | WHO 2020 *Guidelines on physical activity and sedentary behaviour* | Public guidance | From the published literature |
| Prevention checklist (no score) | Blood pressure: USPSTF 2021 · Blood sugar from 35: ADA Standards of Care 2024 · Cervical screening from 30: WHO 2021 cervical screening guideline · Mammogram 50–69: WHO 2014 position paper · Breast awareness: WHO · Hepatitis B: WHO 2024 hepatitis B guidelines · Genotype: Nigeria FMoH *National Guideline for the Control and Management of Sickle Cell Disease* | | Public guidance | ⚠️ From the published literature. **Please have a Nigerian clinician confirm these intervals suit your service**, especially the genotype and hepatitis B wording. |

## Results wording rules (built in)

- Every card says it's **an estimate, not a diagnosis**, and names its tool.
- Status is always a **word plus an icon** ("Looking good" ✓, "Worth checking" ⚠, "Act on this" ⓘ), never colour alone.
- Every card ends with a next step: book a doctor, order a test, or check again in X months.
  (The "check again in X months" intervals are suggestions, not clinical cut-offs. Please review them.)
- How the status words map to scores: heart risk <10% / 10–<20% / ≥20% (from the WHO chart bands); FINDRISC <7 / 7–11 / ≥12;
  PHQ-9 and GAD-7 <5 / 5–9 / ≥10; STOP-Bang low / intermediate / high; BMI healthy / outside healthy range / ≥30;
  waist-to-height <0.5 / ≥0.5 / ≥0.6; blood pressure <140/90 / — / ≥140/90.
  ⚠️ These mappings are our choice of where to draw "Worth checking" versus "Act on this", so they need clinical sign-off.
