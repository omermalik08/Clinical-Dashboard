function showFacilityDetail(facilityId) {
  const facility = findFacility(facilityId);
  if (!facility) return;
  const sev = severityForRisk(facility.risk);
  const sevClass = sev === "danger" ? "danger" : sev === "warn" ? "warn" : "";
  const domainList = domains.map(([key, label]) => ({ label, score: facility.heat[key] }));
  const topGaps = [...domainList].sort((a, b) => a.score - b.score).slice(0, 3);

  els.facilityDetail.innerHTML = `
    <div class="detail-content">
      <div class="detail-hero">
        <div>
          <p class="eyebrow">${escapeHtml(facility.region)} region | ${escapeHtml(facility.rn)}</p>
          <h2>${escapeHtml(facility.name)}</h2>
          <p class="subline">DON ${escapeHtml(facility.don)} | MDS ${escapeHtml(facility.mds)} | Census ${facility.census}/${facility.beds}</p>
        </div>
        <div>
          <span class="status-badge ${sevClass}">${escapeHtml(severityLabel(sev))}</span>
          <div class="metric-value" style="margin-top: 10px;">${facility.risk}</div>
          <span class="tiny-note">Clinical risk index</span>
        </div>
      </div>

      <div class="detail-metrics">
        <div class="detail-metric"><span class="metric-label">Survey ready</span><strong>${facility.survey}%</strong></div>
        <div class="detail-metric"><span class="metric-label">DON audit</span><strong>${facility.donAudit.score}%</strong></div>
        <div class="detail-metric"><span class="metric-label">Late MDS</span><strong>${facility.mdsAudit.late}</strong></div>
        <div class="detail-metric"><span class="metric-label">Open incidents</span><strong>${facility.measures.incidents}</strong></div>
      </div>

      <div class="detail-columns">
        <section>
          <h3>Immediate actions</h3>
          <ul class="detail-list">
            ${facility.actions.map((action) => `
              <li>
                <strong>${escapeHtml(action.title)}</strong>
                <div class="tiny-note">${escapeHtml(action.owner)} | due ${escapeHtml(action.due)}</div>
              </li>
            `).join("") || `<li>No active action items.</li>`}
          </ul>
        </section>
        <section>
          <h3>Lowest audit domains</h3>
          <ul class="detail-list">
            ${topGaps.map((gap) => `
              <li>
                <strong>${escapeHtml(gap.label)}: ${gap.score}%</strong>
                <div class="tiny-note">${gap.score < 75 ? "Requires RN validation" : "Watch for drift"}</div>
              </li>
            `).join("")}
          </ul>
        </section>
      </div>

      <div class="detail-columns">
        <section>
          <h3>MDS and quality</h3>
          <ul class="detail-list">
            <li><strong>${facility.mdsAudit.due7} assessments due in 7 days</strong><div class="tiny-note">${facility.mdsAudit.rejections} validation rejects | ${facility.mdsAudit.ggVariance}% GG variance</div></li>
            <li><strong>${facility.mdsAudit.carePlan}% care plan match</strong><div class="tiny-note">MDS to care plan crosswalk completion.</div></li>
            <li><strong>${facility.measures.rehosp}% rehospitalization signal</strong><div class="tiny-note">${facility.measures.falls} falls rate | ${facility.measures.wounds} wound alerts</div></li>
          </ul>
        </section>
        <section>
          <h3>Next 24 hours</h3>
          <ul class="detail-list">
            ${facility.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      </div>
    </div>
  `;

  if (typeof els.facilityDialog.showModal === "function") {
    els.facilityDialog.showModal();
  } else {
    els.facilityDialog.setAttribute("open", "");
  }
}

function renderBrief() {
  const facilitySet = getVisibleFacilities();
  const summary = summarize(facilitySet);
  const priority = [...facilitySet].filter(isPriority).sort((a, b) => b.risk - a.risk).slice(0, 5);
  const urgentActions = getActions(facilitySet).filter((action) => action.severity === "danger").slice(0, 6);
  const rnPressure = regionalRns.map((rn) => {
    const rnFacilities = facilitySet.filter((facility) => facility.rn === rn.name);
    return {
      rn: rn.name,
      risk: rnFacilities.length ? round(avg(rnFacilities.map((facility) => facility.risk))) : 0,
      priority: rnFacilities.filter(isPriority).length
    };
  }).sort((a, b) => b.risk - a.risk)[0];

  const brief = [
    "Executive clinical brief",
    new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    "",
    `Portfolio in view: ${summary.count} SNFs`,
    `Average clinical risk: ${summary.avgRisk}`,
    `Priority facilities: ${summary.priorityFacilities}`,
    `Late MDS items: ${summary.lateMds}`,
    `DON audits due or below target: ${summary.overdueDon}`,
    "",
    "Top facility priorities:",
    ...(priority.length ? priority.map((facility) => `- ${facility.name}: risk ${facility.risk}, survey ${facility.survey}%, ${facility.mdsAudit.late} late MDS`) : ["- None in current view"]),
    "",
    "Urgent action queue:",
    ...(urgentActions.length ? urgentActions.map((action) => `- ${action.facilityName}: ${action.title} (${action.owner}, ${action.due})`) : ["- No urgent actions in current view"]),
    "",
    "RN pressure point:",
    rnPressure && rnPressure.risk ? `${rnPressure.rn}: average risk ${rnPressure.risk}, ${rnPressure.priority} priority facilities` : "No RN pressure point in current filtered view"
  ].join("\n");

  els.briefContent.innerHTML = `
    <div class="detail-content">
      <h2>Executive Brief</h2>
      <pre>${escapeHtml(brief)}</pre>
    </div>
  `;

  if (typeof els.briefDialog.showModal === "function") {
    els.briefDialog.showModal();
  } else {
    els.briefDialog.setAttribute("open", "");
  }
}

