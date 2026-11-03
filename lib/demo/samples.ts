import { AnalysisSchema, type Analysis } from "@/lib/schemas/analysis";

/**
 * Demo documents are FICTIONAL. Their "analysis" is a hand-written reference result,
 * shown only in demo mode and always labelled as a sample, never as live AI output.
 */
export type DemoSample = {
  id: string;
  title: string;
  kind: "scholarship" | "internship" | "hackathon";
  blurb: string;
  /** What this sample is designed to test. */
  tests: string;
  text: string;
  analysis: Analysis;
};

const scholarshipText = `[Page 1]
NORTHBRIDGE FOUNDATION — FUTURE ENGINEERS SCHOLARSHIP 2027
The Northbridge Foundation supports talented undergraduate students in engineering and computer science.

ELIGIBILITY
Applicants must be enrolled full-time in an undergraduate degree in engineering or computer science.
Applicants must have a cumulative GPA of at least 3.2 out of 4.0.
Applicants must be citizens or permanent residents of a South Asian country.
Preference will be given to students who have completed community service.

[Page 2]
REQUIRED DOCUMENTS
1. Official transcript from your university.
2. A one-page statement of purpose.
3. Two letters of recommendation, at least one from a faculty member.
4. A copy of your national ID or passport.

HOW TO APPLY
Submit all documents through the online portal. Incomplete applications will not be reviewed.

DEADLINE
Applications close at the end of March.

SELECTION
Shortlisted candidates will be interviewed online. Awards are announced in May.
There is no application fee.`;

const internshipText = `[Page 1]
BRIGHTLEAF ANALYTICS — SUMMER DATA INTERN PROGRAM
Join our data team for a 10-week paid summer internship.

WHO CAN APPLY
We are looking for students currently pursuing a degree in statistics, mathematics, computer science or a related field.
Experience with Python or SQL is required.
Knowledge of dashboard tools such as Tableau is a plus.

[Page 2]
WHAT TO SUBMIT
Please send your CV and a short cover letter to careers@brightleaf.example.
Your CV should include links to any projects you have worked on.

TIMELINE
Applications close on 15 February 2027 at 11:59 PM.
Interviews take place during the first two weeks of March.`;

const hackathonText = `[Page 1]
CAMPUS BUILD WEEKEND 2026 — 48-HOUR HACKATHON
Build something useful for your campus in 48 hours.

ELIGIBILITY
Open to all students aged 18 or older.
Teams of 2 to 4 participants. Solo applications are not accepted.

[Page 2]
REGISTRATION
Register your team at campusbuild.example/register.
Registration closes on 5 November 2026 at 6:00 PM PKT.
The event runs 14-15 November 2026.

SUBMISSION
Submit your project repository link and a 2-minute demo video before the final presentation.
Participation is free.`;

function make(a: unknown): Analysis {
  return AnalysisSchema.parse(a);
}

