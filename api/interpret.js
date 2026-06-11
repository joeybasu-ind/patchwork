// api/interpret.js
// Vercel serverless function — sends a natural language query to Claude,
// which returns structured geo + search parameters for ArcGIS queries.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { query } = req.body
  if (!query) return res.status(400).json({ error: 'query is required' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  const systemPrompt = `You are a commercial real estate search engine for Indiana. Given a natural language query, extract structured search parameters and return ONLY valid JSON — no markdown, no explanation.

Indiana markets you understand:
- Hamilton County / Carmel / Noblesville (center ~39.9784, -86.1180)
- Boone County / Lebanon / LEAP Innovation District (~40.0478, -86.4696)
- Tippecanoe County / West Lafayette / Purdue University (~40.4237, -86.9212)
- Monroe County / Bloomington / Indiana University (~39.1653, -86.5264)
- Carmel Arts & Design District (~39.9760, -86.1200)
- Marion County / Indianapolis (~39.7684, -86.1581)

Return this JSON schema exactly:
{
  "lat": number,
  "lng": number,
  "radiusMiles": number,
  "zoom": number,
  "zoningTypes": string[],
  "anchorLabel": string | null,
  "anchorColor": string,
  "county": string,
  "interpretation": string
}

Rules:
- lat/lng: center point of the search area (WGS84)
- radiusMiles: search radius (0.5–5.0, default 1.5)
- zoom: Google Maps zoom level (13–16, use 14 for most searches, 15 for tight urban, 13 for large industrial)
- zoningTypes: array from ["C1","C2","MU","I1","I2"] matching the query intent. Empty array = all types.
- anchorLabel: landmark name if query references one (e.g. "Purdue University"), else null
- anchorColor: hex color for anchor marker (#f59e0b for universities, #ef4444 for industrial, #4f8ef7 for civic)
- county: one of "Hamilton", "Boone", "Tippecanoe", "Monroe", "Marion"
- interpretation: human-readable sentence starting with "Showing..." that describes what the map will display`

  const userPrompt = `Query: "${query}"`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.find(b => b.type === 'text')?.text
    if (!text) return res.status(500).json({ error: 'No response from Claude' })

    // Strip any accidental markdown fencing
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const params = JSON.parse(clean)
    return res.status(200).json(params)
  } catch (err) {
    console.error('interpret error:', err)
    return res.status(500).json({ error: err.message })
  }
}