function renderHuddle() {
  const facilitySet = getVisibleFacilities();
  const urgentActions = getActions(facilitySet).filter((action) => action.severity === "danger").slice(0, 8);
  const mdsWatch = [...facilitySet].sort((a, b) => b.mdsAudit.late - a.mdsAudit.late).slice(0, 4);
  const brief = [
    "Regional RN huddle agenda",
    "",
    "1. Open with the priority facilities and current risk movement.",
    "2. Assign same-day owners for DON and MDS exceptions.",
    "3. Confirm survey readiness domains under 75 percent.",
    "4. Close with deadline, proof item, and follow-up time.",
    "",
    "Same-day owner list:",
    ...(urgentActions.length ? urgentActions.map((action) => `- ${action.facilityName}: ${action.title} | ${action.owner}`) : ["- No urgent same-day items in current view"]),
    "",
    "MDS watch:",
    ...(mdsWatch.length ? mdsWatch.map((facility) => `- ${facility.name}: ${facility.mdsAudit.late} late, ${facility.mdsAudit.rejections} rejects`) : ["- No MDS watch items"])
  ].join("\n");

  els.briefContent.innerHTML = `
    <div class="detail-content">
      <h2>RN Huddle</h2>
      <pre>${escapeHtml(brief)}</pre>
    </div>
  `;

  if (typeof els.briefDialog.showModal === "function") {
    els.briefDialog.showModal();
  } else {
    els.briefDialog.setAttribute("open", "");
  }
}

function updateTimestamp() {
  els.lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function render() {
  const facilitySet = getVisibleFacilities();
  renderKpis(facilitySet);
  renderTrend(facilitySet);
  renderFacilityCards(facilitySet);
  renderAlerts(facilitySet);
  renderFacilityRows(facilitySet);
  renderRnGrid(facilitySet);
  renderMds(facilitySet);
  renderHeatmap(facilitySet);
  renderActions(facilitySet);
  updateTimestamp();
}

function bindEvents() {
  els.regionFilter.addEventListener("change", (event) => {
    state.region = event.target.value;
    render();
  });

  els.rnFilter.addEventListener("change", (event) => {
    state.rn = event.target.value;
    render();
  });

  els.searchFilter.addEventListener("input", (event) => {
    state.search = event.target.value;
    render();
  });

  els.priorityOnly.addEventListener("change", (event) => {
    state.priorityOnly = event.target.checked;
    render();
  });

  document.querySelectorAll(".segmented button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".segmented button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.window = button.dataset.window;
      render();
    });
  });

  document.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-open-facility]");
    if (openButton) {
      showFacilityDetail(openButton.dataset.openFacility);
      return;
    }

    const ackButton = event.target.closest("[data-ack]");
    if (ackButton) {
      state.acknowledged.add(ackButton.dataset.ack);
      render();
      return;
    }

    const facilityCard = event.target.closest("[data-facility-id]");
    if (facilityCard) {
      showFacilityDetail(facilityCard.dataset.facilityId);
      return;
    }

    const rnCard = event.target.closest(".rn-card[data-rn]");
    if (rnCard) {
      state.rn = rnCard.dataset.rn;
      els.rnFilter.value = state.rn;
      render();
    }
  });

  document.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-facility-id]")) {
      event.preventDefault();
      showFacilityDetail(event.target.dataset.facilityId);
    }
  });

  document.getElementById("refreshBtn").addEventListener("click", () => {
    updateTimestamp();
    document.querySelector(".pulse-dot").animate([
      { transform: "scale(1)" },
      { transform: "scale(1.6)" },
      { transform: "scale(1)" }
    ], { duration: 520, easing: "ease-out" });
  });

  document.getElementById("briefBtn").addEventListener("click", renderBrief);
  document.getElementById("huddleBtn").addEventListener("click", renderHuddle);
  document.getElementById("printBtn").addEventListener("click", () => window.print());
}

populateFilters();
bindEvents();
render();
setInterval(updateTimestamp, 60000);
