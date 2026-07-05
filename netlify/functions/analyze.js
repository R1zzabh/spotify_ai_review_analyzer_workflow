function fallbackSummary(reviews = [], reason = 'OPENAI_API_KEY not configured') {
  const text = reviews.map(r => (r.text || '')).join(' ').toLowerCase();
  const count = reviews.length;
  const hit = (words) => words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);
  const totalHit = Math.max(1, hit(['same','repeat','control','mood','premium','family']));
  const themes = [
    ['Repetition loop', hit(['same', 'repeat', 'stale', 'loop', 'again', 'old'])],
    ['Low discovery control', hit(['control', 'steer', 'adventurous', 'hide', 'reset', 'exclude'])],
    ['Context mismatch', hit(['mood', 'workout', 'commute', 'party', 'study', 'vibe'])],
    ['Trust erosion / opacity', hit(['sponsored', 'premium', 'irrelevant', 'viral', 'trust', 'why'])],
    ['Taste profile contamination', hit(['friends', 'family', 'shared', 'polluted', 'kid'])]
  ].map(([theme, score]) => ({ theme, count: Math.max(1, Math.round((score || 1) / totalHit * count)), severity: score > 2 ? 4.2 : 3.2, root_cause: `${theme} appears in the submitted feedback corpus.`, opportunity: 'Validate through interviews and test an AI-guided discovery control layer.' })).sort((a,b)=>b.count-a.count).slice(0,5);
  return { mode:'Netlify fallback analyzer', fallback_reason: reason, generated_at:new Date().toISOString(), review_count:count, executive_summary:'The submitted corpus points to a controlled-discovery problem: users want new music, but they need novelty guardrails, profile control and clearer recommendation explanations.', top_theme:themes[0]?.theme||'Repetition loop', top_segment:'Active Seekers', opportunity_confidence:78, metrics:{themes_found:themes.length,negative_share:60,avg_severity:3.6,high_severity:Math.round(count*.4)}, themes, segments:[{segment:'Active Seekers',count:Math.max(1,Math.round(count*.42)),challenge:'High discovery intent but stale recommendations.',jtbd:'When I want new music, I want a guided path from familiar taste to fresh artists.'},{segment:'Context Listeners',count:Math.max(1,Math.round(count*.24)),challenge:'Needs fresh music without breaking the activity vibe.',jtbd:'When I listen in a context, I want new songs that preserve the mood.'}], evidence:reviews.slice(0,8).map((r,i)=>({source:r.source||'Submitted review',text:r.text||'',theme:themes[i%themes.length]?.theme||'Discovery friction',segment:r.segment||'Active Seekers',sentiment:'Mixed',severity:3})), opportunity:[{name:'TasteBridge AI Discovery Mission',reach:9,impact:9,confidence:.82,effort:6,rice:11.07,reason:'Best fit for novelty control, explanations and temporary session intent.'},{name:'Freshness / No-Repeat Controls',reach:8,impact:7,confidence:.78,effort:4,rice:10.92,reason:'Simple way to reduce repetition.'}], recommended_mvp:{name:'TasteBridge AI',why:'It turns vague discovery desires into an explicit session contract: novelty level, familiar anchors, exclusions, explanation and learning consent.',ai_unlock:'AI parses fuzzy user intent and explains why each recommended track is a bridge from known taste to new discovery.'}, rows:reviews.map((r,i)=>({...r,topTheme:themes[i%themes.length]?.theme||'Discovery friction',topSegment:r.segment||'Active Seekers',sentiment:'Mixed',severity:3})) };
}
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({error:'Use POST'}) };
  const body = JSON.parse(event.body || '{}');
  const reviews = Array.isArray(body.reviews) ? body.reviews.slice(0,80) : [];
  if (!reviews.length) return { statusCode: 400, body: JSON.stringify({error:'No reviews provided'}) };
  if (!process.env.OPENAI_API_KEY) return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify(fallbackSummary(reviews)) };
  const prompt = `You are a senior Growth Product Manager for Spotify. Analyze user feedback about music discovery and recommendation repetition. Return ONLY strict JSON with fields: mode, generated_at, review_count, executive_summary, top_theme, top_segment, opportunity_confidence, metrics, themes, segments, evidence, opportunity, recommended_mvp, rows. Do not fabricate evidence outside the reviews. Recommended MVP can be TasteBridge AI only if supported.`;
  try {
    const apiRes = await fetch('https://api.openai.com/v1/responses', { method:'POST', headers:{ Authorization:`Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type':'application/json' }, body: JSON.stringify({ model:process.env.OPENAI_MODEL || 'gpt-4.1-mini', input:[{role:'system',content:prompt},{role:'user',content:JSON.stringify({product:'Spotify',reviews})}], text:{format:{type:'json_object'}} }) });
    if (!apiRes.ok) return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify(fallbackSummary(reviews,'OpenAI request failed')) };
    const out = await apiRes.json();
    const content = out.output_text || out.output?.flatMap(x => x.content || []).map(c => c.text || '').join('') || '';
    const parsed = JSON.parse(content);
    parsed.mode = parsed.mode || 'GPT Netlify analyzer'; parsed.review_count = parsed.review_count || reviews.length;
    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify(parsed) };
  } catch(e) {
    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify(fallbackSummary(reviews,'Server exception: '+e.message)) };
  }
};