const scholarshipAnalysis = make({
  opportunity: {
    name: "Future Engineers Scholarship 2027",
    type: "scholarship",
    organizer: "Northbridge Foundation",
    summary: {
      en: "A scholarship for full-time undergraduate engineering or computer science students from South Asia.",
      ur: "Yeh scholarship South Asia ke full-time undergraduate engineering ya computer science students ke liye hai.",
    },
  },
  dates: [
    {
      label: "closes",
      originalText: "Applications close at the end of March.",
      normalizedISO: null,
      timezone: null,
      status: "ambiguous",
      note: "No year, no exact day and no time zone are given. Check the portal for the exact closing date and time.",
      evidence: { quote: "Applications close at the end of March.", page: 2 },
    },
    {
      label: "other",
      originalText: "Awards are announced in May.",
      normalizedISO: null,
      timezone: null,
      status: "ambiguous",
      note: "Only the month is given.",
      evidence: { quote: "Awards are announced in May.", page: 2 },
    },
  ],
  eligibility: [
    {
      id: "e1",
      category: "academic",
      requirement: "Enrolled full-time in an undergraduate engineering or computer science degree",
      mandatory: true,
      basis: "explicit",
      evidence: {
        quote:
          "Applicants must be enrolled full-time in an undergraduate degree in engineering or computer science.",
        page: 1,
      },
      explanation: {
        en: "You must currently be a full-time undergraduate student, and your degree must be in engineering or computer science.",
        ur: "Aap ko abhi full-time undergraduate student hona chahiye, aur degree engineering ya computer science mein honi chahiye.",
      },
    },
    {
      id: "e2",
      category: "academic",
      requirement: "Cumulative GPA of at least 3.2 / 4.0",
      mandatory: true,
      basis: "explicit",
      evidence: {
        quote: "Applicants must have a cumulative GPA of at least 3.2 out of 4.0.",
        page: 1,
      },
      explanation: {
        en: "Your overall GPA across all semesters must be 3.2 or higher on a 4.0 scale. The document does not say how to convert other grading scales.",
        ur: "Aap ka overall GPA 4.0 scale par 3.2 ya us se zyada hona chahiye. Document nahi batata ke doosre grading scales kaise convert honge.",
      },
    },
    {
      id: "e3",
      category: "nationality",
      requirement: "Citizen or permanent resident of a South Asian country",
      mandatory: true,
      basis: "explicit",
      evidence: {
        quote: "Applicants must be citizens or permanent residents of a South Asian country.",
        page: 1,
      },
      explanation: {
        en: "You need citizenship or permanent residency in a South Asian country. The document does not list which countries count.",
        ur: "Aap ke paas kisi South Asian mulk ki citizenship ya permanent residency honi chahiye. Document mulkon ki list nahi deta.",
      },
    },
    {
      id: "e4",
      category: "experience",
      requirement: "Community service experience (preferred)",
      mandatory: false,
      basis: "explicit",
      evidence: {
        quote: "Preference will be given to students who have completed community service.",
        page: 1,
      },
      explanation: {
        en: "Not required, but it improves your chances. The document does not say how much service counts.",
        ur: "Zaroori nahi, lekin is se chances behtar hote hain. Document nahi batata kitni community service gina jayega.",
      },
    },
  ],
  requiredDocuments: [
    {
      id: "d1",
      name: "Official transcript",
      mandatory: true,
      basis: "explicit",
      evidence: { quote: "Official transcript from your university.", page: 2 },
      explanation: {
        en: "Request this from your university's records office. 'Official' usually means stamped or sent directly by the university.",
        ur: "Yeh apni university ke records office se mangwayen. 'Official' ka matlab aam taur par stamped ya university ki taraf se direct bheja gaya hota hai.",
      },
    },
    {
      id: "d2",
      name: "One-page statement of purpose",
      mandatory: true,
      basis: "explicit",
      evidence: { quote: "A one-page statement of purpose.", page: 2 },
      explanation: {
        en: "A short essay (one page) about why you want this scholarship and your goals.",
        ur: "Ek page ka mukhtasar mazmoon jis mein likhein ke aap yeh scholarship kyun chahte hain aur aap ke maqasid kya hain.",
      },
    },
    {
      id: "d3",
      name: "Two letters of recommendation (one from faculty)",
      mandatory: true,
      basis: "explicit",
      evidence: {
        quote: "Two letters of recommendation, at least one from a faculty member.",
        page: 2,
      },
      explanation: {
        en: "Ask two people to write letters for you; at least one must be a teacher at your university. Ask early.",
        ur: "Do logon se letters likhwayen; kam az kam ek aap ki university ka ustaad hona chahiye. Jaldi poochein.",
      },
    },
    {
      id: "d4",
      name: "National ID or passport copy",
      mandatory: true,
      basis: "explicit",
      evidence: { quote: "A copy of your national ID or passport.", page: 2 },
      explanation: {
        en: "A scan or photo of either document.",
        ur: "In mein se kisi ek document ka scan ya photo.",
      },
    },
  ],
  submissionInstructions: [
    {
      step: "Submit all documents through the online portal.",
      evidence: { quote: "Submit all documents through the online portal.", page: 2 },
    },
    {
      step: "Incomplete applications will not be reviewed.",
      evidence: { quote: "Incomplete applications will not be reviewed.", page: 2 },
    },
  ],
  fees: {
    text: "No application fee.",
    evidence: { quote: "There is no application fee.", page: 2 },
  },
  selectionProcess: [
    {
      step: "Shortlisted candidates are interviewed online.",
      evidence: { quote: "Shortlisted candidates will be interviewed online.", page: 2 },
    },
  ],
  links: [],
  unresolved: [
    "The exact closing date, year and time zone are not stated.",
    "The portal address is not given in this document.",
    "It is not stated which countries count as 'South Asian'.",
  ],
});

