# EventAgenda – eigenständige Version 2

Diese Anwendung ist ein eigenständiger Nachbau von EventAgenda auf Cloudflare Workers + D1. Kein Base44-Abo nötig. Bestehende Veranstaltungen werden **nicht** automatisch übernommen.

## Veranstaltung erstellen

1. **Event erstellen** öffnen, Titel, Organisator und Terminvarianten festlegen.
2. Einen **Einladungscode**, ein **Gäste-Passwort** und ein getrenntes **Veranstalter-Passwort** vergeben.
3. Gäste erhalten den Event-Link und das Gäste-Passwort oder öffnen **Einladung öffnen** mit Code und Passwort.
4. Du kannst jederzeit mit deinem Veranstalter-Passwort die Ergebnisse einsehen und den Termin schliessen.

## Veranstalter / Ergebnisse

Der Veranstalter kann auf jeder Geräteplattform seine Event-Seite öffnen, das **Veranstalter-Passwort** unter **Veranstalterbereich** eingeben und sieht dann in **Abstimmungsübersicht** alle Ja / Vielleicht / Nein-Antworten je Termin und Person. Der Veranstalter kann die Ergebnisse als CSV speichern und die Abstimmung abschliessen. Gäste sehen die Antworten nur, wenn diese Funktion beim Erstellen freigegeben wurde (standardmässig deaktiviert).

**Achtung:** Das Veranstalter-Passwort ist die Verwaltungsberechtigung. Der Dienst verfügt derzeit über keine E-Mail-basierte Passwortwiederherstellung. Bewahre das Passwort sicher auf und verwende es nicht für andere Konten.

## Datenschutz / Code

- Passwörter werden serverseitig mit gesalzenem PBKDF2-SHA256 gehasht, bestehende ältere Hashes bleiben lesbar.
- Der öffentliche GitHub-Code enthält **keine** privaten Veranstaltungs- oder Teilnehmerdaten.
- Veranstalter erhalten eine private Antworttabelle. Bei nicht freigegebenen Abstimmungen erhalten Gäste diese Daten über die API nicht.
- Die Datenbank enthält `events`, `responses`, `messages` (schema.sql). Für diese Version sind keine neuen Tabellen erforderlich.
- Der Server benötigt eine Cloudflare D1 Binding-Variable `DB` auf die bestehende Datenbank `eventagenda-db`.

## Deployment

GitHub-Repository `SvenZermatt/eventagenda`, Cloudflare Workers Anwendung `eventagenda`, Deployment `npx wrangler deploy`. Die aktuelle `wrangler.jsonc` bleibt bestehen. Prüfe nach jedem Deployment unter Cloudflare Settings → Bindings, ob `DB` auf `eventagenda-db` zeigt; Wrangler und Dashboard sollten konsistente Bindings haben.

## Hinweise

Diese Version hat noch kein persönliches Konto / keine Accountverwaltung für mehrere Veranstaltungen, keinen Passwort-Reset und keine automatische E-Mail-Einladung. Erst nach erfolgreichem Test die Domain `eventagenda.pro` umstellen.
