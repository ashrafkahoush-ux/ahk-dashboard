// src/ai/gemini.js
export async function askGemini({ projects, roadmap, latestReport }) {
  const payload = {
    model: 'gemini-2.5-pro',
    task: 'dashboard_advisory_v1',
    context: {
      date: new Date().toISOString(),
      org: 'AHKStrategies',
      unit: 'Strategic Mobility Program',
      projects,
      roadmap,
      latestReport
    },
    outputs: [
      'Top 3 risks & mitigations',
      'Top 3 actions next 48 hours',
      'Investor-readiness score (0-100) with 2-line rationale'
    ]
  };

  const res = await fetch('/api/ai-hook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`AI hook failed: ${res.status}`);
  const data = await res.json(); // { advice: "...", metadata: {...} }
  return data;
}
