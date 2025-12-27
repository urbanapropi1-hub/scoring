// api/prometeo-callback.js
export default async function handler(req, res) {
  const { code } = req.query;

  // Validación básica
  if (!code) {
    return res.status(400).json({ error: 'No code recibido' });
  }

  try {
    const clientId = 'TU_CLIENT_ID_O_API_KEY'; // Usa tu API Key de Sandbox aquí (la que te dio Prometeo)
    const clientSecret = ''; // En Sandbox suele no necesitar secret, pero si lo tenés, agrégalo
    const redirectUri = 'https://TU-DOMINIO.vercel.app/prometeo-callback'; // Reemplaza con tu dominio real

    // Intercambio de code por access_token
    const tokenResponse = await fetch('https://auth.prometeoapi.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // En Sandbox, usa la API Key como Bearer o Basic Auth
        'Authorization': `Bearer ${clientId}` // O 'Basic ' + btoa(`${clientId}:${clientSecret}`)
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.json();
      return res.status(tokenResponse.status).json({ error: 'Error obteniendo token', details: errData });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Opcional: Obtener cuentas/transacciones inmediatamente
    const accountsResponse = await fetch('https://api.prometeoapi.com/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    let accountsData = {};
    if (accountsResponse.ok) {
      accountsData = await accountsResponse.json();
    }

    // Redirige al frontend con el token o datos (o guarda en sesión)
    // Por simplicidad, redirigimos al home con el token en query (¡NO en producción real!)
    res.redirect(`/?prometeo_token=${accessToken}&accounts=${encodeURIComponent(JSON.stringify(accountsData))}`);

    // En producción: mejor guardar en cookie segura o redirigir con session
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
