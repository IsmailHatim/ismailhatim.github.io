/* assets/js/easter-egg.js
   GTNmed-inspired medical temporal graph visualization.
   Minimal Mistakes friendly: no dependencies, safe to load globally.
*/

(() => {
  "use strict";

  // --- Konami sequence (key codes) ---
  const KONAMI = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a"
  ];

  let buffer = [];

  // --- Node types with colors (GTNmed schema) ---
  const NODE_TYPES = {
    patient:   { color: "#8B5CF6", label: "Patient",   icon: "P" },
    visit:     { color: "#3B82F6", label: "Visit",     icon: "V" },
    drug:      { color: "#10B981", label: "Drug",      icon: "D" },
    diagnosis: { color: "#F59E0B", label: "Diagnosis", icon: "Dx" },
    lab:       { color: "#EF4444", label: "Lab",       icon: "L" },
    outcome:   { color: "#EC4899", label: "Outcome",   icon: "O" }
  };

  // --- Edge types ---
  const EDGE_TYPES = {
    temporal:   { color: "#8B5CF6", label: "Temporal",   dash: [] },
    relational: { color: "#6B7280", label: "Relational", dash: [4, 4] },
    attention:  { color: "#F59E0B", label: "Attention",  dash: [] }
  };

  // Avoid triggering in inputs / textareas
  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === "input" || tag === "textarea" || el.isContentEditable;
  }

  function onKeyDown(e) {
    if (isTypingTarget(document.activeElement)) return;

    const key = (e.key || "").toLowerCase();
    const normalized = (e.key.startsWith("Arrow") ? e.key : key);

    buffer.push(normalized);
    if (buffer.length > KONAMI.length) buffer.shift();

    const match = buffer.every((k, i) => k === KONAMI[i]);
    if (match) {
      buffer = [];
      triggerEasterEgg();
    }

    // Close with Escape if open
    if (e.key === "Escape") closeOverlay();
  }

  // --- Overlay creation ---
  const OVERLAY_ID = "ih-easter-overlay";
  const STYLE_ID = "ih-easter-style";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${OVERLAY_ID} {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: grid;
        place-items: center;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 220ms ease;
      }
      #${OVERLAY_ID}.open {
        opacity: 1;
        pointer-events: auto;
      }
      #${OVERLAY_ID} .panel {
        width: min(900px, calc(100vw - 32px));
        max-height: calc(100vh - 32px);
        overflow-y: auto;
        border-radius: 18px;
        padding: 18px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.35);
        position: relative;
        background: rgba(18,18,22,0.95);
        border: 1px solid rgba(255,255,255,0.09);
      }
      #${OVERLAY_ID} .toprow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }
      #${OVERLAY_ID} .title {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.2px;
        color: rgba(255,255,255,0.92);
      }
      #${OVERLAY_ID} .subtitle {
        font-size: 13px;
        color: rgba(255,255,255,0.72);
        margin-top: 2px;
      }
      #${OVERLAY_ID} .closebtn {
        appearance: none;
        border: 0;
        border-radius: 10px;
        padding: 8px 10px;
        cursor: pointer;
        background: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.85);
        transition: transform 120ms ease, background 120ms ease;
      }
      #${OVERLAY_ID} .closebtn:hover {
        background: rgba(255,255,255,0.12);
        transform: translateY(-1px);
      }
      #${OVERLAY_ID} .grid {
        display: grid;
        grid-template-columns: 1.4fr 0.6fr;
        gap: 14px;
      }
      @media (max-width: 800px) {
        #${OVERLAY_ID} .grid {
          grid-template-columns: 1fr;
        }
      }
      #${OVERLAY_ID} .card {
        border-radius: 14px;
        padding: 14px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.07);
      }
      #${OVERLAY_ID} .hint {
        font-size: 12px;
        color: rgba(255,255,255,0.70);
        line-height: 1.35;
      }
      #${OVERLAY_ID} .section-title {
        font-size: 13px;
        font-weight: 600;
        color: rgba(255,255,255,0.85);
        margin-bottom: 8px;
      }
      #${OVERLAY_ID} .node-types {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
      }
      #${OVERLAY_ID} .node-btn {
        appearance: none;
        border: 2px solid;
        border-radius: 8px;
        padding: 6px 10px;
        cursor: pointer;
        background: rgba(0,0,0,0.3);
        color: rgba(255,255,255,0.90);
        transition: transform 120ms ease, background 120ms ease;
        font-size: 12px;
        font-weight: 500;
      }
      #${OVERLAY_ID} .node-btn:hover {
        transform: translateY(-1px);
      }
      #${OVERLAY_ID} .node-btn.selected {
        background: rgba(255,255,255,0.15);
      }
      #${OVERLAY_ID} .edge-types {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
      }
      #${OVERLAY_ID} .edge-btn {
        appearance: none;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        padding: 6px 10px;
        cursor: pointer;
        background: rgba(255,255,255,0.07);
        color: rgba(255,255,255,0.90);
        transition: transform 120ms ease, background 120ms ease;
        font-size: 12px;
      }
      #${OVERLAY_ID} .edge-btn:hover {
        background: rgba(255,255,255,0.12);
        transform: translateY(-1px);
      }
      #${OVERLAY_ID} .action {
        appearance: none;
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 12px;
        padding: 10px 12px;
        cursor: pointer;
        background: rgba(255,255,255,0.07);
        color: rgba(255,255,255,0.90);
        transition: transform 120ms ease, background 120ms ease;
        font-size: 13px;
      }
      #${OVERLAY_ID} .action:hover {
        background: rgba(255,255,255,0.10);
        transform: translateY(-1px);
      }
      #${OVERLAY_ID} .btnrow {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 10px;
      }
      #${OVERLAY_ID} canvas {
        width: 100%;
        height: 320px;
        border-radius: 12px;
        display: block;
        background: radial-gradient(circle at 20% 20%, rgba(139,92,246,0.12), transparent 55%),
                    radial-gradient(circle at 70% 60%, rgba(59,130,246,0.12), transparent 60%),
                    rgba(0,0,0,0.35);
        border: 1px solid rgba(255,255,255,0.08);
        cursor: crosshair;
      }
      #${OVERLAY_ID} .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
      }
      #${OVERLAY_ID} .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        color: rgba(255,255,255,0.7);
      }
      #${OVERLAY_ID} .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      #${OVERLAY_ID} .legend-line {
        width: 20px;
        height: 2px;
      }
      #${OVERLAY_ID} .kbd {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.12);
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 11px;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;

    // Build node type buttons
    const nodeButtons = Object.entries(NODE_TYPES).map(([key, val]) =>
      `<button class="node-btn ${key === 'visit' ? 'selected' : ''}" data-type="${key}"
        style="border-color: ${val.color}; color: ${val.color};" type="button">
        ${val.label}
      </button>`
    ).join("");

    // Build edge pulse buttons
    const edgeButtons = Object.entries(EDGE_TYPES).map(([key, val]) =>
      `<button class="edge-btn" data-edge="${key}" type="button" style="border-left: 3px solid ${val.color};">
        Pulse ${val.label}
      </button>`
    ).join("");

    // Build legend
    const nodeLegend = Object.entries(NODE_TYPES).map(([key, val]) =>
      `<div class="legend-item"><div class="legend-dot" style="background: ${val.color};"></div>${val.label}</div>`
    ).join("");

    const edgeLegend = Object.entries(EDGE_TYPES).slice(0, 2).map(([key, val]) =>
      `<div class="legend-item"><div class="legend-line" style="background: ${val.color}; ${val.dash.length ? 'background: repeating-linear-gradient(90deg, ' + val.color + ' 0px, ' + val.color + ' 4px, transparent 4px, transparent 8px);' : ''}"></div>${val.label}</div>`
    ).join("");

    overlay.innerHTML = `
      <div class="panel" role="dialog" aria-modal="true" aria-label="GTNmed Graph Demo">
        <div class="toprow">
          <div>
            <div class="title">GTN<sub>med</sub> Mode Unlocked</div>
            <div class="subtitle">Medical Temporal Graph Visualization - PhD subject</div>
          </div>
          <button class="closebtn" type="button" aria-label="Close">✕</button>
        </div>

        <div class="grid">
          <div class="card">
            <canvas id="ih-egg-canvas"></canvas>
            <div class="legend">
              ${nodeLegend}
              ${edgeLegend}
            </div>
          </div>

          <div class="card">
            <div class="section-title">Add Node</div>
            <div class="node-types" id="ih-node-types">
              ${nodeButtons}
            </div>

            <div class="section-title">Pulse Attention</div>
            <div class="edge-types" id="ih-edge-types">
              ${edgeButtons}
            </div>

            <div class="section-title">Actions</div>
            <div class="btnrow">
              <button class="action" id="ih-egg-sample" type="button">Load Sample</button>
              <button class="action" id="ih-egg-clear" type="button">Clear</button>
            </div>

            <div class="hint" style="margin-top: 14px;">
              <b>Instructions</b><br/>
              • Select a node type, then click canvas to add<br/>
              • Nodes auto-connect based on type rules:<br/>
              &nbsp;&nbsp;- Patient → Visit (temporal)<br/>
              &nbsp;&nbsp;- Visit → Visit (temporal)<br/>
              &nbsp;&nbsp;- Visit → Drug/Diagnosis/Lab/Outcome (relational)<br/>
              • Click "Pulse" to highlight edge types<br/>
              • Close: <span class="kbd">Esc</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Close on background click (but not when clicking panel)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay();
    });

    document.body.appendChild(overlay);

    overlay.querySelector(".closebtn")?.addEventListener("click", closeOverlay);
  }

  // --- Interactive medical graph on canvas ---
  let raf = null;
  let nodes = [];
  let edges = [];
  let pulseState = { type: null, t: 0 };
  let selectedNodeType = "visit";
  let canvasW = 0;
  let canvasH = 0;

  // Sample medical data labels
  const SAMPLE_LABELS = {
    patient: ["Patient"],
    visit: ["Visit 1", "Visit 2", "Visit 3", "ED Visit", "ICU Stay", "Discharge"],
    drug: ["Metformin", "Lisinopril", "Aspirin", "Atorvastatin", "Insulin", "Warfarin"],
    diagnosis: ["Type 2 Diabetes", "Hypertension", "CHF", "COPD", "CKD", "Atrial Fib"],
    lab: ["HbA1c", "Creatinine", "LDL-C", "Troponin", "BNP", "WBC"],
    outcome: ["Readmission", "Mortality", "Deterioration", "Recovery"]
  };

  function getRandomLabel(type) {
    const labels = SAMPLE_LABELS[type] || [type];
    return labels[Math.floor(Math.random() * labels.length)];
  }

  function dist2(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  function dist(a, b) {
    return Math.sqrt(dist2(a, b));
  }

  // Determine edge type based on node types
  function getEdgeType(nodeA, nodeB) {
    const a = nodeA.type;
    const b = nodeB.type;

    // Temporal edges: patient-visit or visit-visit
    if ((a === "patient" && b === "visit") || (a === "visit" && b === "patient")) {
      return "temporal";
    }
    if (a === "visit" && b === "visit") {
      return "temporal";
    }
    // Relational edges: visit to clinical entities
    if (a === "visit" || b === "visit") {
      return "relational";
    }
    // Default
    return "relational";
  }

  // Check if edge should exist based on GTNmed rules
  function shouldConnect(nodeA, nodeB) {
    const a = nodeA.type;
    const b = nodeB.type;

    // Patient connects to visits (temporal)
    if ((a === "patient" && b === "visit") || (a === "visit" && b === "patient")) {
      return true;
    }
    // Visits connect to each other (temporal chain)
    if (a === "visit" && b === "visit") {
      return true;
    }
    // Visits connect to clinical entities (relational)
    const clinical = ["drug", "diagnosis", "lab", "outcome"];
    if ((a === "visit" && clinical.includes(b)) || (b === "visit" && clinical.includes(a))) {
      return true;
    }
    return false;
  }

  function rebuildEdges() {
    edges = [];
    const maxDist = 200;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        if (!shouldConnect(a, b)) continue;

        const d = dist(a, b);
        if (d < maxDist) {
          edges.push({
            i, j,
            type: getEdgeType(a, b)
          });
        }
      }
    }
  }

  function createSampleGraph() {
    nodes = [];
    edges = [];

    const cx = canvasW / 2;
    const cy = canvasH / 2;

    // Create a sample patient trajectory like in Figure 1
    // Patient node
    nodes.push({
      x: 60, y: cy,
      vx: 0, vy: 0,
      type: "patient",
      label: "Patient"
    });

    // Visit 1
    nodes.push({
      x: 180, y: cy,
      vx: 0, vy: 0,
      type: "visit",
      label: "Visit 1"
    });

    // Visit 2
    nodes.push({
      x: 340, y: cy,
      vx: 0, vy: 0,
      type: "visit",
      label: "Visit 2"
    });

    // Visit 3
    nodes.push({
      x: 500, y: cy,
      vx: 0, vy: 0,
      type: "visit",
      label: "Visit 3"
    });

    // Clinical entities for Visit 1
    nodes.push({
      x: 160, y: cy - 80,
      vx: 0, vy: 0,
      type: "drug",
      label: "Metformin"
    });

    nodes.push({
      x: 200, y: cy + 80,
      vx: 0, vy: 0,
      type: "diagnosis",
      label: "Type 2 Diabetes"
    });

    nodes.push({
      x: 140, y: cy + 60,
      vx: 0, vy: 0,
      type: "lab",
      label: "HbA1c"
    });

    // Clinical entities for Visit 2
    nodes.push({
      x: 320, y: cy - 70,
      vx: 0, vy: 0,
      type: "drug",
      label: "Lisinopril"
    });

    nodes.push({
      x: 360, y: cy + 70,
      vx: 0, vy: 0,
      type: "diagnosis",
      label: "Hypertension"
    });

    nodes.push({
      x: 300, y: cy + 90,
      vx: 0, vy: 0,
      type: "lab",
      label: "Creatinine"
    });

    // Clinical entities for Visit 3
    nodes.push({
      x: 480, y: cy - 75,
      vx: 0, vy: 0,
      type: "lab",
      label: "LDL-C"
    });

    nodes.push({
      x: 520, y: cy + 75,
      vx: 0, vy: 0,
      type: "outcome",
      label: "Recovery"
    });

    rebuildEdges();
  }

  function triggerEasterEgg() {
    ensureStyles();
    ensureOverlay();
    openOverlay();
    initCanvas();
  }

  function openOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;
    overlay.classList.add("open");
  }

  function closeOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;
    overlay.classList.remove("open");
    stopLoop();
  }

  function initCanvas() {
    const canvas = document.getElementById("ih-egg-canvas");
    if (!canvas) return;

    // Setup DPR scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvasW = Math.max(400, Math.floor(rect.width));
    canvasH = Math.max(280, Math.floor(rect.height));

    canvas.width = Math.floor(canvasW * dpr);
    canvas.height = Math.floor(canvasH * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Reset state
    nodes = [];
    edges = [];
    pulseState = { type: null, t: 0 };

    // Load sample graph
    createSampleGraph();

    // Node type selection
    const nodeTypeBtns = document.querySelectorAll("#ih-node-types .node-btn");
    nodeTypeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        nodeTypeBtns.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedNodeType = btn.dataset.type;
      });
    });

    // Edge pulse buttons
    const edgeBtns = document.querySelectorAll("#ih-edge-types .edge-btn");
    edgeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        pulseState = { type: btn.dataset.edge, t: 1.0 };
      });
    });

    // Canvas click to add nodes
    canvas.onclick = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      nodes.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        type: selectedNodeType,
        label: getRandomLabel(selectedNodeType)
      });

      rebuildEdges();
    };

    // Action buttons
    document.getElementById("ih-egg-clear")?.addEventListener("click", () => {
      nodes = [];
      edges = [];
    });

    document.getElementById("ih-egg-sample")?.addEventListener("click", () => {
      createSampleGraph();
    });

    startLoop(ctx);
  }

  function startLoop(ctx) {
    stopLoop();

    const tick = () => {
      // Physics - gentle drift
      const friction = 0.98;
      for (const n of nodes) {
        // Small random drift
        n.vx += (Math.random() - 0.5) * 0.02;
        n.vy += (Math.random() - 0.5) * 0.02;

        n.vx *= friction;
        n.vy *= friction;

        n.x += n.vx;
        n.y += n.vy;

        // Bounds bounce
        const margin = 30;
        if (n.x < margin) { n.x = margin; n.vx *= -0.5; }
        if (n.x > canvasW - margin) { n.x = canvasW - margin; n.vx *= -0.5; }
        if (n.y < margin) { n.y = margin; n.vy *= -0.5; }
        if (n.y > canvasH - margin) { n.y = canvasH - margin; n.vy *= -0.5; }
      }

      // Pulse decay
      if (pulseState.t > 0) {
        pulseState.t *= 0.97;
        if (pulseState.t < 0.01) {
          pulseState.t = 0;
          pulseState.type = null;
        }
      }

      // Clear
      ctx.clearRect(0, 0, canvasW, canvasH);

      // Draw edges
      for (const edge of edges) {
        const a = nodes[edge.i];
        const b = nodes[edge.j];
        if (!a || !b) continue;

        const edgeConfig = EDGE_TYPES[edge.type] || EDGE_TYPES.relational;
        let alpha = 0.4;
        let lineWidth = 1.5;

        // Highlight if pulsing this edge type
        if (pulseState.type === edge.type && pulseState.t > 0) {
          alpha = 0.4 + pulseState.t * 0.6;
          lineWidth = 1.5 + pulseState.t * 2;
        }
        // Attention pulse highlights all edges
        if (pulseState.type === "attention" && pulseState.t > 0) {
          alpha = 0.4 + pulseState.t * 0.5;
          lineWidth = 1.5 + pulseState.t * 1.5;
        }

        ctx.strokeStyle = edgeConfig.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(edgeConfig.dash);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // Draw arrow for temporal edges
        if (edge.type === "temporal") {
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          const arrowLen = 8;
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;

          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(
            midX - arrowLen * Math.cos(angle - Math.PI / 6),
            midY - arrowLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(midX, midY);
          ctx.lineTo(
            midX - arrowLen * Math.cos(angle + Math.PI / 6),
            midY - arrowLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
      }

      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Draw nodes
      for (const n of nodes) {
        const config = NODE_TYPES[n.type] || NODE_TYPES.visit;
        const radius = n.type === "patient" ? 20 : 16;

        // Glow effect when pulsing
        let glowRadius = 0;
        if (pulseState.t > 0) {
          glowRadius = pulseState.t * 8;
        }

        if (glowRadius > 0) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = config.color;
          ctx.globalAlpha = pulseState.t * 0.3;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = config.color;
        ctx.fill();

        // Border
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Icon/label inside node
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "bold 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.icon, n.x, n.y);

        // Label below node
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(n.label, n.x, n.y + radius + 12);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  // Install listener
  window.addEventListener("keydown", onKeyDown, { passive: true });
  window.triggerEasterEgg = triggerEasterEgg;
})();
