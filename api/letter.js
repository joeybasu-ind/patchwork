// api/letter.js
// Vercel serverless function — generates a cold outreach letter via Claude.

const TONE_INSTRUCTIONS = {
  professional: 'Write in a professional, formal tone appropriate for a business letter between investors.',
  conversational: 'Write in a warm, conversational tone — friendly but still businesslike.',
  direct: 'Write a brief, direct letter — no more than 3 short paragraphs. Get to the point quickly.',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { parcel, tone = 'professional' } = req.body
  if (!parcel) return res.status(400).json({ error: 'parcel is required' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  const fmtCur = (n) => {
    if (!n) return '—'
    return n >= 1_000_000 ? '$' + (n / 1_000_000).toFixed(2) + 'M' : '$' + n.toLocaleString()
  }

  const ownerName = parcel.owner?.principal || parcel.owner?.entity || 'Property Owner'

  const prompt = `You are helping a real estate investor draft a cold outreach letter to the owner of a commercial property they identified through public records. The property is not currently listed for sale.

Property: ${parcel.address}, ${parcel.city}
Type: ${parcel.type}
Zoning: ${parcel.zoning}
Last sale: ${fmtCur(parcel.lastSale)}${parcel.lastSaleYear ? ` (${parcel.lastSaleYear})` : ''}
Assessed value: ${fmtCur(parcel.assessed)}
Lot size: ${parcel.acres} acres
${parcel.highlight ? `Context: ${parcel.highlight}` : ''}

Owner: ${parcel.owner?.entity || 'Owner of record'}
${parcel.owner?.principal ? `Principal: ${parcel.owner.principal}, ${parcel.owner.role || 'Managing Member'}` : ''}
${parcel.owner?.holdingYears ? `Years held: ${parcel.owner.holdingYears}` : ''}

${TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional}

Write a letter from the investor (leave sender name as [Your Name] and contact as [Your Phone/Email]). The letter should open with a brief genuine introduction, reference the specific property naturally, express interest in a conversation about its future without pressure, and close with a low-pressure call to action. Feel like it came from a real thoughtful person. Do not include a subject line. Start with the salutation. No commentary outside the letter.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.find(b => b.type === 'text')?.text
    if (!text) return res.status(500).json({ error: 'No response from Claude' })
    return res.status(200).json({ letter: text })
  } catch (err) {
    console.error('letter error:', err)
    return res.status(500).json({ error: err.message })
  }
}
