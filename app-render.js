function renderFacilityRows(facilitySet) {
  if (!facilitySet.length) {
    els.facilityRows.innerHTML = `<tr><td colspan="7">No facilities match the current filters.</td></tr>`;
    return;
  }

  els.facilityRows.innerHTML = facilitySet.map((facility) => {
    const severity = severityForRisk(facility.risk);
    const sevClass = severity === "danger" ? "danger" : severity === "warn" ? "warn" : "";
    return `
      <tr data-facility-id="${escapeHtml(facility.id)}">
        <td>
          <div class="table-facility">
            <strong>${escapeHtml(facility.name)}</strong>
            <span>${escapeHtml(facility.region)} | DON ${escapeHtml(facility.don)} | MDS ${escapeHtml(facility.mds)}</span>
          </div>
        </td>
        <td>${escapeHtml(facility.rn)}</td>
        <td>
          <div class="table-risk">
            <span class="status-badge ${sevClass}">${facility.risk} ${escapeHtml(severityLabel(severity))}</span>
            <div class="mini-bar ${sevClass}" style="--fill: ${facility.risk}%"><span></span></div>
          </div>
        </td>
        <td>
          <strong>${facility.donAudit.score}%</strong>
          <div class="tiny-note">Last ${escapeHtml(facility.donAudit.last)} | Due ${escapeHtml(facility.donAudit.due)}</div>
        </td>
        <td>
          <strong>${facility.mdsAudit.late} late</strong>
          <div class="tiny-note">${facility.mdsAudit.due7} due in 7 days | ${facility.mdsAudit.rejections} rejects</div>
        </td>
        <td>
          <strong>${facility.survey}%</strong>
          <div class="tiny-note">${facility.star}-star public rating</div>
        </td>
        <td>
          <strong>${facility.actions.length}</strong>
          <div class="tiny-note">${facility.actions.filter((action) => action.severity === "danger").length} urgent</div>
        </td>
      </tr>
    `;
  }).join("");
}

function getAlerts(facilitySet) {
  return facilitySet.flatMap((facility) => facility.alerts.map((alert, index) => ({
    ...alert,
    facilityId: facility.id,
    facilityName: facility.name,
    key: `${facility.id}-${index}-${alert.title}`
  }))).filter((alert) => !state.acknowledged.has(alert.key))
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}

