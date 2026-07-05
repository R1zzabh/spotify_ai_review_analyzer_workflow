function fallbackSummary(reviews = [], reason = 'OPENAI_API_KEY not configured') {
  const text = reviews.map(r => (r.text || '')).join(' ').toLowerCase();
  const count = reviews.length;
  const hit = (words) => words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);
  const themes = [
    ['Repetition loop', hit(['same', 'repeat', 'stale', 'loop', 'again', 'old'])],
    ['Low discovery control', hit(['control', 'steer', 'adventurous', 'hide', 'reset', 'exclude'])],
    ['Context mismatch', hit(['mood', 'workout', 'commute', 'party', 'study', 'vibe'])],
    ['Trust erosion / opacity', hit(['sponsored', 'premium', 'irrelevant', 'viral', 'trust', 'why'])],
    ['Taste profile contamination', hit(['friends', 'family', 'shared', 'polluted', 'kid'])]
  ].map(([theme, score]) => ({
    theme,
    count: Math.max(1, Math.round((score || 1) / Math.max(1, hit(['same','repeat','control','mood','premium','family'])) * count)),
    severity: score > 2 ? 4.2 : 3.2,
    root_cause: `${theme} appears in the submitted feedback corpus.`,
    opportunity: 'Validate through interviews and test an AI-guided discovery control layer.'
  })).sort((a,b)=>b.count-a.count).slice(0,5);
  const evidence = reviews.slice(0,8).map((r, i) => ({
    source: r.source || 'Submitted review', text: r.text || '', theme: themes[i % themes.length]?.theme || 'Discovery friction', segment: r.segment || 'Active Seekers', sentiment: 'Mixed', severity: 3
  }));
  return {
    mode: 'Serverless fallback analyzer',
    fallback_reason: reason,
    generated_at: new Date().toISOString(),
    review_count: count,
    executive_summary: 'The submitted corpus points to a controlled-discovery problem: users want new music, but they need novelty guardrails, profile control and clearer recommendation explanations.',
    top_theme: themes[0]?.theme || 'Repetition loop',
    top_segment: 'Active Seekers',
    opportunity_confidence: 78,
    metrics: { themes_found: themes.length, negative_share: 60, avg_severity: 3.6, high_severity: Math.round(count * .4) },
    themes,
    segments: [
      { segment: 'Active Seekers', count: Math.max(1, Math.round(count*.42)), challenge: 'High discovery intent but stale recommendations.', jtbd: 'When I want new music, I want a guided path from familiar taste to fresh artists.' },
      { segment: 'Context Listeners', count: Math.max(1, Math.round(count*.24)), challenge: 'Needs fresh music without breaking the activity vibe.', jtbd: 'When I listen in a context, I want new songs that preserve the mood.' },
      { segment: 'Profile Repair Users', count: Math.max(1, Math.round(count*.18)), challenge: 'Shared or temporary listening pollutes future recommendations.', jtbd: 'When my profile is polluted, I want to isolate or repair taste signals.' }
    ],
    evidence,
    opportunity: [
      { name: 'TasteBridge AI Discovery Mission', reach: 9, impact: 9, confidence: .82, effort: 6, rice: 11.07, reason: 'Best fit for novelty control, explanations and temporary session intent.' },
      { name: 'Freshness / No-Repeat Controls', reach: 8, impact: 7, confidence: .78, effort: 4, rice: 10.92, reason: 'Simple way to reduce repetition.' },
      { name: 'Taste Profile Repair Wizard', reach: 6, impact: 8, confidence: .72, effort: 6, rice: 5.76, reason: 'Useful for polluted history but narrower segment.' }
    ],
    recommended_mvp: {
      name: 'TasteBridge AI',
      why: 'It turns vague discovery desires into an explicit session contract: novelty level, familiar anchors, exclusions, explanation and learning consent.',
      ai_unlock: 'AI parses fuzzy user intent and explains why each recommended track is a bridge from known taste to new discovery.'
    },
    rows: reviews.map((r, i) => ({ ...r, topTheme: themes[i % themes.length]?.theme || 'Discovery friction', topSegment: r.segment || 'Active Seekers', sentiment: 'Mixed', severity: 3 }))
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const body = req.body || {};
  const reviews = Array.isArray(body.reviews) ? body.reviews.slice(0, 80) : [];
  if (!reviews.length) return res.status(400).json({ error: 'No reviews provided' });
  if (!process.env.OPENAI_API_KEY) return res.status(200).json(fallbackSummary(reviews));

  const prompt = `You are a senior Growth Product Manager for Spotify. Analyze user feedback about music discovery and recommendation repetition. Return ONLY strict JSON matching this structure:
{
  "mode":"GPT serverless analyzer",
  "generated_at":"ISO timestamp",
  "review_count":number,
  "executive_summary":"2-3 sentence grounded synthesis",
  "top_theme":"string",
  "top_segment":"string",
  "opportunity_confidence":number,
  "metrics":{"themes_found":number,"negative_share":number,"avg_severity":number,"high_severity":number},
  "themes":[{"theme":"string","count":number,"severity":number,"root_cause":"string","opportunity":"string"}],
  "segments":[{"segment":"string","count":number,"challenge":"string","jtbd":"When..., I want..., so that..."}],
  "evidence":[{"source":"string","text":"short snippet","theme":"string","segment":"string","sentiment":"Negative|Mixed|Positive","severity":number}],
  "opportunity":[{"name":"string","reach":number,"impact":number,"confidence":number,"effort":number,"rice":number,"reason":"string"}],
  "recommended_mvp":{"name":"string","why":"string","ai_unlock":"string"},
  "rows":[{"source":"string","text":"string","topTheme":"string","topSegment":"string","sentiment":"Negative|Mixed|Positive","severity":number,"jtbd":"string"}]
}
Rules: do not fabricate evidence outside the provided reviews; preserve review meaning; make counts plausible from the given corpus; use Spotify discovery vocabulary; choose TasteBridge AI only if supported by the feedback.`;

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const apiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: prompt },
          { role: 'user', content: JSON.stringify({ product: body.product || 'Spotify', area: body.area || 'Music discovery', sourceMix: body.sourceMix || '', reviews }, null, 2) }
        ],
        text: { format: { type: 'json_object' } }
      })
    });
    if (!apiRes.ok) {
      const err = await apiRes.text();
      return res.status(200).json(fallbackSummary(reviews, 'OpenAI request failed: ' + err.slice(0, 220)));
    }
    const out = await apiRes.json();
    const content = out.output_text || out.output?.flatMap(x => x.content || []).map(c => c.text || '').join('') || '';
    const parsed = JSON.parse(content);
    parsed.mode = parsed.mode || 'GPT serverless analyzer';
    parsed.generated_at = parsed.generated_at || new Date().toISOString();
    parsed.review_count = parsed.review_count || reviews.length;
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(200).json(fallbackSummary(reviews, 'Serverless exception: ' + e.message));
  }
}
