const regionalRns = [
  { name: "Angela Reyes, RN", initials: "AR", region: "North" },
  { name: "Beth Morgan, RN", initials: "BM", region: "South" },
  { name: "Carla Nguyen, RN", initials: "CN", region: "East" },
  { name: "Denise Patel, RN", initials: "DP", region: "Central" },
  { name: "Elena Ford, RN", initials: "EF", region: "West" }
];

const facilities = [
  {
    id: "green-valley",
    name: "Green Valley Care Center",
    region: "North",
    rn: "Angela Reyes, RN",
    don: "Marisol Vega",
    mds: "Ellen Cho",
    census: 118,
    beds: 132,
    star: 3,
    risk: 82,
    survey: 71,
    trend: [66, 69, 72, 75, 81, 84, 82],
    donAudit: { score: 78, last: "Jun 6", due: "2 days", openFindings: 5 },
    mdsAudit: { late: 4, due7: 12, rejections: 2, ggVariance: 9, carePlan: 78 },
    measures: { falls: 5.8, wounds: 9, infections: 3, rehosp: 18.5, antipsych: 14.2, uti: 4.1, pbj: 3.52, agency: 21, incidents: 7 },
    heat: { infection: 74, abuse: 68, medpass: 81, wounds: 70, admissions: 77, mdscare: 69, staffing: 73 },
    actions: [
      { title: "Complete abuse reporting refresher", owner: "Angela Reyes", due: "Today", severity: "danger", type: "POC" },
      { title: "Review late PPS assessments with MDS", owner: "Ellen Cho", due: "Today", severity: "danger", type: "MDS" },
      { title: "DON med pass follow-up audit", owner: "Marisol Vega", due: "Tomorrow", severity: "warn", type: "DON" }
    ],
    alerts: [
      { title: "Late MDS cluster", body: "Four assessments are past target, including two Medicare stays.", time: "18 min", severity: "danger" },
      { title: "Abuse policy gap", body: "Two agency nurses still missing annual attestation.", time: "44 min", severity: "danger" }
    ],
    recommendations: ["Hold 15-minute DON/MDS standup before noon.", "Pull rejected MDS files and assign root cause owner.", "Verify agency staff abuse policy attestations."]
  },
  {
    id: "lakeside-heights",
    name: "Lakeside Heights SNF",
    region: "North",
    rn: "Angela Reyes, RN",
    don: "Hannah Ellis",
    mds: "Renee Price",
    census: 94,
    beds: 108,
    star: 4,
    risk: 61,
    survey: 86,
    trend: [58, 59, 60, 62, 63, 61, 61],
    donAudit: { score: 88, last: "Jun 8", due: "12 days", openFindings: 2 },
    mdsAudit: { late: 1, due7: 8, rejections: 0, ggVariance: 4, carePlan: 91 },
    measures: { falls: 3.7, wounds: 4, infections: 1, rehosp: 14.2, antipsych: 9.1, uti: 2.6, pbj: 3.91, agency: 12, incidents: 2 },
    heat: { infection: 86, abuse: 90, medpass: 88, wounds: 84, admissions: 89, mdscare: 86, staffing: 83 },
    actions: [
      { title: "Close one unresolved wound note", owner: "Hannah Ellis", due: "Tomorrow", severity: "warn", type: "DON" },
      { title: "Finalize quarterly GG variance review", owner: "Renee Price", due: "Jun 13", severity: "normal", type: "MDS" }
    ],
    alerts: [
      { title: "Open wound documentation", body: "One treatment note has no weekly measurement attached.", time: "1 hr", severity: "warn" }
    ],
    recommendations: ["Confirm wound measurement is attached to the treatment note.", "Recheck GG coding variance during next MDS huddle."]
  },
  {
    id: "cedar-grove",
    name: "Cedar Grove Nursing & Rehab",
    region: "South",
    rn: "Beth Morgan, RN",
    don: "Patricia Lane",
    mds: "Nadia Ruiz",
    census: 126,
    beds: 148,
    star: 2,
    risk: 88,
    survey: 66,
    trend: [79, 80, 83, 84, 86, 87, 88],
    donAudit: { score: 71, last: "Jun 3", due: "Now", openFindings: 8 },
    mdsAudit: { late: 5, due7: 15, rejections: 3, ggVariance: 12, carePlan: 73 },
    measures: { falls: 6.2, wounds: 11, infections: 4, rehosp: 21.4, antipsych: 15.7, uti: 5.3, pbj: 3.28, agency: 27, incidents: 9 },
    heat: { infection: 65, abuse: 72, medpass: 69, wounds: 61, admissions: 76, mdscare: 66, staffing: 64 },
    actions: [
      { title: "Escalate wound program review", owner: "Beth Morgan", due: "Today", severity: "danger", type: "Clinical" },
      { title: "Reconcile rejected discharge assessments", owner: "Nadia Ruiz", due: "Today", severity: "danger", type: "MDS" },
      { title: "DON mock survey walk", owner: "Patricia Lane", due: "Tomorrow", severity: "danger", type: "DON" }
    ],
    alerts: [
      { title: "Survey readiness below threshold", body: "Five audit domains are below 75 percent.", time: "8 min", severity: "danger" },
      { title: "Wound risk rising", body: "New pressure injury cluster in one long-stay hall.", time: "33 min", severity: "danger" }
    ],
    recommendations: ["Move Cedar Grove to daily CCO check-in.", "Beth to complete wound and med pass validation today.", "Require MDS rejection huddle with administrator present."]
  },
  {
    id: "riverbend",
    name: "Riverbend Post Acute",
    region: "South",
    rn: "Beth Morgan, RN",
    don: "Samuel Green",
    mds: "Claire Benton",
    census: 103,
    beds: 118,
    star: 3,
    risk: 72,
    survey: 79,
    trend: [69, 70, 71, 72, 73, 71, 72],
    donAudit: { score: 82, last: "Jun 7", due: "5 days", openFindings: 3 },
    mdsAudit: { late: 2, due7: 10, rejections: 1, ggVariance: 6, carePlan: 82 },
    measures: { falls: 4.9, wounds: 6, infections: 2, rehosp: 16.9, antipsych: 11.4, uti: 3.9, pbj: 3.64, agency: 18, incidents: 5 },
    heat: { infection: 81, abuse: 78, medpass: 80, wounds: 76, admissions: 82, mdscare: 79, staffing: 77 },
    actions: [
      { title: "Finalize infection control tracer", owner: "Beth Morgan", due: "Tomorrow", severity: "warn", type: "Audit" },
      { title: "Correct one discharge assessment error", owner: "Claire Benton", due: "Jun 12", severity: "warn", type: "MDS" }
    ],
    alerts: [
      { title: "Infection tracer pending", body: "Weekly infection control tracer has not been signed.", time: "2 hr", severity: "warn" }
    ],
    recommendations: ["Complete infection tracer before end of day.", "Audit discharge MDS completion process with Claire."]
  },
  {
    id: "maple-ridge",
    name: "Maple Ridge Health Center",
    region: "East",
    rn: "Carla Nguyen, RN",
    don: "Lori Watkins",
    mds: "Mina Shah",
    census: 87,
    beds: 96,
    star: 5,
    risk: 48,
    survey: 93,
    trend: [51, 49, 48, 47, 49, 48, 48],
    donAudit: { score: 94, last: "Jun 9", due: "18 days", openFindings: 0 },
    mdsAudit: { late: 0, due7: 7, rejections: 0, ggVariance: 2, carePlan: 96 },
    measures: { falls: 2.8, wounds: 2, infections: 0, rehosp: 11.7, antipsych: 7.6, uti: 1.8, pbj: 4.12, agency: 6, incidents: 1 },
    heat: { infection: 95, abuse: 94, medpass: 96, wounds: 93, admissions: 92, mdscare: 96, staffing: 91 },
    actions: [
      { title: "Share fall reduction process with East region", owner: "Carla Nguyen", due: "Jun 14", severity: "normal", type: "QAPI" }
    ],
    alerts: [],
    recommendations: ["Use Maple Ridge as peer model for fall reduction and MDS timeliness."]
  },
  {
    id: "pine-hollow",
    name: "Pine Hollow Care Suites",
    region: "East",
    rn: "Carla Nguyen, RN",
    don: "Diana Brooks",
    mds: "Joanna Lee",
    census: 76,
    beds: 84,
    star: 4,
    risk: 58,
    survey: 88,
    trend: [55, 56, 58, 59, 57, 58, 58],
    donAudit: { score: 89, last: "Jun 7", due: "10 days", openFindings: 1 },
    mdsAudit: { late: 1, due7: 6, rejections: 0, ggVariance: 3, carePlan: 90 },
    measures: { falls: 3.1, wounds: 3, infections: 1, rehosp: 13.8, antipsych: 8.8, uti: 2.3, pbj: 3.88, agency: 9, incidents: 2 },
    heat: { infection: 90, abuse: 92, medpass: 86, wounds: 88, admissions: 90, mdscare: 88, staffing: 84 },
    actions: [
      { title: "Close care plan signature gap", owner: "Joanna Lee", due: "Jun 12", severity: "warn", type: "MDS" }
    ],
    alerts: [
      { title: "Care plan signature gap", body: "One care plan lacks interdisciplinary sign-off.", time: "3 hr", severity: "warn" }
    ],
    recommendations: ["Close the signature gap and keep the facility on weekly watch."]
  },
  {
    id: "oak-terrace",
    name: "Oak Terrace Nursing Center",
    region: "Central",
    rn: "Denise Patel, RN",
    don: "Janet Miller",
    mds: "Kara Hughes",
    census: 112,
    beds: 126,
    star: 3,
    risk: 76,
    survey: 74,
    trend: [70, 72, 73, 75, 77, 76, 76],
    donAudit: { score: 79, last: "Jun 5", due: "Now", openFindings: 6 },
    mdsAudit: { late: 3, due7: 11, rejections: 1, ggVariance: 8, carePlan: 80 },
    measures: { falls: 5.1, wounds: 7, infections: 3, rehosp: 17.8, antipsych: 12.6, uti: 4.5, pbj: 3.43, agency: 23, incidents: 6 },
    heat: { infection: 75, abuse: 80, medpass: 73, wounds: 72, admissions: 81, mdscare: 75, staffing: 69 },
    actions: [
      { title: "Agency staffing root cause review", owner: "Denise Patel", due: "Today", severity: "danger", type: "Staffing" },
      { title: "Care plan meeting audit", owner: "Kara Hughes", due: "Tomorrow", severity: "warn", type: "MDS" }
    ],
    alerts: [
      { title: "PBJ staffing pressure", body: "Agency use increased while direct care PPD fell below target.", time: "27 min", severity: "danger" }
    ],
    recommendations: ["Denise to validate staffing plan and missed break coverage.", "DON to reconcile med pass variance by shift."]
  },
  {
    id: "willow-springs",
    name: "Willow Springs Rehab",
    region: "Central",
    rn: "Denise Patel, RN",
    don: "Tara Lin",
    mds: "Becky Sanders",
    census: 99,
    beds: 112,
    star: 4,
    risk: 64,
    survey: 84,
    trend: [62, 63, 65, 64, 65, 64, 64],
    donAudit: { score: 86, last: "Jun 8", due: "8 days", openFindings: 2 },
    mdsAudit: { late: 1, due7: 9, rejections: 1, ggVariance: 5, carePlan: 87 },
    measures: { falls: 4.0, wounds: 5, infections: 1, rehosp: 15.6, antipsych: 10.8, uti: 3.1, pbj: 3.75, agency: 14, incidents: 3 },
    heat: { infection: 84, abuse: 88, medpass: 83, wounds: 82, admissions: 86, mdscare: 84, staffing: 80 },
    actions: [
      { title: "Resolve one validation warning", owner: "Becky Sanders", due: "Jun 12", severity: "warn", type: "MDS" },
      { title: "Complete QAPI minutes upload", owner: "Tara Lin", due: "Jun 14", severity: "normal", type: "QAPI" }
    ],
    alerts: [
      { title: "MDS validation warning", body: "One submitted assessment has a warning tied to discharge status.", time: "2 hr", severity: "warn" }
    ],
    recommendations: ["Close validation warning and maintain QAPI upload cadence."]
  },
  {
    id: "sunrise-manor",
    name: "Sunrise Manor SNF",
    region: "West",
    rn: "Elena Ford, RN",
    don: "Allison Reed",
    mds: "Kim Otero",
    census: 121,
    beds: 138,
    star: 2,
    risk: 84,
    survey: 69,
    trend: [76, 78, 79, 81, 83, 85, 84],
    donAudit: { score: 73, last: "Jun 4", due: "Now", openFindings: 7 },
    mdsAudit: { late: 4, due7: 13, rejections: 2, ggVariance: 10, carePlan: 75 },
    measures: { falls: 5.9, wounds: 8, infections: 4, rehosp: 20.2, antipsych: 16.1, uti: 5.0, pbj: 3.31, agency: 25, incidents: 8 },
    heat: { infection: 68, abuse: 74, medpass: 70, wounds: 69, admissions: 73, mdscare: 67, staffing: 66 },
    actions: [
      { title: "Antipsychotic reduction review", owner: "Elena Ford", due: "Today", severity: "danger", type: "QAPI" },
      { title: "MDS care plan cross-check", owner: "Kim Otero", due: "Today", severity: "danger", type: "MDS" },
      { title: "Survey binder gap closure", owner: "Allison Reed", due: "Tomorrow", severity: "danger", type: "DON" }
    ],
    alerts: [
      { title: "Psychotropic review overdue", body: "Quarterly psychotropic committee notes are incomplete.", time: "12 min", severity: "danger" },
      { title: "Care plan accuracy gap", body: "Two high-risk residents have mismatched care plan interventions.", time: "51 min", severity: "danger" }
    ],
    recommendations: ["Start psychotropic reduction huddle today.", "Pair DON and MDS for care plan validation.", "Elena to review survey binder after lunch."]
  },
  {
    id: "meadowbrook",
    name: "Meadowbrook Skilled Care",
    region: "West",
    rn: "Elena Ford, RN",
    don: "Rachel Owens",
    mds: "Sofia Grant",
    census: 83,
    beds: 92,
    star: 4,
    risk: 54,
    survey: 90,
    trend: [53, 54, 55, 54, 53, 54, 54],
    donAudit: { score: 91, last: "Jun 9", due: "16 days", openFindings: 1 },
    mdsAudit: { late: 0, due7: 5, rejections: 0, ggVariance: 2, carePlan: 94 },
    measures: { falls: 2.9, wounds: 2, infections: 0, rehosp: 12.6, antipsych: 8.0, uti: 2.0, pbj: 4.02, agency: 8, incidents: 1 },
    heat: { infection: 91, abuse: 93, medpass: 90, wounds: 92, admissions: 91, mdscare: 94, staffing: 88 },
    actions: [
      { title: "Upload completed emergency drill proof", owner: "Rachel Owens", due: "Jun 13", severity: "normal", type: "Audit" }
    ],
    alerts: [],
    recommendations: ["Keep on routine cadence and share emergency drill documentation pattern."]
  }
];

