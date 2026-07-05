exports.handler = async function() {
  return { statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'netlify workflow backend is reachable', gpt_enabled: Boolean(process.env.OPENAI_API_KEY), model: process.env.OPENAI_MODEL || 'gpt-4.1-mini' }) };
};
