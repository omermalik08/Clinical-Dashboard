function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function severityForRisk(risk) {
  if (risk >= 75) return "danger";
  if (risk >= 62) return "warn";
  return "normal";
}

function severityLabel(severity) {
  if (severity === "danger") return "Priority";
  if (severity === "warn") return "Watch";
  return "Stable";
}

function heatClass(score) {
  if (score < 75) return "risk";
  if (score < 84) return "watch";
  return "good";
}

function findFacility(id) {
  return facilities.find((facility) => facility.id === id);
}

function isPriority(facility) {
  return facility.risk >= 75 || facility.mdsAudit.late > 2 || facility.donAudit.score < 80 || facility.actions.some((action) => action.severity === "danger");
}

function getVisibleFacilities() {
  const query = state.search.trim().toLowerCase();
  return facilities.filter((facility) => {
    if (state.region !== "all" && facility.region !== state.region) return false;
    if (state.rn !== "all" && facility.rn !== state.rn) return false;
    if (state.priorityOnly && !isPriority(facility)) return false;
    if (!query) return true;
    const haystack = [facility.name, facility.region, facility.rn, facility.don, facility.mds].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function populateFilters() {
  unique(facilities.map((facility) => facility.region)).forEach((region) => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    els.regionFilter.appendChild(option);
  });

  unique(facilities.map((facility) => facility.rn)).forEach((rn) => {
    const option = document.createElement("option");
    option.value = rn;
    option.textContent = rn;
    els.rnFilter.appendChild(option);
  });
}

function summarize(facilitySet) {
  const openActions = facilitySet.flatMap((facility) => facility.actions);
  const activeAlerts = getAlerts(facilitySet);
  return {
    count: facilitySet.length,
    avgRisk: round(avg(facilitySet.map((facility) => facility.risk))),
    avgSurvey: round(avg(facilitySet.map((facility) => facility.survey))),
    priorityFacilities: facilitySet.filter(isPriority).length,
    lateMds: facilitySet.reduce((sum, facility) => sum + facility.mdsAudit.late, 0),
    mdsDue: facilitySet.reduce((sum, facility) => sum + facility.mdsAudit.due7, 0),
    rejections: facilitySet.reduce((sum, facility) => sum + facility.mdsAudit.rejections, 0),
    openActions: openActions.length,
    urgentActions: openActions.filter((action) => action.severity === "danger").length,
    alerts: activeAlerts.length,
    incidentCount: facilitySet.reduce((sum, facility) => sum + facility.measures.incidents, 0),
    overdueDon: facilitySet.filter((facility) => facility.donAudit.score < 80 || facility.donAudit.due === "Now").length
  };
}

function renderKpis(facilitySet) {
  const summary = summarize(facilitySet);
  const kpis = [
    {
      label: "Clinical risk index",
      value: summary.count ? summary.avgRisk : "--",
      note: `${summary.count} facilities in view`,
      fill: summary.avgRisk,
      severity: severityForRisk(summary.avgRisk)
    },
    {
      label: "Priority facilities",
      value: summary.priorityFacilities,
      note: "Require CCO or RN follow-up",
      fill: Math.min(100, summary.priorityFacilities * 12),
      severity: summary.priorityFacilities >= 3 ? "danger" : "warn"
    },
    {
      label: "Survey readiness",
      value: summary.count ? `${summary.avgSurvey}%` : "--",
      note: "Average mock survey score",
      fill: summary.avgSurvey,
      severity: summary.avgSurvey < 75 ? "danger" : summary.avgSurvey < 84 ? "warn" : "normal"
    },
    {
      label: "Late MDS items",
      value: summary.lateMds,
      note: `${summary.mdsDue} due in 7 days`,
      fill: Math.min(100, summary.lateMds * 7),
      severity: summary.lateMds > 10 ? "danger" : summary.lateMds > 4 ? "warn" : "normal"
    },
    {
      label: "Open actions",
      value: summary.openActions,
      note: `${summary.urgentActions} urgent`,
      fill: Math.min(100, summary.openActions * 5),
      severity: summary.urgentActions > 4 ? "danger" : summary.urgentActions > 0 ? "warn" : "normal"
    },
    {
      label: "DON audits due",
      value: summary.overdueDon,
      note: "Due now or under 80 percent",
      fill: Math.min(100, summary.overdueDon * 16),
      severity: summary.overdueDon > 2 ? "danger" : summary.overdueDon > 0 ? "warn" : "normal"
    }
  ];

  els.kpiGrid.innerHTML = kpis.map((kpi) => {
    const sev = kpi.severity === "danger" ? "danger" : kpi.severity === "warn" ? "warn" : "";
    return `
      <article class="metric-card">
        <div class="metric-top">
          <span class="metric-label">${escapeHtml(kpi.label)}</span>
          <span class="status-badge delta ${sev}">${escapeHtml(severityLabel(kpi.severity))}</span>
        </div>
        <div class="metric-value">${escapeHtml(kpi.value)}</div>
        <div class="mini-bar ${sev}" style="--fill: ${Math.max(4, Math.min(100, kpi.fill || 0))}%"><span></span></div>
        <span class="metric-note">${escapeHtml(kpi.note)}</span>
      </article>
    `;
  }).join("");
}

function renderTrend(facilitySet) {
  if (!facilitySet.length) {
    els.riskTrend.innerHTML = `<div class="empty-state">No facilities match the current filters.</div>`;
    els.trendHeadline.textContent = "No trend";
    els.trendCopy.textContent = "Adjust filters to restore the portfolio view.";
    return;
  }

  const trendLength = facilitySet[0].trend.length;
  const values = Array.from({ length: trendLength }, (_, index) => round(avg(facilitySet.map((facility) => facility.trend[index]))));
  const width = 620;
  const height = 132;
  const padding = 18;
  const min = Math.max(40, Math.min(...values) - 8);
  const max = Math.min(95, Math.max(...values) + 8);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / (values.length - 1);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${round(x, 1)},${round(y, 1)}`;
  }).join(" ");
  const last = values.at(-1);
  const first = values[0];
  const direction = last > first ? "up" : last < first ? "down" : "flat";
  const copy = {
    "24h": "Same-day signal blend from incidents, audits, staffing, and MDS exceptions.",
    "7d": "Weekly view highlights facilities trending away from survey readiness.",
    "30d": "Monthly view helps separate noise from sustained operating risk."
  };

  els.riskTrend.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Average risk trend is ${last}">
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#dbe6df" stroke-width="1"></line>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#dbe6df" stroke-width="1"></line>
      <polyline points="${points}" fill="none" stroke="#23677a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
      ${points.split(" ").map((point, index) => {
        const [x, y] = point.split(",");
        const fill = index === values.length - 1 ? "#b84f3d" : "#16835f";
        return `<circle cx="${x}" cy="${y}" r="${index === values.length - 1 ? 5 : 3.5}" fill="${fill}"></circle>`;
      }).join("")}
      <text x="${width - padding}" y="${padding + 10}" text-anchor="end" fill="#65736d" font-size="12">risk ${last}</text>
    </svg>
  `;

  els.trendHeadline.textContent = `${direction === "up" ? "Risk rising" : direction === "down" ? "Risk improving" : "Risk steady"}: ${last}`;
  els.trendCopy.textContent = copy[state.window];
}

function renderFacilityCards(facilitySet) {
  if (!facilitySet.length) {
    els.facilityGrid.innerHTML = `<div class="empty-state">No facilities match the current filters.</div>`;
    return;
  }

  els.facilityGrid.innerHTML = facilitySet.map((facility) => {
    const severity = severityForRisk(facility.risk);
    const cardClass = severity === "danger" ? "priority" : severity === "warn" ? "watch" : "";
    const flags = [
      facility.mdsAudit.late ? `${facility.mdsAudit.late} late MDS` : "MDS on pace",
      facility.donAudit.score < 80 ? "DON audit gap" : `${facility.donAudit.score}% DON`,
      facility.survey < 75 ? "Survey risk" : `${facility.survey}% ready`
    ];
    return `
      <article class="facility-card ${cardClass}" tabindex="0" role="button" data-facility-id="${escapeHtml(facility.id)}" aria-label="Open ${escapeHtml(facility.name)} details">
        <div class="facility-name">${escapeHtml(facility.name)}</div>
        <div class="facility-meta">
          <span>${escapeHtml(facility.region)}</span>
          <span>${facility.census}/${facility.beds}</span>
        </div>
        <div class="risk-meter">
          <div class="risk-meter-top">
            <span>Risk</span>
            <strong>${facility.risk}</strong>
          </div>
          <div class="risk-line" style="--risk: ${facility.risk}%"><span></span></div>
        </div>
        <div class="facility-flags">
          ${flags.map((flag, index) => {
            const badgeClass = index === 0 && facility.mdsAudit.late ? "danger" : index === 1 && facility.donAudit.score < 80 ? "danger" : index === 2 && facility.survey < 75 ? "warn" : "";
            return `<span class="status-badge ${badgeClass}">${escapeHtml(flag)}</span>`;
          }).join("")}
        </div>
      </article>
    `;
  }).join("");
}
