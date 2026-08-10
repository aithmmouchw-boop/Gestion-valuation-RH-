<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
          <tr>
            <td style="padding:24px 30px;background:#064e3b;color:#ffffff">
              <div style="font-size:11px;letter-spacing:1.5px;color:#a7f3d0;text-transform:uppercase">Gestion Evaluation RH</div>
              <h1 style="margin:7px 0 0;font-size:21px">{{ $title }}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px">
              <p style="margin:0 0 16px">Bonjour <strong>{{ $name }}</strong>,</p>
              <p style="margin:0;line-height:1.65;color:#475569">{{ $content }}</p>
              <div style="margin:25px 0;text-align:center">
                <a href="{{ $link }}" style="display:inline-block;padding:12px 22px;border-radius:9px;background:#047857;color:#ffffff;text-decoration:none;font-weight:700">Ouvrir l'application</a>
              </div>
              <p style="margin:0;font-size:11px;color:#94a3b8">Message automatique lie a votre role : {{ $roleLabel }}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
