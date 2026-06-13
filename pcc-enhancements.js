(function pccEnhancements() {
  if (typeof facilities === "undefined" || typeof domains === "undefined" || typeof state === "undefined") return;

  state.role = state.role || "cco";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function esc(value) {
    return escapeHtml(value);
  }

  function sourceChip(kind) {
    const labels = {
      system: "PCC data",
      mds: "MDS feed",
      audit: "RN audit",
      judgment: "RN judgment",
      composite: "Composite"
    };
    return `<span class="source-tag ${esc(kind)}">${esc(labels[kind] || kind)}</span>`;
  }

  function rnJudgmentScore(facility) {
    const urgentActions = facility.actions.filter((action) => action.severity === "danger").length;
    const urgentAlerts = facility.alerts.filter((alert) => alert.severity === "danger").length;
    const lowDomains = domains.filter(([key]) => facility.heat[key] < 75).length;
    const repeatPattern = facility.donAudit.openFindings >= 5 || facility.mdsAudit.late >= 3 || lowDomains >= 3;
    const score = clamp((urgentActions * 2) + urgentAlerts + (repeatPattern ? 3 : 0) + (facility.survey < 72 ? 2 : 0), 0, 10);
    const level = score >= 8 ? "Urgent concern" : score >= 6 ? "High concern" : score >= 3 ? "Moderate concern" : score > 0 ? "Minor concern" : "No concern";
    const reasons = [
      urgentActions ? `${urgentActions} urgent action${urgentActions === 1 ? "" : "s"}` : "",
      urgentAlerts ? `${urgentAlerts} urgent signal${urgentAlerts === 1 ? "" : "s"}` : "",
      repeatPattern ? "repeat pattern concern" : "",
      facility.survey < 72 ? "survey exposure concern" : ""
    ].filter(Boolean);
    return { score, level, reasons: reasons.length ? reasons : ["routine monitoring only"] };
  }

  function riskBreakdown(facility) {
    const clinical = clamp(round(
      (facility.measures.incidents * 1.1) +
      (facility.measures.wounds * 1.2) +
      (facility.measures.infections * 1.8) +
      (facility.measures.rehosp * 0.42) +
      (facility.measures.falls * 1.1)
    ), 0, 40);
    const mds = clamp(round(
      (facility.mdsAudit.late * 3.2) +
      (facility.mdsAudit.rejections * 3) +
      (facility.mdsAudit.ggVariance * 0.75) +
      ((100 - facility.mdsAudit.carePlan) * 0.25)
    ), 0, 25);
    const lowDomains = domains.filter(([key]) => facility.heat[key] < 75).length;
    const audit = clamp(round(
      ((100 - facility.donAudit.score) * 0.28) +
      ((100 - facility.survey) * 0.23) +
      (facility.donAudit.openFindings * 1.1) +
      (lowDomains * 1.5)
    ), 0, 25);
    const judgment = rnJudgmentScore(facility);
    const score = clamp(clinical + mds + audit + judgment.score, 0, 100);

    return {
      score,
      components: [
        { label: "Clinical signals", source: "system", points: clinical, max: 40, reasons: [`${facility.measures.incidents} incidents`, `${facility.measures.wounds} wound alerts`, `${facility.measures.rehosp}% rehospitalization signal`] },
        { label: "MDS risk", source: "mds", points: mds, max: 25, reasons: [`${facility.mdsAudit.late} late`, `${facility.mdsAudit.rejections} rejects`, `${facility.mdsAudit.ggVariance}% GG variance`] },
        { label: "Audit readiness", source: "audit", points: audit, max: 25, reasons: [`${facility.donAudit.score}% DON audit`, `${facility.donAudit.openFindings} open findings`, `${lowDomains} low heatmap domains`] },
        { label: "RN concern", source: "judgment", points: judgment.score, max: 10, reasons: judgment.reasons }
      ],
      judgment
    };
  }

  function facilityRisk(facility) {
    return riskBreakdown(facility).score;
  }

  function trendDelta(facility) {
    return facility.trend.at(-1) - facility.trend.at(-2);
  }

  function domainReason(facility, key, score) {
    const reasons = {
      infection: score < 75 ? `${facility.measures.infections} infection signal${facility.measures.infections === 1 ? "" : "s"}` : "tracer current",
      abuse: score < 75 ? "attestation or reporting gap" : "policy proof current",
      medpass: score < 75 ? "observation variance" : "rounds stable",
      wounds: score < 75 ? `${facility.measures.wounds} wound alert${facility.measures.wounds === 1 ? "" : "s"}` : "documentation current",
      admissions: score < 75 ? "admit/discharge proof gap" : "packets aligned",
      mdscare: score < 75 ? `${facility.mdsAudit.carePlan}% care plan match` : "care plan aligned"
    };
    return reasons[key] || "review";
  }

  function ensureEnhancementLayout() {
    if (!document.querySelector('link[href="pcc-enhancements.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "pcc-enhancements.css";
      document.head.appendChild(link);
    }

    const nav = document.querySelector(".nav-list");
    if (nav && !nav.querySelector('a[href="#changes"]')) {
      nav.querySelector('a[href="#audits"]').insertAdjacentHTML("beforebegin", `
        <a href="#changes">Changes</a>
        <a href="#score-logic">Score Logic</a>
        <a href="#quadrants">Quadrants</a>
      `);
    }

    const windowSegment = document.querySelector("[data-window]")?.closest(".segmented");
    if (windowSegment && !document.querySelector(".role-segmented")) {
      windowSegment.insertAdjacentHTML("afterend", `
        <div class="segmented role-segmented" role="group" aria-label="Role view">
          <button type="button" class="active" data-role="cco">CCO</button>
          <button type="button" data-role="rn">RN</button>
          <button type="button" data-role="don">DON</button>
          <button type="button" data-role="mds">MDS</button>
        </div>
      `);
    }

    const kpiGrid = document.getElementById("kpiGrid");
    if (kpiGrid && !document.getElementById("changes")) {
      kpiGrid.insertAdjacentHTML("afterend", `
        <section class="change-section" id="changes">
          <div class="section-heading">
            <div>
              <p class="eyebrow">PCC watch</p>
              <h2>What changed since yesterday</h2>
            </div>
            <span class="source-pill">PCC + MDS + audit feed</span>
          </div>
          <div class="change-grid" id="changeGrid"></div>
        </section>
        <section class="score-section" id="score-logic">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Score logic</p>
              <h2>Objective data plus structured judgment</h2>
            </div>
            <span class="source-pill">Transparent risk model</span>
          </div>
          <div class="score-layout">
            <div class="score-card-grid" id="scoreCards"></div>
            <aside class="role-focus" id="roleFocus"></aside>
          </div>
        </section>
      `);
    }

    const commandLayout = document.querySelector(".command-layout");
    if (commandLayout && !document.getElementById("quadrants")) {
      commandLayout.insertAdjacentHTML("afterend", `
        <section class="quadrant-section" id="quadrants">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Prioritization</p>
              <h2>Risk versus survey readiness</h2>
            </div>
            <span class="source-pill">Morning huddle view</span>
          </div>
          <div class="quadrant-grid" id="quadrantGrid"></div>
        </section>
      `);
    }

    const mdsWorklist = document.getElementById("mdsWorklist");
    if (mdsWorklist && !document.getElementById("mdsTimeline")) {
      mdsWorklist.insertAdjacentHTML("afterend", `<div class="timeline-list" id="mdsTimeline"></div>`);
    }

    document.querySelectorAll("[data-role]").forEach((button) => {
      if (button.dataset.enhanced) return;
      button.dataset.enhanced = "true";
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-role]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        state.role = button.dataset.role;
        renderEnhancements(getVisibleFacilities());
      });
    });
  }

  isPriority = function enhancedIsPriority(facility) {
    return facilityRisk(facility) >= 75 || facility.mdsAudit.late > 2 || facility.donAudit.score < 80 || facility.actions.some((action) => action.severity === "danger");
  };

  summarize = function enhancedSummarize(facilitySet) {
    const openActions = facilitySet.flatMap((facility) => facility.actions);
    const activeAlerts = getAlerts(facilitySet);
    return {
      count: facilitySet.length,
      avgRisk: round(avg(facilitySet.map((facility) => facilityRisk(facility)))),
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
  };

  const originalRenderFacilityCards = renderFacilityCards;
  renderFacilityCards = function enhancedFacilityCards(facilitySet) {
    originalRenderFacilityCards(facilitySet);
    document.querySelectorAll("[data-facility-id]").forEach((card) => {
      const facility = findFacility(card.dataset.facilityId);
      if (!facility) return;
      const risk = facilityRisk(facility);
      const severity = severityForRisk(risk);
      card.classList.toggle("priority", severity === "danger");
      card.classList.toggle("watch", severity === "warn");
      const value = card.querySelector(".risk-meter-top strong");
      const line = card.querySelector(".risk-line");
      if (value) value.textContent = risk;
      if (line) line.style.setProperty("--risk", `${risk}%`);
    });
  };

  const originalRenderFacilityRows = renderFacilityRows;
  renderFacilityRows = function enhancedFacilityRows(facilitySet) {
    originalRenderFacilityRows(facilitySet);
    document.querySelectorAll("#facilityRows tr[data-facility-id]").forEach((row) => {
      const facility = findFacility(row.dataset.facilityId);
      if (!facility) return;
      const risk = facilityRisk(facility);
      const sev = severityForRisk(risk);
      const badge = row.querySelector(".table-risk .status-badge");
      const bar = row.querySelector(".table-risk .mini-bar");
      if (badge) {
        badge.textContent = `${risk} ${severityLabel(sev)}`;
        badge.className = `status-badge ${sev === "danger" ? "danger" : sev === "warn" ? "warn" : ""}`;
      }
      if (bar) {
        bar.className = `mini-bar ${sev === "danger" ? "danger" : sev === "warn" ? "warn" : ""}`;
        bar.style.setProperty("--fill", `${risk}%`);
      }
    });
  };

  renderHeatmap = function enhancedHeatmap(facilitySet) {
    if (!facilitySet.length) {
      els.heatmapWrap.innerHTML = `<div class="empty-state">No heatmap data for current filters.</div>`;
      return;
    }

    const header = `
      <div class="heat-row">
        <div class="heat-head">Facility</div>
        ${domains.map((domain) => `<div class="heat-head">${esc(domain[1])}</div>`).join("")}
      </div>
    `;
    const rows = facilitySet.map((facility) => `
      <div class="heat-row">
        <button class="heat-cell heat-label text-button" type="button" data-open-facility="${esc(facility.id)}">${esc(facility.name)}</button>
        ${domains.map(([key]) => {
          const score = facility.heat[key];
          return `<div class="heat-cell heat-score ${heatClass(score)}"><strong>${score}%</strong><span>${esc(domainReason(facility, key, score))}</span></div>`;
        }).join("")}
      </div>
    `).join("");
    els.heatmapWrap.innerHTML = `<div class="heatmap">${header}${rows}</div>`;
  };

  const originalShowFacilityDetail = showFacilityDetail;
  showFacilityDetail = function enhancedFacilityDetail(facilityId) {
    originalShowFacilityDetail(facilityId);
    const facility = findFacility(facilityId);
    if (!facility) return;
    const breakdown = riskBreakdown(facility);
    const heroValue = document.querySelector("#facilityDetail .detail-hero .metric-value");
    if (heroValue) heroValue.textContent = breakdown.score;
    const hero = document.querySelector("#facilityDetail .detail-hero");
    if (hero && !document.querySelector("#facilityDetail .breakdown-panel")) {
      hero.insertAdjacentHTML("afterend", `
        <section class="breakdown-panel">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">Why this score</p>
              <h3>PCC-friendly risk breakdown</h3>
            </div>
            ${sourceChip("composite")}
          </div>
          <div class="breakdown-grid">
            ${breakdown.components.map((component) => `
              <div class="breakdown-item">
                <div class="breakdown-head"><strong>${esc(component.label)}</strong>${sourceChip(component.source)}</div>
                <div class="mini-bar ${component.points / component.max > 0.7 ? "danger" : component.points / component.max > 0.45 ? "warn" : ""}" style="--fill: ${(component.points / component.max) * 100}%"><span></span></div>
                <div class="tiny-note">${component.points}/${component.max} pts | ${component.reasons.map(esc).join(" | ")}</div>
              </div>
            `).join("")}
          </div>
        </section>
      `);
    }
  };

  function renderChanges(facilitySet) {
    const el = document.getElementById("changeGrid");
    if (!el) return;
    const changes = facilitySet.flatMap((facility) => {
      const risk = facilityRisk(facility);
      const delta = trendDelta(facility);
      const items = [];
      if (delta >= 2) items.push({ facility, title: `Risk moved +${delta}`, body: `Clinical risk index is now ${risk}. Review PCC events, audit exceptions, and MDS timing.`, source: "composite", severity: risk >= 75 ? "danger" : "warn" });
      const urgentAlerts = facility.alerts.filter((alert) => alert.severity === "danger");
      if (urgentAlerts.length) items.push({ facility, title: `${urgentAlerts.length} urgent clinical signal${urgentAlerts.length === 1 ? "" : "s"}`, body: urgentAlerts.map((alert) => alert.title).join(" | "), source: "system", severity: "danger" });
      if (facility.mdsAudit.late > 0 || facility.mdsAudit.rejections > 0) items.push({ facility, title: "MDS exception needs review", body: `${facility.mdsAudit.late} late assessments, ${facility.mdsAudit.rejections} validation rejects, ${facility.mdsAudit.ggVariance}% GG variance.`, source: "mds", severity: facility.mdsAudit.late > 2 || facility.mdsAudit.rejections > 1 ? "danger" : "warn" });
      if (facility.donAudit.due === "Now" || facility.donAudit.score < 80) items.push({ facility, title: "DON audit follow-up", body: `${facility.donAudit.score}% score, ${facility.donAudit.openFindings} open findings, due ${facility.donAudit.due}.`, source: "audit", severity: facility.donAudit.score < 75 || facility.donAudit.due === "Now" ? "danger" : "warn" });
      return items;
    }).sort((a, b) => severityRank[b.severity] - severityRank[a.severity]).slice(0, 8);

    el.innerHTML = changes.length ? changes.map((item) => `
      <article class="change-card">
        <div class="change-top">${sourceChip(item.source)}<span class="status-badge ${item.severity === "danger" ? "danger" : "warn"}">${esc(severityLabel(item.severity))}</span></div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.body)}</p>
        <button class="text-button" type="button" data-open-facility="${esc(item.facility.id)}">${esc(item.facility.name)}</button>
      </article>
    `).join("") : `<div class="empty-state">No material changes in this view.</div>`;
  }

  function renderScoreLogic(facilitySet) {
    const scoreCards = document.getElementById("scoreCards");
    if (!scoreCards) return;
    const model = [
      ["Clinical signals", "system", "40 pts", "PCC-facing clinical pressure from incidents, wound alerts, infections, rehospitalization signal, and falls."],
      ["MDS risk", "mds", "25 pts", "Late assessments, validation rejects, GG variance, and MDS-to-care-plan alignment."],
      ["Audit readiness", "audit", "25 pts", "DON audit score, open findings, survey readiness score, and low heatmap domains."],
      ["RN concern", "judgment", "10 pts", "Structured judgment for repeat patterns, weak follow-through, survey exposure, and same-day concern."]
    ];
    scoreCards.innerHTML = model.map(([label, source, value, body]) => `
      <article class="score-card">
        <div class="change-top">${sourceChip(source)}<strong>${esc(value)}</strong></div>
        <h3>${esc(label)}</h3>
        <p>${esc(body)}</p>
      </article>
    `).join("");
    renderRoleFocus(facilitySet);
  }

  function renderRoleFocus(facilitySet) {
    const el = document.getElementById("roleFocus");
    if (!el) return;
    const highRisk = [...facilitySet].sort((a, b) => facilityRisk(b) - facilityRisk(a)).slice(0, 4);
    const donItems = [...facilitySet].filter((facility) => facility.donAudit.score < 82 || facility.donAudit.due === "Now").sort((a, b) => a.donAudit.score - b.donAudit.score).slice(0, 5);
    const mdsItems = [...facilitySet].filter((facility) => facility.mdsAudit.late || facility.mdsAudit.rejections).sort((a, b) => (b.mdsAudit.late * 3 + b.mdsAudit.rejections * 2) - (a.mdsAudit.late * 3 + a.mdsAudit.rejections * 2)).slice(0, 5);
    const rnItems = regionalRns.map((rn) => {
      const rnFacilities = facilitySet.filter((facility) => facility.rn === rn.name);
      return { rn: rn.name, count: rnFacilities.length, risk: rnFacilities.length ? round(avg(rnFacilities.map((facility) => facilityRisk(facility)))) : 0, priority: rnFacilities.filter(isPriority).length };
    }).filter((item) => item.count).sort((a, b) => b.risk - a.risk).slice(0, 5);
    const content = {
      cco: { title: "CCO lens", note: "Start with portfolio risk, then open only the buildings that explain the red.", rows: highRisk.map((facility) => `${facility.name}: risk ${facilityRisk(facility)}, survey ${facility.survey}%`) },
      rn: { title: "Regional RN lens", note: "Use this to balance RN huddles, same-day validation, and escalation needs.", rows: rnItems.map((item) => `${item.rn.replace(", RN", "")}: ${item.priority} priority, average risk ${item.risk}`) },
      don: { title: "DON lens", note: "Focus on follow-through, repeat findings, survey binder proof, and closure dates.", rows: donItems.map((facility) => `${facility.name}: ${facility.donAudit.score}% DON audit, ${facility.donAudit.openFindings} findings`) },
      mds: { title: "MDS lens", note: "Prioritize late items, rejects, GG variance, and care plan mismatch.", rows: mdsItems.map((facility) => `${facility.name}: ${facility.mdsAudit.late} late, ${facility.mdsAudit.rejections} rejects`) }
    }[state.role || "cco"];
    el.innerHTML = `<p class="eyebrow">Role view</p><h3>${esc(content.title)}</h3><p>${esc(content.note)}</p><ul class="role-list">${(content.rows.length ? content.rows : ["No role-specific exceptions in this view."]).map((row) => `<li>${esc(row)}</li>`).join("")}</ul>`;
  }

  function renderQuadrants(facilitySet) {
    const el = document.getElementById("quadrantGrid");
    if (!el) return;
    const quadrants = [
      { key: "urgent", title: "High risk / low readiness", note: "CCO and RN same-day focus", test: (facility) => facilityRisk(facility) >= 75 && facility.survey < 80 },
      { key: "stabilize", title: "High risk / ready", note: "Validate the risk driver", test: (facility) => facilityRisk(facility) >= 75 && facility.survey >= 80 },
      { key: "prep", title: "Lower risk / low readiness", note: "Survey binder and audit cleanup", test: (facility) => facilityRisk(facility) < 75 && facility.survey < 80 },
      { key: "maintain", title: "Lower risk / ready", note: "Routine cadence", test: (facility) => facilityRisk(facility) < 75 && facility.survey >= 80 }
    ];
    el.innerHTML = quadrants.map((quadrant) => {
      const items = facilitySet.filter(quadrant.test).sort((a, b) => facilityRisk(b) - facilityRisk(a));
      return `<article class="quadrant-card ${esc(quadrant.key)}"><div class="quadrant-head"><h3>${esc(quadrant.title)}</h3><span>${items.length}</span></div><p>${esc(quadrant.note)}</p><div class="quadrant-list">${items.length ? items.map((facility) => `<button class="quadrant-pill text-button" type="button" data-open-facility="${esc(facility.id)}"><strong>${esc(facility.name)}</strong><span>Risk ${facilityRisk(facility)} | Ready ${facility.survey}%</span></button>`).join("") : `<div class="empty-state">None</div>`}</div></article>`;
    }).join("");
  }

  function renderMdsTimeline(facilitySet) {
    const el = document.getElementById("mdsTimeline");
    if (!el) return;
    const timeline = facilitySet.flatMap((facility) => {
      const items = [];
      if (facility.mdsAudit.late) items.push({ day: "Now", facility, title: `${facility.mdsAudit.late} late MDS`, severity: "danger" });
      if (facility.mdsAudit.rejections) items.push({ day: "Today", facility, title: `${facility.mdsAudit.rejections} validation reject${facility.mdsAudit.rejections === 1 ? "" : "s"}`, severity: "warn" });
      if (facility.mdsAudit.due7) items.push({ day: "Next 7 days", facility, title: `${facility.mdsAudit.due7} assessments due`, severity: facility.mdsAudit.due7 > 12 ? "warn" : "normal" });
      return items;
    }).sort((a, b) => severityRank[b.severity] - severityRank[a.severity]).slice(0, 10);
    el.innerHTML = `<div class="timeline-title"><strong>14-day MDS operating timeline</strong>${sourceChip("mds")}</div>${timeline.map((item) => `<button class="timeline-item text-button" type="button" data-open-facility="${esc(item.facility.id)}"><span class="timeline-day">${esc(item.day)}</span><span>${esc(item.title)}</span><small>${esc(item.facility.name)}</small></button>`).join("")}`;
  }

  function renderEnhancements(facilitySet) {
    renderChanges(facilitySet);
    renderScoreLogic(facilitySet);
    renderQuadrants(facilitySet);
    renderMdsTimeline(facilitySet);
  }

  const originalRender = render;
  render = function enhancedRender() {
    originalRender();
    ensureEnhancementLayout();
    renderEnhancements(getVisibleFacilities());
  };

  ensureEnhancementLayout();
  render();
})();