const state = {
  region: "all",
  rn: "all",
  search: "",
  priorityOnly: false,
  window: "24h",
  acknowledged: new Set()
};

const domains = [
  ["infection", "Infection"],
  ["abuse", "Abuse"],
  ["medpass", "Med pass"],
  ["wounds", "Wounds"],
  ["admissions", "Admit/disch"],
  ["mdscare", "MDS/care"],
  ["staffing", "Staffing"]
];

const severityRank = { danger: 3, warn: 2, normal: 1 };

const els = {
  regionFilter: document.getElementById("regionFilter"),
  rnFilter: document.getElementById("rnFilter"),
  searchFilter: document.getElementById("searchFilter"),
  priorityOnly: document.getElementById("priorityOnly"),
  kpiGrid: document.getElementById("kpiGrid"),
  facilityGrid: document.getElementById("facilityGrid"),
  facilityRows: document.getElementById("facilityRows"),
  alertList: document.getElementById("alertList"),
  signalCount: document.getElementById("signalCount"),
  rnGrid: document.getElementById("rnGrid"),
  mdsSummary: document.getElementById("mdsSummary"),
  mdsWorklist: document.getElementById("mdsWorklist"),
  heatmapWrap: document.getElementById("heatmapWrap"),
  actionGrid: document.getElementById("actionGrid"),
  riskTrend: document.getElementById("riskTrend"),
  trendHeadline: document.getElementById("trendHeadline"),
  trendCopy: document.getElementById("trendCopy"),
  facilityDialog: document.getElementById("facilityDialog"),
  facilityDetail: document.getElementById("facilityDetail"),
  briefDialog: document.getElementById("briefDialog"),
  briefContent: document.getElementById("briefContent"),
  lastUpdated: document.getElementById("lastUpdated")
};
