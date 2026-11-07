# EventAgenda – unabhängiger Neuanfang

Eine neu entwickelte Terminabstimmung (inspiriert von der beschriebenen ursprünglichen EventAgenda-Idee). **Kein Base44-Code, kein Zugriff auf alte Base44-Events und keine automatische Datenmigration.**

## Funktionen

- Veranstaltung mit Beschreibung, Ort und bis zu 20 alternativen Terminblöcken erstellen.
- Mehrtägige Terminvorschläge (Start/Enddatum).
- Einladungslink teilen; Gäste stimmen mit Ja / Vielleicht / Nein ab, ohne Login.
- Live gespeicherte Antworten in Cloudflare D1 (gemeinsame Datenbank, kein Browser-only-Demo-Modus).
- Auswertung nach Zusagen, Teilnehmerliste, CSV-Export, Event abschliessen/wieder öffnen und löschen.
- Private Administratorberechtigung und Antwort-Bearbeitungsschlüssel im jeweiligen Browser (`localStorage`).
- DSGVO-freundlicher Ansatz: keine Tracking-Skripte; keine Google Analytics, keine Drittanbieter-Schriftarten.
- **Demo:** Die Startseite hat eine Testansicht ohne Datenbank. Live-Events brauchen D1.

## Cloudflare Pages Deployment (GitHub-Integration)

### 1. GitHub-Repository anlegen

1. Auf https://github.com/new ein privates Repository, zum Beispiel `eventagenda` anlegen.
2. Die Dateien **aus diesem Verzeichnis** in das Repository hochladen, sodass `public/index.html`, `functions/`, und `schema.sql` direkt im Repo liegen.
3. Repo-Berechtigung für Cloudflare beim Verknüpfen freigeben (Repo kann privat bleiben).

### 2. Website auf Cloudflare Pages bereitstellen

1. Unter https://dash.cloudflare.com/ den Bereich **Workers & Pages** öffnen.
2. **Create application > Pages > Connect to Git** und das GitHub-Repo `eventagenda` wählen.
3. Production branch: `main`. Framework preset: `None`.
4. **Build command:** `exit 0` (oder leer), **Build output directory:** `public`.
5. Deploy. Eine `*.pages.dev`-Testadresse wird angezeigt. Dort funktioniert bereits die Demo.

### 3. Datenbank einrichten (notwendig für echte Events)

1. In Cloudflare **D1 SQL database** > **Create database** wählen, Name z.B. `eventagenda-db`.
2. D1 > Datenbank > **Console** öffnen und den vollständigen Inhalt von `schema.sql` ausführen.
3. Cloudflare Pages-Projekt > **Settings > Bindings** > **Add binding** > **D1 database**.
4. Variablenname/Bindername: **`DB`**, Datenbank: `eventagenda-db`. Speichern.
5. **Neues Deployment auslösen**, damit die Binding aktiv wird. Jetzt sollte „Event erstellen“ funktionieren.

Hinweis: In einer echten Live-Installation Datenschutz-/Impressumspflicht und Aufbewahrungsfristen prüfen, sowie ggf. Schutz vor Spam, Missbrauch und automatischen Masseneinträgen ergänzen.

### 4. Eigene Domain erst nach erfolgreichem Test

Die bestehende Domain `eventagenda.pro` liegt bei IONOS. Bisherige DNS-Werte waren ein `A`-Eintrag `@ -> 216.24.57.1` und `CNAME` `www -> base44.onrender.com`. **Diese vor einem erfolgreichen Test nicht verändern!**

In Cloudflare Pages unter **Custom domains** die Domain hinzufügen und die dort genannten Hinweise zur DNS-Konfiguration befolgen. Für die Root-Domain kann Cloudflare gegebenenfalls verlangen, die autoritativen Nameserver zu Cloudflare umzuziehen. Alternativ zuerst `www.eventagenda.pro` konfigurieren, während die Domain bei IONOS bleibt. Bei einem Nameserver-Wechsel müssen alle bestehenden MX-, SPF-, DKIM-, DMARC- und Verifikationseinträge vollständig übernommen werden, damit E-Mail und Google-Verifikationen weiter funktionieren.

## Technisches

- Frontend: `public/index.html`, `public/styles.css`, `public/app.js` (kein Build-Schritt, keine npm-Abhängigkeiten).
- API: Cloudflare Pages Functions in `functions/api/events/...` (gemeinsame API-Hilfen in `src/_lib.js`).
- Persistenz: Cloudflare D1 / SQLite (`schema.sql`).
- Event-IDs sind nicht erratbare UUIDs. Teilnehmer sehen Inhalte mit einem gültigen Event-Link.
- Administrationsschlüssel und persönliche Bearbeitungsschlüssel werden als SHA-256-Hashes in der Datenbank gespeichert; Originalschlüssel nur lokal im Browser. **Den privaten Verwaltungslink über die Schaltfläche „Verwaltungslink sichern“ sichern und niemals an Gäste versenden.**
- Es gibt kein zentrales Nutzerkonto, keine E-Mail-Benachrichtigungen und keinen offiziellen Base44-Import. Das sind bewusste Grenzen der ersten Version.

## Sicherheit / produktiver Einsatz

Dies ist ein erster funktionsfähiger Nachbau, keine vollständig produktionsgehärtete Mehrbenutzer-Plattform. Vor öffentlicher Nutzung mit hohem Traffic sollten Rate-Limiting/Anti-Bot-Schutz, Datenlöschkonzept, rechtliche Texte und ein sicheres Wiederherstellungskonzept für Organisatoren ergänzt werden. Die D1-Datenbank kann auf dem kostenlosen Cloudflare-Tarif mit Nutzungslimits betrieben werden.

## Sicherung vorhandener Base44-Daten (separates privates Archiv)

Für diese Version konnten über die verfügbare Base44-Datenschnittstelle **vier bestehende Events**, **sieben zu diesen Events gehörende Antworten** und **eine zugehörige Nachricht** für den Import vorbereitet werden. Mehrere weitere Antworten und Nachrichten verweisen auf inzwischen nicht mehr gelistete Events; die Zuordnung ist deshalb ungeklärt.

Es gibt ein **separates, privates Datenarchiv** mit `import.sql` und geheimen Verwaltungslinks, das **nicht in GitHub hochgeladen** werden darf. Nach dem Ausführen von `schema.sql` ist `import.sql` in der D1-Konsole auszuführen. Die importierten Gastpasswörter werden nur als SHA-256-Hash übernommen. Ursprüngliche Base44-Teilnehmerantworten sind historisch sichtbar, aber mangels persönlicher Bearbeitungsschlüssel nicht mehr von den ursprünglichen Gästen editierbar. Das alte Base44-Projekt bleibt unangetastet.

### Besonderheiten gegenüber der ursprünglichen Base44-App

Diese unabhängige Version unterstützt den wesentlichen Ablauf: Events, mehrtägige Terminoptionen, Programm mit Preisen, Gastpasswort, Terminabstimmung, Ergebnis-Sichtbarkeit, Nachrichten und CSV. Noch **nicht** nachgebaut sind vollumfängliche Nutzerkonten, automatischer Versand, fein abgestufte Berechtigungen und die Wiederherstellung von verlorenen Benutzerzugängen. Sie ist daher eine **erste, technisch getestete Version**, kein identischer vollständiger Klon.
