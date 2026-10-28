# Live-Website aermerohneuns.de – Deployment

Die Website liegt auf dem Webspace des E-Werks (Hetzner Webhosting, Apache). GitHub Actions baut sie
**stündlich** (Minute 47), bei jedem Push auf `main` und auf Knopfdruck neu und lädt sie per **FTPS**
(verschlüsseltes FTP) hoch: [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml).

Reihenfolge in jedem Lauf: Daten holen → Tests → Website bauen → für den Server vorbereiten →
Sicherheitsprüfung → hochladen. Scheitert ein Schritt, wird **nichts** hochgeladen; die Seite bleibt, wie sie ist.

## Einrichtung (einmalig)

Die Zugangsdaten gehören nur in GitHub-Secrets – nie ins Repository. Lokal liegen sie in `.env.deploy`
(von Git ignoriert).

**Variante A – Terminal** (im Projektordner, setzt alle Werte aus `.env.deploy` auf einmal):

```bash
~/.local/share/gh/bin/gh secret set -f .env.deploy --repo rohmerchristian-bit/aermer-ohne-uns
```

**Variante B – GitHub-Website:** *Settings → Secrets and variables → Actions → New repository secret*, je einmal für
`SITE_URL`, `COMING_SOON`, `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`, `FTP_DIR` (Werte aus `.env.deploy`).
`SHEET_PUBLIC_CSV_URL` ist bereits angelegt.

`SITE_URL` und `COMING_SOON` sind nicht geheim. Besser als **Variable** anlegen (gleiche Seite, Reiter
*Variables*): Als Secret blendet GitHub sonst jede „1“ in den Protokollen als `***` aus. Eine Variable hat
Vorrang vor einem gleichnamigen Secret.

Danach läuft das Deployment beim nächsten Push oder spätestens zur nächsten vollen Stunde (Minute 47) –
sofort geht es über *Actions → Deploy (aermerohneuns.de) → Run workflow*.

**Vor dem ersten Lauf prüfen:** Der Upload gleicht den Ordner `FTP_DIR` (public_html) mit der Website ab und
**entfernt dort alles, was nicht zur Website gehört**. Ausgenommen sind nur `.well-known/` (SSL-Zertifikat),
`.htpasswd*` und `cgi-bin/`. Liegt in `public_html` noch etwas anderes, das bleiben soll, vorher sichern oder Bescheid geben.

## Coming soon

Solange `COMING_SOON` = `1` ist, steht online nur die Seite „Die Plattform startet in Kürze“ (mit Logo,
aktuellem Hinweis aus den Einstellungen und – falls gesetzt – Links zu Formular, Instagram, Kontakt). Alle
anderen Seiten werden nicht hochgeladen (außer dem passwortgeschützten `/intern/`); jede andere Adresse zeigt dieselbe Seite. Die Seite ist `noindex`.

**Zum Start der vollständigen Website:** `COMING_SOON` auf `0` setzen (Variable bzw. Secret) und den Workflow
starten. Vorher Impressum und Datenschutzerklärung einsetzen – die Platzhalter sind gelb markiert.

## Sicherheitsprüfung

Vor jedem Upload vergleicht [`scripts/deploy-guard.ts`](../../scripts/deploy-guard.ts) die neue Zahl der
Projekte mit der Online-Version (`/build-info.json`). Fällt sie um mehr als die Hälfte (bei mindestens 4
Projekten online), wird **nicht** hochgeladen – das passiert typischerweise, wenn die Formel im Blatt
„SHEET_PUBLIC_CSV“ kaputt ist oder „Freigeben“ versehentlich geleert wurde.

Ist der Rückgang gewollt: *Actions → Deploy → Run workflow* mit Haken bei **„Sicherheitsprüfung überspringen“**.

## Server-Konfiguration

