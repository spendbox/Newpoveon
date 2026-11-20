/**
 * "Learn more" pages: one per result. Plain English, practical, and sourced.
 * Advice here is general health education, not personal medical advice. Please have a clinician review
 * it before launch (listed in SCREENING_TOOLS.md).
 */
import type { IconName } from "@/components/icons";
import type { ResultCard, Status } from "@/lib/scoring/results";

export type LearnSlug = ResultCard["id"];
export type BodyArea = "mind" | "sleep" | "lungs" | "heart" | "bp" | "liver" | "sugar" | "waist" | "legs";

export interface LearnTopic {
  slug: LearnSlug;
  title: string;
  area: BodyArea;
  icon: IconName;
  tagline: string;
  whatItIs: string;
  whyItMatters: string[];
  howWeCheck: { tool: string; detail: string; source: string };
  bands: { label: string; range: string; status: Status; meaning: string }[];
  improve: { title: string; text: string }[];
  seeDoctor: string[];
  /** Shown in red: go to hospital or call 112. */
  urgent?: string;
  consult: string;
  consultLabel: string;
  test: { name: string; why: string } | null;
  related: LearnSlug[];
}

export const LEARN: Record<LearnSlug, LearnTopic> = {
  wellbeing: {
    slug: "wellbeing", title: "Wellbeing", area: "mind", icon: "sun",
    tagline: "How you've really been feeling lately, as a score out of 100.",
    whatItIs: "Your wellbeing score shows how good you've felt over the last two weeks: cheerful, calm, energetic, rested and interested in life. It's the simplest way to keep an eye on your mental health over time, the same way blood pressure keeps an eye on your heart.",
    whyItMatters: [
      "A low wellbeing score is often the first sign of stress, burnout or depression, before people notice it themselves.",
      "How you feel affects your body too: sleep, appetite, blood pressure and how well you look after yourself.",
      "It's easy to improve, and you'll see the change when you check again.",
    ],
    howWeCheck: { tool: "WHO-5 Well-Being Index", detail: "Five questions about the last two weeks, each scored 0 to 5. The total is multiplied by 4 to give a score from 0 to 100.", source: "WHO Regional Office for Europe (1998); Topp CW, et al. Psychother Psychosom 2015;84:167–176." },
    bands: [
      { label: "Good", range: "51 to 100", status: "good", meaning: "You've felt well most of the time." },
      { label: "Low", range: "29 to 50", status: "check", meaning: "Lower than it should be. Worth looking at what's draining you." },
      { label: "Very low", range: "0 to 28", status: "act", meaning: "Often a sign of depression. Please talk to a doctor." },
    ],
    improve: [
      { title: "Move every day", text: "A 20 to 30 minute brisk walk lifts mood almost as reliably as anything else. Outdoors in daylight is even better." },
      { title: "Protect your sleep", text: "Go to bed and get up at the same time, even at weekends. Most adults need 7 to 9 hours." },
      { title: "See people", text: "Call a friend, visit family, go to your place of worship or a group you enjoy. Connection is one of the strongest protectors of wellbeing." },
      { title: "Do one thing you enjoy, daily", text: "Music, cooking, a hobby, time with children. Small, regular pleasures add up." },
      { title: "Go easy on alcohol", text: "It feels relaxing at first but worsens mood and sleep over the following days." },
      { title: "Say it out loud", text: "Telling someone you trust how you feel takes some of the weight off. Our doctors are always happy to listen." },
    ],
    seeDoctor: ["Your score is 50 or below for more than two weeks", "You've lost interest in things you used to enjoy", "Low mood is affecting your work, family or sleep"],
    urgent: "If you've had thoughts of harming yourself, please talk to someone today. Call 112 or go to the nearest hospital.",
    consult: "mental-health", consultLabel: "Talk to a doctor about how you feel",
    test: { name: "Full blood count and thyroid test (TSH)", why: "If you're also tired all the time, anaemia or an underactive thyroid can be the cause." },
    related: ["mood", "anxiety", "sleep"],
  },
  heart: {
    slug: "heart", title: "Heart age", area: "heart", icon: "heart",
    tagline: "How old your heart and blood vessels act, compared with your real age.",
    whatItIs: "Heart age compares your chance of a heart attack or stroke in the next 10 years with someone the same sex whose blood pressure, weight and smoking are all healthy. If your heart age is higher than your real age, your heart is under more strain than it should be.",
    whyItMatters: [
      "Heart disease and stroke are among the leading causes of death in Nigeria, and many happen to people in their 40s and 50s.",
      "Most of the risk comes from things you can change: blood pressure, smoking, weight and activity.",
      "Bringing your heart age down lowers your real risk, and it can move within months.",
    ],
    howWeCheck: { tool: "WHO 2019 cardiovascular risk charts (non-laboratory model, West Africa)", detail: "Uses your age, sex, blood pressure, BMI and smoking. Heart age is calculated from age 30; under 40 it's an early estimate.", source: "Kaptoge S, et al. (WHO CVD Risk Chart Working Group). Lancet Glob Health 2019;7:e1332–e1345." },
    bands: [
      { label: "Lower risk", range: "Under 10% in 10 years", status: "good", meaning: "Keep doing what you're doing and check every year." },
      { label: "Raised risk", range: "10% to under 20%", status: "check", meaning: "Time to act on blood pressure, weight or smoking. A doctor can help you plan." },
      { label: "High risk", range: "20% or more", status: "act", meaning: "Please see a doctor soon. Treatment really does lower this." },
    ],
    improve: [
      { title: "Know your blood pressure", text: "It's the biggest single driver of heart risk in Nigeria. Get it measured at least once a year." },
      { title: "Stop smoking", text: "Within a year of stopping, your risk of heart disease is about half that of someone who still smokes (WHO)." },
      { title: "Cut down on salt", text: "WHO advises under 5 g a day, about one level teaspoon in total. Seasoning cubes, salted fish and instant noodles add a lot." },
      { title: "Move 150 minutes a week", text: "Brisk walking for 30 minutes on 5 days is enough to make a difference." },
      { title: "Eat more vegetables, fruit and beans", text: "Aim for vegetables with every meal and fruit as your snack." },
      { title: "Take your medicines", text: "If you're on blood pressure or cholesterol tablets, take them every day, even when you feel well." },
    ],
    seeDoctor: ["Your 10-year risk is 10% or more", "Your heart age is several years above your real age", "You get chest tightness or breathlessness when you walk or climb stairs"],
    urgent: "Chest pain lasting more than a few minutes, or a sudden drooping face, weak arm or slurred speech: call 112 or go to hospital now.",
    consult: "condition-review", consultLabel: "Review my heart health with a doctor",
    test: { name: "Cholesterol (lipid profile)", why: "Cholesterol isn't in the questionnaire, so a blood test makes your heart picture complete." },
    related: ["bp", "smoking", "activity"],
  },
  bp: {
    slug: "bp", title: "Blood pressure", area: "bp", icon: "gauge",
    tagline: "The pressure of blood against your artery walls. High blood pressure has no symptoms.",
    whatItIs: "A blood pressure reading has two numbers, like 120/80. The top (systolic) is the pressure when your heart beats; the bottom (diastolic) is the pressure between beats. High blood pressure slowly damages the heart, brain, kidneys and eyes, usually without any warning signs.",
    whyItMatters: [
      "About 1 in 3 Nigerian adults has high blood pressure, and many don't know it.",
      "It's the leading cause of stroke, and a major cause of heart and kidney failure.",
      "It's easy to check and very treatable. Getting it under control cuts stroke risk sharply.",
    ],
    howWeCheck: { tool: "Your last reading, checked against WHO and ISH thresholds", detail: "140/90 or higher is high blood pressure. 180/110 or higher is severe. One reading isn't enough to diagnose; it needs repeating.", source: "WHO Guideline for the pharmacological treatment of hypertension in adults (2021); Unger T, et al. ISH 2020 Global Hypertension Practice Guidelines." },
    bands: [
      { label: "Normal", range: "Under 140/90", status: "good", meaning: "Check again every year (more often if you're over 40 or overweight)." },
      { label: "High", range: "140/90 or higher", status: "check", meaning: "Recheck within a few weeks. If it stays high, a doctor can start treatment." },
      { label: "Severe", range: "180/110 or higher", status: "act", meaning: "See a doctor within days, or urgently if you have symptoms." },
    ],
    improve: [
      { title: "Halve the salt", text: "Cook with less salt and fewer seasoning cubes, and avoid adding salt at the table. Taste buds adjust in about 3 weeks." },
      { title: "Eat potassium-rich foods", text: "Vegetables, beans, plantain, bananas, oranges and pawpaw help balance salt (unless a doctor has told you to limit potassium)." },
      { title: "Move most days", text: "Regular brisk activity can lower blood pressure by around 5 points." },
      { title: "Lose a little weight", text: "Each kilo lost lowers blood pressure by about 1 point." },
      { title: "Limit alcohol and stop smoking", text: "Both push blood pressure up." },
      { title: "Take tablets every day", text: "Blood pressure medicine only works while you take it. Don't stop because you feel fine." },
    ],
    seeDoctor: ["Two readings of 140/90 or higher on different days", "You're on treatment but readings are still high", "You're pregnant and your reading is high"],
    urgent: "180/110 or higher with a bad headache, chest pain, breathlessness, blurred vision, confusion or weakness: go to hospital now or call 112.",
    consult: "condition-review", consultLabel: "Talk to a doctor about my blood pressure",
    test: { name: "Home blood pressure check", why: "We come to you and take a proper reading, so you know your real numbers." },
    related: ["heart", "body", "alcohol"],
  },
  diabetes: {
    slug: "diabetes", title: "Diabetes risk", area: "sugar", icon: "drop",
    tagline: "Your chance of developing type 2 diabetes in the next 10 years.",
    whatItIs: "Type 2 diabetes is when your body can't control blood sugar properly. It develops slowly over years, often without symptoms. Your risk score shows how likely you are to develop it in the next 10 years, based on things like age, waist size, activity, diet and family history.",
    whyItMatters: [
      "Diabetes is rising fast in Nigeria, and around half of people who have it don't know yet.",
      "Untreated, high blood sugar damages the eyes, kidneys, nerves, feet and heart.",
      "Type 2 diabetes can often be prevented or delayed with lifestyle changes, even in people at high risk.",
    ],
    howWeCheck: { tool: "FINDRISC (Finnish Diabetes Risk Score)", detail: "Eight questions, scored 0 to 26. If you skip your waist size, we show your score as 'at least' a number.", source: "Lindström J, Tuomilehto J. Diabetes Care 2003;26:725–731." },
    bands: [
      { label: "Low", range: "Under 7", status: "good", meaning: "About 1 in 100 people with this score get diabetes in 10 years." },
      { label: "Slightly raised", range: "7 to 11", status: "check", meaning: "About 1 in 25. A good time to make small changes." },
      { label: "Moderate", range: "12 to 14", status: "act", meaning: "About 1 in 6. Get a blood sugar test." },
      { label: "High", range: "15 to 20", status: "act", meaning: "About 1 in 3. Get tested and talk to a doctor." },
      { label: "Very high", range: "Over 20", status: "act", meaning: "About 1 in 2. Please get tested soon." },
    ],
    improve: [
      { title: "Lose 5 to 7% of your weight", text: "For someone weighing 90 kg, that's about 5 to 6 kg. In a major US trial this cut the chance of diabetes by more than half (Knowler WC, et al. NEJM 2002)." },
      { title: "Swap sugary drinks", text: "Soft drinks, malt drinks, sweetened juices and sweet tea are the quickest wins. Choose water or zobo without sugar." },
      { title: "Smaller portions of starch", text: "Have a smaller portion of eba, fufu, pounded yam or white rice, and fill half your plate with vegetables and soup." },
      { title: "Move 150 minutes a week", text: "Muscles use sugar when they work, so activity lowers blood sugar directly." },
      { title: "Choose whole grains", text: "Brown rice, oats, unripe plantain and beans release sugar slowly." },
      { title: "Get tested regularly", text: "A simple HbA1c or fasting blood sugar test shows where you are now." },
    ],
    seeDoctor: ["Your score is 12 or higher", "You're very thirsty, pass urine often, or have lost weight without trying", "You have blurred vision, tingling feet or cuts that heal slowly"],
    consult: "results-review", consultLabel: "Talk to a doctor about my diabetes risk",
    test: { name: "HbA1c (3-month blood sugar average)", why: "It shows whether your blood sugar is normal, raised (pre-diabetes) or in the diabetes range." },
    related: ["body", "activity", "heart"],
  },
  body: {
    slug: "body", title: "Weight and waist", area: "waist", icon: "scale",
    tagline: "Your BMI, and how much weight you carry around your middle.",
    whatItIs: "BMI (body mass index) compares your weight with your height. Your waist-to-height ratio shows how much fat sits around your middle, which matters even more for health. Ideally, your waist should be less than half your height.",
    whyItMatters: [
      "Extra weight around the middle raises the risk of diabetes, high blood pressure, heart disease and some cancers.",
      "BMI doesn't see muscle versus fat, which is why we also look at your waist.",
      "Losing even 5 to 10% of your weight brings real health benefits.",
    ],
    howWeCheck: { tool: "BMI (WHO adult classes) and waist-to-height ratio", detail: "BMI = weight in kg ÷ (height in m)². Waist-to-height = waist ÷ height.", source: "WHO Technical Report Series 894 (2000); Ashwell M, et al. Obes Rev 2012;13:275–286; NICE CG189." },
    bands: [
      { label: "Healthy", range: "BMI 18.5 to 24.9 · waist under half your height", status: "good", meaning: "Keep it steady." },
      { label: "Above healthy", range: "BMI 25 to 29.9 · or waist half your height or more", status: "check", meaning: "Small, steady changes help." },
      { label: "High", range: "BMI 30+ · or waist 0.6 × height or more", status: "act", meaning: "Worth getting support. A doctor can check blood sugar and pressure too." },
      { label: "Underweight", range: "BMI under 18.5", status: "check", meaning: "Worth checking why with a doctor." },
    ],
    improve: [
      { title: "Aim for slow and steady", text: "Half a kilo to a kilo a week is realistic and more likely to stay off than crash dieting." },
      { title: "Fill up on vegetables and protein", text: "Beans, fish, eggs, chicken and vegetable soups keep you full for longer than starch." },
      { title: "Cut liquid sugar", text: "Sugary drinks add a lot of calories without filling you up." },
      { title: "Watch late, large meals", text: "Eating your biggest meal late at night makes weight harder to manage for many people." },
      { title: "Sleep 7 hours or more", text: "Short sleep increases hunger hormones and cravings." },
      { title: "Move more, sit less", text: "Walking, dancing and housework all count. Add some strength work twice a week." },
    ],
    seeDoctor: ["Your BMI is 30 or more, or your waist is 0.6 × your height or more", "You've lost weight without trying", "You've tried to lose weight and want medical support"],
    consult: "weight", consultLabel: "Get support with my weight",
    test: { name: "Blood sugar (HbA1c) and cholesterol", why: "Extra weight can quietly raise both, so it's worth knowing your numbers." },
    related: ["diabetes", "activity", "bp"],
  },
  sleep: {
    slug: "sleep", title: "Sleep and snoring", area: "sleep", icon: "moon",
    tagline: "How long you sleep, and whether snoring could mean sleep apnoea.",
    whatItIs: "Adults need at least 7 hours of sleep a night. Loud snoring with pauses in breathing can be a sign of obstructive sleep apnoea, where the airway keeps closing during sleep. It's common, under-diagnosed and treatable.",
    whyItMatters: [
      "Regular short sleep raises the risk of high blood pressure, weight gain, diabetes and low mood.",
      "Untreated sleep apnoea strains the heart and makes people dangerously drowsy, including while driving.",
      "Better sleep improves energy, focus and wellbeing within weeks.",
    ],
    howWeCheck: { tool: "Sleep hours (AASM/SRS) and STOP-Bang", detail: "We ask how long you sleep. If you snore, we use the STOP-Bang questions to estimate your sleep apnoea risk (low, intermediate or high).", source: "Watson NF, et al. Sleep 2015;38:843–844; Chung F, et al. Anesthesiology 2008;108:812–821; Chest 2016;149:631–638." },
    bands: [
      { label: "Good", range: "7+ hours, low apnoea risk", status: "good", meaning: "Keep your routine." },
      { label: "Worth checking", range: "Under 7 hours, or intermediate risk", status: "check", meaning: "Try the tips below for a few weeks." },
      { label: "Act on this", range: "High sleep apnoea risk", status: "act", meaning: "See a doctor. A sleep study can confirm it." },
    ],
    improve: [
      { title: "Keep regular times", text: "Same bedtime and wake time every day, including weekends." },
      { title: "Make the room dark, cool and quiet", text: "Use curtains, a fan, and keep the TV out of the bedroom if you can." },
      { title: "Screens off an hour before bed", text: "Phone light and scrolling keep the brain alert." },
      { title: "Cut caffeine after 2 pm", text: "Coffee, tea, kola nut, energy drinks and some soft drinks can keep you awake for hours." },
      { title: "Avoid alcohol before bed", text: "It worsens snoring and breaks up deep sleep." },
      { title: "Sleep on your side", text: "This reduces snoring for many people. Losing weight helps too." },
    ],
    seeDoctor: ["You snore loudly and feel sleepy in the day", "Someone has seen you stop breathing or gasp in your sleep", "You struggle to sleep most nights for more than a month"],
    urgent: "If you've nodded off while driving, please don't drive until you've seen a doctor.",
    consult: "new-symptom", consultLabel: "Talk to a doctor about my sleep",
    test: null,
    related: ["wellbeing", "body", "alcohol"],
  },
  mood: {
    slug: "mood", title: "Mood", area: "mind", icon: "sun",
    tagline: "Whether low mood or depression might be affecting you.",
    whatItIs: "Everyone feels down sometimes. Depression is when low mood, loss of interest and tiredness last for two weeks or more and get in the way of daily life. It's a common health condition, not a weakness, and it gets better with the right support.",
    whyItMatters: [
      "Depression affects sleep, appetite, energy, work and relationships.",
      "It often goes unspoken, especially among men and busy parents.",
      "Talking therapies and, when needed, medicines work well. Most people feel better within weeks to months.",
    ],
    howWeCheck: { tool: "PHQ-2, then PHQ-9", detail: "Two questions first. If either suggests low mood, we ask seven more. The PHQ-9 is scored 0 to 27.", source: "Kroenke K, et al. J Gen Intern Med 2001;16:606–613; Med Care 2003;41:1284–1292." },
    bands: [
      { label: "Doing OK", range: "0 to 4", status: "good", meaning: "No sign of depression right now." },
      { label: "A little low", range: "5 to 9", status: "check", meaning: "Keep an eye on it and try the tips below." },
      { label: "Low mood", range: "10 or more", status: "act", meaning: "Please talk to a doctor. Help works." },
    ],
    improve: [
      { title: "Keep a simple routine", text: "Get up, wash, dress and eat at regular times, even on hard days." },
      { title: "Move a little", text: "A short walk outside counts. Movement is a proven mood lifter." },
      { title: "Break tasks down", text: "Pick one small thing to do today and tick it off." },
      { title: "Stay connected", text: "Spend time with people who are good for you, even if you don't feel like it." },
      { title: "Limit alcohol", text: "Alcohol deepens low mood over the following days." },
      { title: "Talk to someone", text: "A friend, a faith leader, or one of our doctors. You don't have to carry it alone." },
    ],
    seeDoctor: ["Your score is 10 or more", "Low mood has lasted more than two weeks", "You're struggling to work, sleep or care for yourself or others"],
    urgent: "If you're thinking about harming yourself or that you'd be better off dead, please talk to someone now. Call 112 or go to the nearest hospital.",
    consult: "mental-health", consultLabel: "Talk to a doctor in confidence",
    test: null,
    related: ["wellbeing", "anxiety", "sleep"],
  },
  anxiety: {
    slug: "anxiety", title: "Worry and anxiety", area: "mind", icon: "mind",
    tagline: "Whether worry or anxiety is taking up too much of your life.",
    whatItIs: "Some worry is normal. Anxiety becomes a problem when it's hard to control, lasts weeks, and shows up in your body: a racing heart, tense muscles, poor sleep, or feeling on edge. It's very common and very treatable.",
    whyItMatters: [
      "Ongoing anxiety affects sleep, concentration, blood pressure and relationships.",
      "Many people live with it for years before getting help.",
      "Simple techniques and talking therapies make a real difference.",
    ],
    howWeCheck: { tool: "GAD-2, then GAD-7", detail: "Two questions first. If either suggests anxiety, we ask five more. The GAD-7 is scored 0 to 21.", source: "Spitzer RL, et al. Arch Intern Med 2006;166:1092–1097; Kroenke K, et al. Ann Intern Med 2007;146:317–325." },
    bands: [
      { label: "Mostly calm", range: "0 to 4", status: "good", meaning: "No sign of an anxiety problem right now." },
      { label: "Some worry", range: "5 to 9", status: "check", meaning: "Try the tips below and check again in a few weeks." },
      { label: "A lot of worry", range: "10 or more", status: "act", meaning: "A doctor can help. You don't have to live with this." },
    ],
    improve: [
      { title: "Slow your breathing", text: "Breathe in for 4 counts and out for 6, for two minutes. It calms the body's alarm system." },
      { title: "Cut back on caffeine", text: "Coffee, energy drinks and kola nut can make anxiety feel worse." },
      { title: "Set a 'worry time'", text: "Write worries down and look at them at a set time each day, instead of all day." },
      { title: "Keep moving", text: "Regular activity burns off stress hormones." },
      { title: "Protect your sleep", text: "Tired brains worry more." },
      { title: "Talk it through", text: "Saying worries out loud to someone you trust, or a doctor, makes them smaller." },
    ],
    seeDoctor: ["Your score is 10 or more", "Worry is stopping you from working, sleeping or going out", "You have panic attacks"],
    urgent: "Chest pain or sudden breathlessness should always be checked urgently, even if you think it's anxiety. Call 112 or go to hospital.",
    consult: "mental-health", consultLabel: "Talk to a doctor in confidence",
    test: null,
    related: ["wellbeing", "mood", "sleep"],
  },
  alcohol: {
    slug: "alcohol", title: "Alcohol", area: "liver", icon: "glass",
    tagline: "Whether your drinking is within safer limits.",
    whatItIs: "Alcohol affects almost every part of the body, especially the liver, heart, brain and blood pressure. There's no completely safe level, but the less you drink, the lower your risk. A 'standard drink' is about 10 g of alcohol: a large 600 ml bottle of beer is about 2 to 3 standard drinks, and a large stout is more.",
    whyItMatters: [
      "Regular heavy drinking raises blood pressure and damages the liver, often without symptoms until late.",
      "It worsens sleep, mood, weight and blood sugar.",
      "Cutting down brings benefits within weeks.",
    ],
    howWeCheck: { tool: "AUDIT-C", detail: "Three questions about how often and how much you drink. Scored 0 to 12. A score of 4 or more for men, or 3 or more for women, is above safer limits.", source: "Bush K, et al. Arch Intern Med 1998;158:1789–1795; Bradley KA, et al. Alcohol Clin Exp Res 2007;31:1208–1217." },
    bands: [
      { label: "Within safer limits", range: "Men under 4 · women under 3", status: "good", meaning: "Keep it that way." },
      { label: "Above safer limits", range: "Men 4+ · women 3+", status: "check", meaning: "Cutting down will help your liver, heart and sleep." },
    ],
    improve: [
      { title: "Have alcohol-free days", text: "Aim for several days a week with no alcohol at all." },
      { title: "Avoid big sessions", text: "Six or more drinks in one go is the most harmful pattern." },
      { title: "Choose smaller and lighter", text: "Smaller bottles and lower-strength drinks make a big difference." },
      { title: "Alternate with water", text: "One glass of water between each drink slows you down." },
      { title: "Plan ahead", text: "Decide how much you'll drink before you go out, and tell a friend." },
    ],
    seeDoctor: ["Your score is above safer limits and you'd like help cutting down", "You need a drink in the morning, or find it hard to stop", "You've had yellow eyes, a swollen belly or vomited blood"],
    urgent: "If you drink heavily every day, don't stop suddenly on your own. Withdrawal can be dangerous; a doctor can help you stop safely.",
    consult: "quick-question", consultLabel: "Get confidential support",
    test: { name: "Liver function test (LFT)", why: "It shows whether alcohol is affecting your liver." },
    related: ["bp", "sleep", "mood"],
  },
  smoking: {
    slug: "smoking", title: "Smoking", area: "lungs", icon: "smoke",
    tagline: "Tobacco in any form, and how to stop.",
    whatItIs: "Cigarettes, shisha, snuff and chewing tobacco all damage your heart, lungs and blood vessels. Stopping is the single best thing a smoker can do for their health, at any age.",
    whyItMatters: [
      "Smoking roughly doubles the risk of heart attack and stroke, and causes most lung cancer.",
      "Shisha is not safer: one session can mean as much smoke as many cigarettes.",
      "The body starts to recover within hours of your last cigarette.",
    ],
    howWeCheck: { tool: "Your smoking status", detail: "Never, former or current smoker. Current smoking also feeds into your heart age.", source: "WHO tobacco fact sheet; WHO 2019 CVD risk charts." },
    bands: [
      { label: "Smoke-free", range: "Never or former smoker", status: "good", meaning: "Your heart risk keeps falling the longer you stay smoke-free." },
      { label: "Smoking", range: "Current smoker", status: "act", meaning: "Quitting is the biggest health win available to you." },
    ],
    improve: [
      { title: "Set a quit date", text: "Pick a day in the next two weeks and tell people around you." },
      { title: "Get support", text: "Stop-smoking medicines and nicotine replacement can double your chances of quitting. A doctor can advise which suits you." },
      { title: "Know your triggers", text: "Tea, alcohol, stress or friends who smoke. Plan what you'll do instead." },
      { title: "Ride out cravings", text: "Cravings peak and pass in a few minutes. Drink water, walk or chew gum." },
      { title: "Remember the timeline", text: "WHO: within 20 minutes heart rate drops; within a year heart disease risk is about half that of a smoker." },
    ],
    seeDoctor: ["You want help to quit", "You have a cough that has lasted more than 3 weeks", "You're breathless doing things that used to be easy"],
    urgent: "Coughing up blood or chest pain: see a doctor urgently.",
    consult: "quick-question", consultLabel: "Get help to quit",
    test: null,
    related: ["heart", "bp", "activity"],
  },
  activity: {
    slug: "activity", title: "Moving more", area: "legs", icon: "run",
    tagline: "Whether you're getting enough activity for good health.",
    whatItIs: "WHO recommends at least 150 minutes of moderate activity a week (like brisk walking, where you breathe faster but can still talk), plus muscle-strengthening on 2 days. Everything counts: walking to the market, dancing, cleaning and climbing stairs.",
    whyItMatters: [
      "Regular activity lowers the risk of heart disease, stroke, diabetes, some cancers and depression.",
      "It helps control weight, blood pressure and blood sugar.",
      "It improves sleep, mood and energy, often within the first few weeks.",
    ],
    howWeCheck: { tool: "WHO 2020 physical activity guidelines", detail: "We ask how many days a week you move briskly for 30 minutes or more. Five days or more meets the goal.", source: "WHO Guidelines on physical activity and sedentary behaviour (2020)." },
    bands: [
      { label: "Active", range: "5+ days a week", status: "good", meaning: "You're meeting the WHO goal." },
      { label: "Room to move more", range: "Under 5 days a week", status: "check", meaning: "Build up slowly. Some is better than none." },
    ],
    improve: [
      { title: "Start with 10 minutes", text: "Three 10-minute brisk walks a day count just as much as one 30-minute walk." },
      { title: "Build it into your day", text: "Get off the bus a stop early, take the stairs, walk while on phone calls." },
      { title: "Find something you enjoy", text: "Dancing, football, aerobics at church or a walking group. You'll stick with it." },
      { title: "Break up sitting", text: "Stand up and move for a few minutes every hour." },
      { title: "Add strength twice a week", text: "Squats, push-ups against a wall, carrying shopping. Strong muscles help blood sugar and joints." },
    ],
    seeDoctor: ["You get chest pain, dizziness or unusual breathlessness when active", "You have a heart condition and want to start exercising safely"],
    consult: "quick-question", consultLabel: "Ask a doctor about getting active",
    test: null,
    related: ["heart", "diabetes", "body"],
  },
};

export const LEARN_ORDER: LearnSlug[] = ["wellbeing", "heart", "bp", "diabetes", "body", "sleep", "mood", "anxiety", "alcohol", "smoking", "activity"];
