(function clinicalFeedsLayer() {
  if (typeof facilities === "undefined" || typeof state === "undefined") return;

  const feedItems = [
    { type: "pharmacy", facilityId: "cedar-grove", residentId: "R-104", item: "Antibiotic stop date mismatch", detail: "Order end date differs from eMAR schedule.", age: "42m", owner: "Regional RN", severity: "danger", action: "Confirm order, eMAR, and DON follow-up." },
    { type: "pharmacy", facilityId: "green-valley", residentId: "R-218", item: "New high-risk med order", detail: "Pharmacy change requires same-day clinical review.", age: "1h", owner: "DON", severity: "warn", action: "Document review and update care plan trigger." },
    { type: "therapy", facilityId: "oak-terrace", residentId: "R-077", item: "Therapy plan update", detail: "Therapy note indicates transfer change not reflected in care plan.", age: "2h", owner: "MDS", severity: "warn", action: "Reconcile therapy update with care plan." },
    { type: "therapy", facilityId: "pine-hollow", residentId: "R-331", item: "Discharge goal variance", detail: "Therapy discharge goal changed after MDS lock date.", age: "Today", owner: "MDS", severity: "normal", action: "Review ARD impact and update summary note." },
    { type: "lab", facilityId: "cedar-grove", residentId: "R-090", item: "Abnormal lab unacknowledged", detail: "Critical value flag has no clinical acknowledgement.", age: "38m", owner: "DON", severity: "danger", action: "Acknowledge result and verify physician notification." },
    { type: "lab", facilityId: "birch-manor", residentId: "R-142", item: "Culture final posted", detail: "Final result available after preliminary treatment note.", age: "3h", owner: "Regional RN", severity: "warn", action: "Compare result to current antibiotic order." },
    { type: "radiology", facilityId: "harbor-view", residentId: "R-260", item: "X-ray final available", detail: "Final report posted with follow-up recommendation.", age: "Today", owner: "DON", severity: "warn", action: "Verify provider review and care plan note." },
    { type: "radiology", facilityId: "maple-ridge", residentId: "R-118", item: "Pending imaging result", detail: "Radiology order is complete; final report not yet posted.", age: "4h", owner: "Regional RN", severity: "normal", action: "Track final report before huddle close." }
  ];

  const feedMeta = {
    pharmacy: { label: "Pharmacy", note: "Orders, eMAR mismatches, med changes" },
    therapy: { label: "Therapy", note: "Plan updates, goals, care plan variance" },
    lab: { label: "Lab", note: "Abnormal results and acknowledgements" },
    radiology: { label: "Radiology", note: "Final reports and follow-up status" }
  };

  const tabs = ["Clinical Home", "Residents", "Orders", "eMAR", "Results", "Therapy", "MDS", "Reports"];

  function esc(value) {
    return escapeHtml(value);
  }

  function getFacility(id) {
    return facilities.find((facility) => facility.id === id);
  }

  function visibleIds() {
    if (typeof getVisibleFacilities !== "function") return facilities.map((facility) => facility.id);
    return getVisibleFacilities().map((facility) => facility.id);
  }

  function feedBadge(type) {
    const meta = feedMeta[type] || { label: type };
    return `<span class="feed-badge ${esc(type)}">${esc(meta.label)}</span>`;
  }

  function ensureClinicalLayout() {
    if (!document.querySelector('link[href="clinical-feeds.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "clinical-feeds.css";
      document.head.appendChild(link);
    }

    const nav = document.querySelector(".nav-list");
    if (nav && !nav.querySelector('a[href="#clinical-feeds"]')) {
      const anchor = nav.querySelector('a[href="#score-logic"]') || nav.querySelector('a[href="#audits"]') || nav.lastElementChild;
      anchor.insertAdjacentHTML("beforebegin", `<a href="#clinical-feeds">Clinical Feeds</a>`);
    }

    const controls = document.querySelector(".controls-band");
    if (controls && !document.querySelector(".emr-tabs")) {
      controls.insertAdjacentHTML("afterend", `
        <div class="emr-tabs" role="tablist" aria-label="Clinical workspace">
          ${tabs.map((tab, index) => `<button class="emr-tab ${index === 0 ? "active" : ""}" type="button" role="tab">${esc(tab)}</button>`).join("")}
        </div>
      `);
    }

    const scoreSection = document.getElementById("score-logic");
    if (scoreSection && !document.getElementById("clinical-feeds")) {
      scoreSection.insertAdjacentHTML("beforebegin", `
        <section class="clinical-feeds-section" id="clinical-feeds">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Clinical feeds</p>
              <h2>Pharmacy, therapy, lab, and radiology</h2>
            </div>
            <span class="source-pill">Basic external clinical feeds</span>
          </div>
          <div class="feed-status-grid" id="feedStatusGrid"></div>
          <div class="feed-workbench">
            <aside class="feed-summary-panel" id="feedSummaryPanel"></aside>
            <section class="feed-table-panel">
              <div class="feed-table-head">
                <div>
                  <p class="eyebrow">Exception queue</p>
                  <h3>Orders and results needing clinical review</h3>
                </div>
                <span class="source-pill">Demo resident IDs</span>
              </div>
              <div class="feed-table-wrap">
                <table class="feed-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Facility</th>
                      <th>Resident ID</th>
                      <th>Item</th>
                      <th>Age</th>
                      <th>Owner</th>
                      <th>Next action</th>
                    </tr>
                  </thead>
                  <tbody id="feedRows"></tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      `);
    }
  }

  function currentFeedItems() {
    const ids = new Set(visibleIds());
    return feedItems.filter((item) => ids.has(item.facilityId));
  }

  function renderFeedStatus(items) {
    const el = document.getElementById("feedStatusGrid");
    if (!el) return;
    el.innerHTML = Object.entries(feedMeta).map(([type, meta]) => {
      const matches = items.filter((item) => item.type === type);
      const urgent = matches.filter((item) => item.severity === "danger").length;
      const watch = matches.filter((item) => item.severity === "warn").length;
      return `
        <article class="feed-card">
          <div class="feed-card-top">${feedBadge(type)}<span class="feed-count">${matches.length}</span></div>
          <h3>${esc(meta.label)}</h3>
          <p>${esc(meta.note)}</p>
          <div class="mini-bar ${urgent ? "danger" : watch ? "warn" : ""}" style="--fill: ${Math.max(8, Math.min(100, matches.length * 22))}%"><span></span></div>
          <span class="metric-note">${urgent} priority, ${watch} watch</span>
        </article>
      `;
    }).join("");
  }

  function renderFeedSummary(items) {
    const el = document.getElementById("feedSummaryPanel");
    if (!el) return;
    const priority = items.filter((item) => item.severity === "danger").length;
    const watch = items.filter((item) => item.severity === "warn").length;
    const facilitiesTouched = new Set(items.map((item) => item.facilityId)).size;
    el.innerHTML = `
      <p class="eyebrow">PCC-style worklist</p>
      <h3>Clinical feed status</h3>
      <p>Use this as a compact exception queue beside the facility view, similar to how an EMR keeps orders and results close to the chart workflow.</p>
      <div class="feed-summary-list">
        <div class="feed-count-row"><span>Total exceptions</span><strong>${items.length}</strong></div>
        <div class="feed-count-row"><span>Priority review</span><strong>${priority}</strong></div>
        <div class="feed-count-row"><span>Watch items</span><strong>${watch}</strong></div>
        <div class="feed-count-row"><span>Facilities touched</span><strong>${facilitiesTouched}</strong></div>
      </div>
    `;
  }

  function renderFeedRows(items) {
    const el = document.getElementById("feedRows");
    if (!el) return;
    const ordered = [...items].sort((a, b) => {
      const rank = { danger: 3, warn: 2, normal: 1 };
      return rank[b.severity] - rank[a.severity] || a.type.localeCompare(b.type);
    });
    el.innerHTML = ordered.length ? ordered.map((item) => {
      const facility = getFacility(item.facilityId);
      const severityClass = item.severity === "danger" ? "danger" : item.severity === "warn" ? "warn" : "";
      return `
        <tr>
          <td>${feedBadge(item.type)}</td>
          <td><strong>${esc(facility ? facility.name : item.facilityId)}</strong><span class="feed-action">${esc(facility ? facility.region : "")}</span></td>
          <td><strong>${esc(item.residentId)}</strong></td>
          <td><strong>${esc(item.item)}</strong><span class="feed-action">${esc(item.detail)}</span></td>
          <td><span class="feed-age ${severityClass}">${esc(item.age)}</span></td>
          <td>${esc(item.owner)}</td>
          <td><span class="feed-action">${esc(item.action)}</span></td>
        </tr>
      `;
    }).join("") : `<tr><td colspan="7">No clinical feed exceptions in this view.</td></tr>`;
  }

  function renderClinicalFeeds() {
    ensureClinicalLayout();
    const items = currentFeedItems();
    renderFeedStatus(items);
    renderFeedSummary(items);
    renderFeedRows(items);
  }

  const originalRender = typeof render === "function" ? render : null;
  if (originalRender && !window.__clinicalFeedsRenderWrapped) {
    window.__clinicalFeedsRenderWrapped = true;
    render = function renderWithClinicalFeeds() {
      originalRender();
      renderClinicalFeeds();
    };
  }

  renderClinicalFeeds();
})();