[`public/.htaccess`](../../public/.htaccess) wird mit hochgeladen: HTTPS-Weiterleitung und `www.` → ohne `www.`,
Sicherheits-Header (Content-Security-Policy nur eigene Domain, Formular-Ziel CleverReach), Caching, eigene
404-Seite. Eine gleichwertige nginx-Konfiguration liegt in [`nginx.conf`](nginx.conf).

- **HSTS** ist vorbereitet, aber auskommentiert: erst einschalten, wenn HTTPS für die Domain zuverlässig läuft.
- **SSL-Zertifikat:** im Hetzner-konsoleH für die Domain Let's Encrypt aktivieren (falls noch nicht geschehen).

## Interner Bereich /intern/ (Social-Media-Vorlagen)

Unter `https://aermerohneuns.de/intern/` liegt das Werkzeug für Social-Media-Posts und -Stories
(Anleitung: [`docs/social-vorlagen.md`](../social-vorlagen.md)). Es ist per **Passwort** (HTTP Basic Auth)
geschützt und läuft auch im Coming-soon-Modus. Auf der GitHub-Vorschau gibt es den Bereich nicht – GitHub
Pages kann keine Ordner schützen.

**Einrichtung (einmalig), zwei Werte in GitHub** (*Settings → Secrets and variables → Actions*):

1. **Secret `INTERN_HTPASSWD`** – Benutzername und verschlüsseltes Passwort. Auf dem Mac im Terminal
   (fragt das Passwort zweimal ab, zeigt es nicht an; `team` ist der Benutzername):

   ```bash
   htpasswd -nB team
   ```

   Die ausgegebene Zeile (`team:$2y$…`) komplett als Secret einfügen. Mehrere Zugänge: mehrere Zeilen.
   Das Passwort selbst steht nirgends – nur dieser verschlüsselte Wert.
2. **Variable `INTERN_AUTH_DIR`** – der absolute Pfad des Website-Ordners (`FTP_DIR`) auf dem Server,
   z. B. `/usr/www/users/BENUTZER/public_html`. Steht im konsoleH unter *Einstellungen* bzw. in den
   Server-Infos („Pfad zum Webverzeichnis“).

Der Deploy schreibt daraus `intern/.htaccess` und die Benutzerdatei `intern/.htusers` (Apache liefert
`.ht*`-Dateien nie aus).

**Sicherungen:**

- Fehlt einer der beiden Werte oder ist er ungültig, wird `/intern/` **gar nicht** hochgeladen.
- Nach jedem Upload ruft der Deploy `/intern/` ohne Passwort auf. Kommt die Seite trotzdem (HTTP 200),
  wird der Ordner sofort vom Server gelöscht und der Lauf schlägt fehl. Antwortet der Server mit einem
  Fehler statt mit der Passwortabfrage (z. B. 500), stimmt meist `INTERN_AUTH_DIR` nicht – der Lauf zeigt
  dann eine Warnung.

**Passwort ändern:** neue Zeile mit `htpasswd -nB team` erzeugen, Secret ersetzen, Workflow starten.

## Wenn ein Lauf fehlschlägt

Unter *Actions* den roten Lauf öffnen – die Zusammenfassung oben nennt die Ursache. Häufig:

| Meldung | Ursache / Lösung |
|---|---|
| „Formel im Blatt „SHEET_PUBLIC_CSV“ liefert den Fehler …“ | Formel im Sheet prüfen ([oeffentlich-formel.md](../google-sheet/oeffentlich-formel.md)) |
| „Die Zahl der Projekte fällt von … auf …“ | Sicherheitsprüfung, siehe oben |
| `Login failed` / `530` | FTP-Benutzer oder Passwort im Secret falsch |
| `Fatal error: Certificate verification` | FTP_HOST muss der Servername sein (`wwwNNN.your-server.de`), nicht die Domain |
| „FTP_DIR muss ein Unterordner sein“ | Secret `FTP_DIR` auf `public_html` setzen |
