<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Votre compte Gestion Evaluation RH</title>
</head>
<body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;background:#f1f5f9">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,.08)">
          <tr>
            <td style="padding:28px 32px;background:#064e3b;color:#ffffff">
              <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#a7f3d0">Groupe Premium</div>
              <h1 style="margin:8px 0 0;font-size:24px">Gestion Evaluation RH</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <p style="margin:0 0 18px;font-size:16px">Bonjour <strong>{{ $name }}</strong>,</p>
              <p style="margin:0 0 22px;line-height:1.65;color:#475569">
                Votre compte professionnel a ete cree. Utilisez les identifiants temporaires ci-dessous pour effectuer votre premiere connexion.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
                <tr>
                  <td style="padding:18px">
                    <div style="font-size:12px;color:#64748b">Adresse de connexion</div>
                    <div style="margin-top:4px;font-weight:700">{{ $email }}</div>

                    <div style="margin-top:16px;font-size:12px;color:#64748b">Mot de passe temporaire</div>
                    <div style="margin-top:4px;font-family:Consolas,monospace;font-size:18px;font-weight:700;letter-spacing:1px">{{ $temporaryPassword }}</div>
                  </td>
                </tr>
              </table>

              <div style="margin:26px 0;text-align:center">
                <a href="{{ $loginUrl }}" style="display:inline-block;padding:13px 24px;border-radius:10px;background:#047857;color:#ffffff;text-decoration:none;font-weight:700">Acceder a l'application</a>
              </div>

              <p style="margin:0;padding:14px;border-radius:10px;background:#fffbeb;color:#92400e;font-size:13px;line-height:1.5">
                <strong>Securite :</strong> ce mot de passe est temporaire. La plateforme vous demandera de choisir un nouveau mot de passe avant d'acceder au tableau de bord.
              </p>

              <p style="margin:22px 0 0;font-size:12px;color:#64748b">
                Si vous n'etes pas a l'origine de cette demande, contactez la Direction RH. Ne transferez jamais cet email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#f8fafc;text-align:center;font-size:11px;color:#94a3b8">
              Email automatique. Merci de ne pas repondre.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
