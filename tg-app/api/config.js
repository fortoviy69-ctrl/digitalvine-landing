const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const username = ((req.query.u || 'svetlana_loza') + '').replace(/^@/, '');

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  const specRes = await fetch(
    `${SUPABASE_URL}/rest/v1/specialists?username=eq.${encodeURIComponent(username)}&select=id,display_name,bio,photo_url,bot_username,plan,theme`,
    { headers }
  );

  const specialists = await specRes.json();
  if (!Array.isArray(specialists) || !specialists.length) {
    return res.status(404).json({ error: 'Specialist not found' });
  }

  const specialist = specialists[0];

  const servRes = await fetch(
    `${SUPABASE_URL}/rest/v1/services?specialist_id=eq.${specialist.id}&is_active=eq.true&order=sort_order`,
    { headers }
  );

  const services = await servRes.json();

  return res.status(200).json({
    specialist: {
      username,
      display_name: specialist.display_name,
      bio:          specialist.bio,
      photo_url:    specialist.photo_url,
      bot_username: specialist.bot_username,
      theme:        specialist.theme || {}
    },
    services: Array.isArray(services) ? services.map(s => ({
      id:          s.id,
      title:       s.title,
      description: s.description,
      icon:        s.icon,
      sort_order:  s.sort_order
    })) : []
  });
}