const internshipAnalysis = make({
  opportunity: {
    name: "Summer Data Intern Program",
    type: "internship",
    organizer: "Brightleaf Analytics",
    summary: {
      en: "A 10-week paid summer internship on a data team, for students in statistics, maths, computer science or related fields.",
      ur: "Data team mein 10 hafton ki paid summer internship, statistics, maths, computer science ya mutaliqa fields ke students ke liye.",
    },
  },
  dates: [
    {
      label: "closes",
      originalText: "Applications close on 15 February 2027 at 11:59 PM.",
      normalizedISO: null,
      timezone: null,
      status: "ambiguous",
      note: "Date and time are clear, but no time zone is given, so the exact moment of closing is uncertain.",
      evidence: {
        quote: "Applications close on 15 February 2027 at 11:59 PM.",
        page: 2,
      },
    },
  ],
  eligibility: [
    {
      id: "e1",
      category: "academic",
      requirement: "Currently pursuing a degree in statistics, mathematics, computer science or a related field",
      mandatory: true,
      basis: "explicit",
      evidence: {
        quote:
          "students currently pursuing a degree in statistics, mathematics, computer science or a related field.",
        page: 1,
      },
      explanation: {
        en: "You must be a current student. 'Related field' is not defined, so ask if your degree is close but not listed.",
        ur: "Aap ka abhi student hona zaroori hai. 'Related field' define nahi, is liye agar aap ki degree milti-julti hai to poochh lein.",
      },
    },
    {
      id: "e2",
      category: "experience",
      requirement: "Experience with Python or SQL",
      mandatory: true,
      basis: "explicit",
      evidence: { quote: "Experience with Python or SQL is required.", page: 1 },
      explanation: {
        en: "You need hands-on experience with at least one of them. Projects in your CV can show this.",
        ur: "In mein se kam az kam ek ka amali tajurba chahiye. CV mein projects is ko dikha sakte hain.",
      },
    },
    {
      id: "e3",
      category: "experience",
      requirement: "Dashboard tools such as Tableau (a plus)",
      mandatory: false,
      basis: "explicit",
      evidence: { quote: "Knowledge of dashboard tools such as Tableau is a plus.", page: 1 },
      explanation: {
        en: "Optional; it can make your application stronger.",
        ur: "Ikhtiyari hai; is se aap ki application mazboot ho sakti hai.",
      },
    },
    {
      id: "e4",
      category: "location",
      requirement: "Work location / right to work",
      mandatory: true,
      basis: "needs_verification",
      evidence: null,
      explanation: {
        en: "The document does not say where the internship takes place or whether international students can apply.",
        ur: "Document nahi batata ke internship kahan hogi ya international students apply kar sakte hain ya nahi.",
      },
    },
  ],
  requiredDocuments: [
    {
      id: "d1",
      name: "CV with project links",
      mandatory: true,
      basis: "explicit",
      evidence: {
        quote: "Your CV should include links to any projects you have worked on.",
        page: 2,
      },
      explanation: {
        en: "Add links (for example GitHub) to projects you have built.",
        ur: "Apne banaye hue projects ke links (misal ke taur par GitHub) shamil karein.",
      },
    },
    {
      id: "d2",
      name: "Short cover letter",
      mandatory: true,
      basis: "explicit",
      evidence: {
        quote: "Please send your CV and a short cover letter to careers@brightleaf.example.",
        page: 2,
      },
      explanation: {
        en: "A brief letter saying why you want this role.",
        ur: "Mukhtasar khat jis mein likhein ke aap yeh role kyun chahte hain.",
      },
    },
  ],
  submissionInstructions: [
    {
      step: "Email your CV and a short cover letter to careers@brightleaf.example.",
      evidence: {
        quote: "Please send your CV and a short cover letter to careers@brightleaf.example.",
        page: 2,
      },
    },
  ],
  fees: { text: "Not specified", evidence: null },
  selectionProcess: [
    {
      step: "Interviews take place during the first two weeks of March.",
      evidence: {
        quote: "Interviews take place during the first two weeks of March.",
        page: 2,
      },
    },
  ],
  links: [{ label: "Application email", value: "careers@brightleaf.example" }],
  unresolved: [
    "Time zone of the closing time is not stated.",
    "Location, remote/on-site status and international eligibility are not stated.",
    "Internship start date is not stated (only 'summer').",
  ],
});