function renderAlerts(facilitySet) {
  const alerts = getAlerts(facilitySet);
  els.signalCount.textContent = alerts.length;

  if (!alerts.length) {
    els.alertList.innerHTML = `<div class="empty-state">No active signals in this view.</div>`;
    return;
  }

  els.alertList.innerHTML = alerts.slice(0, 8).map((alert) => {
    const sevClass = alert.severity === "danger" ? "danger" : alert.severity === "warn" ? "warn" : "";
    return `
      <article class="alert-item">
        <div class="alert-head">
          <span class="alert-title">${escapeHtml(alert.title)}</span>
          <span class="status-badge ${sevClass}">${escapeHtml(severityLabel(alert.severity))}</span>
        </div>
        <div class="alert-body">${escapeHtml(alert.body)}</div>
        <div class="alert-meta">${escapeHtml(alert.facilityName)} | ${escapeHtml(alert.time)} ago</div>
        <div class="alert-actions">
          <button class="text-button" type="button" data-open-facility="${escapeHtml(alert.facilityId)}">Open</button>
          <button class="text-button" type="button" data-ack="${escapeHtml(alert.key)}">Acknowledge</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderRnGrid(facilitySet) {
  els.rnGrid.innerHTML = regionalRns.map((rn) => {
    const rnFacilities = facilitySet.filter((facility) => facility.rn === rn.name);
    const base = rnFacilities;
    const late = base.reduce((sum, facility) => sum + facility.mdsAudit.late, 0);
    const openActions = base.reduce((sum, facility) => sum + facility.actions.length, 0);
    const priority = base.filter(isPriority).length;
    const avgRisk = base.length ? round(avg(base.map((facility) => facility.risk))) : 0;
    const sev = base.length ? severityForRisk(avgRisk) : "normal";
    const muted = rnFacilities.length ? "" : "tiny-note";

    return `
      <article class="rn-card" data-rn="${escapeHtml(rn.name)}">
        <div class="rn-card-top">
          <div>
            <h3>${escapeHtml(rn.name.replace(", RN", ""))}</h3>
            <span class="${muted}">${escapeHtml(rn.region)} region</span>
          </div>
          <div class="avatar" aria-hidden="true">${escapeHtml(rn.initials)}</div>
        </div>
        <span class="status-badge ${sev === "danger" ? "danger" : sev === "warn" ? "warn" : ""}">${escapeHtml(severityLabel(sev))}</span>
        <div class="rn-stat-list">
          <div class="rn-stat"><span>Facilities</span><strong>${base.length}</strong></div>
          <div class="rn-stat"><span>Avg risk</span><strong>${base.length ? avgRisk : "--"}</strong></div>
          <div class="rn-stat"><span>Priority</span><strong>${priority}</strong></div>
          <div class="rn-stat"><span>Late MDS</span><strong>${late}</strong></div>
          <div class="rn-stat"><span>Open actions</span><strong>${openActions}</strong></div>
        </div>
      </article>
    `;
  }).join("");
}

function renderMds(facilitySet) {
  const summary = summarize(facilitySet);
  const compliance = facilitySet.length ? round(avg(facilitySet.map((facility) => facility.mdsAudit.carePlan))) : 0;
  const variance = facilitySet.length ? round(avg(facilitySet.map((facility) => facility.mdsAudit.ggVariance)), 1) : 0;

  const tiles = [
    { label: "Due in 7 days", value: summary.mdsDue, severity: "normal" },
    { label: "Late items", value: summary.lateMds, severity: summary.lateMds > 10 ? "danger" : summary.lateMds > 3 ? "warn" : "normal" },
    { label: "Validation rejects", value: summary.rejections, severity: summary.rejections > 4 ? "danger" : summary.rejections > 0 ? "warn" : "normal" },
    { label: "Care plan match", value: `${compliance}%`, severity: compliance < 80 ? "danger" : compliance < 88 ? "warn" : "normal" }
  ];

  els.mdsSummary.innerHTML = tiles.map((tile) => `
    <div class="mds-tile">
      <span class="metric-label">${escapeHtml(tile.label)}</span>
      <strong>${escapeHtml(tile.value)}</strong>
      <span class="status-badge ${tile.severity === "danger" ? "danger" : tile.severity === "warn" ? "warn" : ""}">${escapeHtml(severityLabel(tile.severity))}</span>
    </div>
  `).join("");

  const work = [...facilitySet]
    .sort((a, b) => (b.mdsAudit.late * 3 + b.mdsAudit.rejections * 2 + b.mdsAudit.ggVariance) - (a.mdsAudit.late * 3 + a.mdsAudit.rejections * 2 + a.mdsAudit.ggVariance))
    .slice(0, 5);

  els.mdsWorklist.innerHTML = `
    <div class="mds-work-item">
      <strong>Average GG variance: ${variance}%</strong>
      <span class="tiny-note">Functional coding drift over selected view.</span>
    </div>
    ${work.map((facility) => `
      <button class="mds-work-item text-button" type="button" data-open-facility="${escapeHtml(facility.id)}">
        <strong>${escapeHtml(facility.name)}</strong>
        <span class="tiny-note">${facility.mdsAudit.late} late | ${facility.mdsAudit.rejections} rejects | ${facility.mdsAudit.ggVariance}% GG variance</span>
      </button>
    `).join("")}
  `;
}

function renderHeatmap(facilitySet) {
  if (!facilitySet.length) {
    els.heatmapWrap.innerHTML = `<div class="empty-state">No heatmap data for current filters.</div>`;
    return;
  }

  const header = `
    <div class="heat-row">
      <div class="heat-head">Facility</div>
      ${domains.map((domain) => `<div class="heat-head">${escapeHtml(domain[1])}</div>`).join("")}
    </div>
  `;

  const rows = facilitySet.map((facility) => `
    <div class="heat-row">
      <button class="heat-cell heat-label text-button" type="button" data-open-facility="${escapeHtml(facility.id)}">${escapeHtml(facility.name)}</button>
      ${domains.map(([key]) => {
        const score = facility.heat[key];
        return `<div class="heat-cell heat-score ${heatClass(score)}">${score}%</div>`;
      }).join("")}
    </div>
  `).join("");

  els.heatmapWrap.innerHTML = `<div class="heatmap">${header}${rows}</div>`;
}

function getActions(facilitySet) {
  return facilitySet.flatMap((facility) => facility.actions.map((action, index) => ({
    ...action,
    key: `${facility.id}-action-${index}`,
    facilityId: facility.id,
    facilityName: facility.name,
    rn: facility.rn
  }))).sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}

function renderActions(facilitySet) {
  const actions = getActions(facilitySet);
  if (!actions.length) {
    els.actionGrid.innerHTML = `<div class="empty-state">No open actions in this view.</div>`;
    return;
  }

  els.actionGrid.innerHTML = actions.slice(0, 12).map((action) => {
    const sevClass = action.severity === "danger" ? "danger" : action.severity === "warn" ? "warn" : "";
    return `
      <article class="action-card">
        <span class="status-badge ${sevClass}">${escapeHtml(action.type)}</span>
        <h3>${escapeHtml(action.title)}</h3>
        <span class="owner">${escapeHtml(action.facilityName)} | ${escapeHtml(action.owner)}</span>
        <footer>
          <strong>${escapeHtml(action.due)}</strong>
          <button class="text-button" type="button" data-open-facility="${escapeHtml(action.facilityId)}">Open</button>
        </footer>
      </article>
    `;
  }).join("");
}
