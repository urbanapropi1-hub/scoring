// api/prometeo-token.js
export default async function handler(req, res) {
  const { code } = req.body;
  const clientId = 'TU_CLIENT_ID';
  const clientSecret = 'TU_CLIENT_SECRET'; // Obtén de dashboard Prometeo

  const response = await fetch('https://auth.prometeoapi.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://tu-dominio.vercel.app/callback'
    })
  });

  const data = await response.json();
  res.json(data);
}