const hackathonAnalysis = make({
  opportunity: {
    name: "Campus Build Weekend 2026",
    type: "hackathon",
    organizer: null,
    summary: {
      en: "A 48-hour student hackathon where teams of 2 to 4 build something useful for their campus.",
      ur: "48 ghante ka student hackathon jahan 2 se 4 afraad ki teams apne campus ke liye kuch mufeed banati hain.",
    },
  },
  dates: [
    {
      label: "closes",
      originalText: "Registration closes on 5 November 2026 at 6:00 PM PKT.",
      normalizedISO: "2026-11-05T18:00:00+05:00",
      timezone: "PKT",
      status: "verified",
      note: "PKT is Pakistan Standard Time (UTC+5).",
      evidence: {
        quote: "Registration closes on 5 November 2026 at 6:00 PM PKT.",
        page: 2,
      },
    },
    {
      label: "other",
      originalText: "The event runs 14-15 November 2026.",
      normalizedISO: null,
      timezone: null,
      status: "ambiguous",
      note: "Dates are clear, but start and end times are not given.",
      evidence: { quote: "The event runs 14-15 November 2026.", page: 2 },
    },
  ],
  eligibility: [
    {
      id: "e1",
      category: "age",
      requirement: "Students aged 18 or older",
      mandatory: true,
      basis: "explicit",
      evidence: { quote: "Open to all students aged 18 or older.", page: 1 },
      explanation: {
        en: "You must be a student and at least 18 years old.",
        ur: "Aap ka student hona aur kam az kam 18 saal ka hona zaroori hai.",
      },
    },
    {
      id: "e2",
      category: "other",
      requirement: "Team of 2 to 4 participants (no solo applications)",
      mandatory: true,
      basis: "explicit",
      evidence: {
        quote: "Teams of 2 to 4 participants. Solo applications are not accepted.",
        page: 1,
      },
      explanation: {
        en: "Form a team before registering. You cannot apply alone.",
        ur: "Registration se pehle team banayen. Aap akele apply nahi kar sakte.",
      },
    },
  ],
  requiredDocuments: [
    {
      id: "d1",
      name: "Project repository link",
      mandatory: true,
      basis: "explicit",
      evidence: {
        quote: "Submit your project repository link and a 2-minute demo video",
        page: 2,
      },
      explanation: {
        en: "A link to your code, for example on GitHub.",
        ur: "Aap ke code ka link, misal ke taur par GitHub par.",
      },
    },
    {
      id: "d2",
      name: "2-minute demo video",
      mandatory: true,
      basis: "explicit",
      evidence: {
        quote: "Submit your project repository link and a 2-minute demo video",
        page: 2,
      },
      explanation: {
        en: "A short video (about 2 minutes) showing your project working.",
        ur: "Taqreeban 2 minute ki chhoti video jis mein aap ka project chalta nazar aaye.",
      },
    },
  ],
  submissionInstructions: [
    {
      step: "Register your team at campusbuild.example/register.",
      evidence: { quote: "Register your team at campusbuild.example/register.", page: 2 },
    },
    {
      step: "Submit the repository link and demo video before the final presentation.",
      evidence: {
        quote:
          "Submit your project repository link and a 2-minute demo video before the final presentation.",
        page: 2,
      },
    },
  ],
  fees: { text: "Free", evidence: { quote: "Participation is free.", page: 2 } },
  selectionProcess: [],
  links: [{ label: "Registration", value: "campusbuild.example/register" }],
  unresolved: [
    "The time of the final presentation is not stated.",
    "Judging criteria and prizes are not mentioned.",
  ],
});

export const DEMO_SAMPLES: DemoSample[] = [
  {
    id: "scholarship",
    title: "Future Engineers Scholarship",
    kind: "scholarship",
    blurb: "Fictional scholarship for South Asian engineering students.",
    tests: "Ambiguous deadline (\"end of March\"), no portal URL.",
    text: scholarshipText,
    analysis: scholarshipAnalysis,
  },
  {
    id: "internship",
    title: "Summer Data Intern Program",
    kind: "internship",
    blurb: "Fictional paid data internship.",
    tests: "Missing eligibility info (location / international students), no time zone.",
    text: internshipText,
    analysis: internshipAnalysis,
  },
  {
    id: "hackathon",
    title: "Campus Build Weekend",
    kind: "hackathon",
    blurb: "Fictional 48-hour student hackathon.",
    tests: "A clear, verified deadline with a time zone, for comparison.",
    text: hackathonText,
    analysis: hackathonAnalysis,
  },
];

export function getSample(id: string): DemoSample | undefined {
  return DEMO_SAMPLES.find((s) => s.id === id);
}

/** Splits a sample's text on its "[Page N]" markers so it can be used like extracted pages. */
export function samplePages(sample: DemoSample): Array<{ page: number; text: string }> {
  const parts = sample.text.split(/\[Page (\d+)\]/);
  const pages: Array<{ page: number; text: string }> = [];
  for (let i = 1; i < parts.length; i += 2) {
    pages.push({ page: Number(parts[i]), text: (parts[i + 1] ?? "").trim() });
  }
  return pages.length > 0 ? pages : [{ page: 1, text: sample.text.trim() }];
}
