# Formular „#ÄrmerOhneUns“ – Umbau für mehrere Projekte pro Einrichtung

*Stand: 19.10.2026 · abgestimmt · Grundlage: das aktuelle Formular mit 7 Abschnitten*

> **Umsetzung:** per Skript [`docs/google-sheet/formular-umbau.gs`](google-sheet/formular-umbau.gs)
> (`umbauPruefen()` → `umbauAusfuehren()`), danach von Hand nur die Upload-Frage „Bild oder Logo für dieses Projekt“.

## Ziel

Eine Einrichtung kann **mehrere betroffene Projekte** eintragen, **jedes Projekt wird eine eigene Kachel**.
Wer später ein weiteres Projekt ergänzen will, füllt das Formular erneut aus und wählt den kurzen Weg
„Weiteres Projekt“ – ohne die Einrichtung noch einmal einzutragen.

## Neuer Ablauf

Aus 7 werden 9 Abschnitte. Zwei kommen neu dazu (1 und 7), der bisherige Abschnitt 3 wandert ans Ende
vor die Einverständnisse und wird zum Projekt-Abschnitt.

```
 1  Start: Was möchtet ihr eintragen?                         (NEU)
     ├─ „Unsere Einrichtung ist neu hier“ ──▶ 2
     └─ „Weiteres Projekt …“              ──▶ 7

 2  #ÄrmerOhneUns – Eure Einrichtung                         (bisher 1)
 3  Aufgaben & Bedeutung für Erlangen                         (bisher 2)
 4  Medien & Material für die Plattform                       (bisher 4)
 5  Vernetzung & Bündnisarbeit                                (bisher 5)
 6  Demo // 18.11.2026 / 15 Uhr / Rathausplatz                (bisher 6)   Nach Abschnitt 6 ▶ 8
 7  Weiteres Projekt für eine eingetragene Einrichtung        (NEU)        Nach Abschnitt 7 ▶ 8
 8  Betroffenes Projekt / Angebot                             (bisher 3, umgebaut)
 9  Einverständnisse & Datenschutz                            (bisher 7)
```

Warum der Projekt-Abschnitt nach hinten rückt: Google Forms kann „Nach Abschnitt …“ nicht je nach Weg
unterschiedlich setzen. Liegt das Projekt direkt vor den Einverständnissen, landen beide Wege von selbst
richtig.

**Bestehende Antworten bleiben erhalten**, solange vorhandene Fragen nur **umbenannt oder verschoben**
werden (nicht löschen und neu anlegen). Google behält dann die Spalte im Sheet.

Legende: **bestehend** = vorhandene Frage, ggf. umbenennen/verschieben · **NEU** = neu anlegen · 🔒 = wird nie veröffentlicht

---

## 1 – Start (NEU)

Beschreibung (Vorschlag): *„Jedes betroffene Projekt erscheint als eigene Kachel auf der Plattform.
Habt ihr mehrere Projekte? Dann tragt zuerst eure Einrichtung mit dem ersten Projekt ein und füllt das
Formular danach für jedes weitere Projekt erneut aus.“*

| Frage | Typ | Pflicht | |
|---|---|---|---|
| **Was möchtet ihr eintragen?** | Multiple Choice, *Je nach Antwort zu Abschnitt wechseln* | ja | NEU |

- „Unsere Einrichtung ist neu hier – wir tragen die Einrichtung und ein erstes betroffenes Projekt ein“ → **Abschnitt 2**
- „Ein weiteres betroffenes Projekt für eine bereits eingetragene Einrichtung“ → **Abschnitt 7**

Den bisherigen Einleitungstext (strukturierte Datenerfassung, Bearbeitung mit Google-Account) hierher verschieben.

## 2 – Eure Einrichtung (bisher 1)

| Frage | Pflicht | Änderung | öffentlich |
|---|---|---|---|
| Name der Institution / Einrichtung | ja | – | ja |
| ~~Zu welchem Bereich gehört eure Einrichtung?~~ | | **nach Abschnitt 8 verschieben** (siehe dort) | |
| Standort / Adresse | ja | – | ja |
| Ansprechperson für das Bündnis (Format: Vorname, Nachname, Funktion) | ja | – | 🔒 |
| E-Mail-Adresse für Rückfragen & Bündnisarbeit | ja | – | 🔒 |
| Website / Social-Media-Kanäle | nein | – | ja |

## 3 – Aufgaben & Bedeutung für Erlangen (bisher 2)

Unverändert: „Was tut eure Institution in Kürze?“ · „Wen erreicht eure Arbeit?“

## 4 – Medien & Material für die Plattform (bisher 4)

| Frage | Pflicht | Änderung | öffentlich |
|---|---|---|---|
| **Logo der Einrichtung** | ja | umbenennen aus „Logo-Upload für euer Profil auf der Plattform“ | ja |
| **Bildnachweis zum Logo** | nein | **NEU** (Kurzantwort) | ja |

Hinweis: Die frühere Frage „Bildnachweis (Fotograf\*in / Rechteinhaber)“ ist im Formular nicht mehr
vorhanden, ihre Spalte steht aber noch im Sheet. Die neue Frage bitte **mit dem Titel „Bildnachweis zum
Logo“** anlegen – bei gleichem Titel legt Google eine zweite, gleichnamige Spalte an, und das führt zu
Verwechslungen.

## 5 – Vernetzung & Bündnisarbeit (bisher 5)

Unverändert, beide Fragen 🔒.

## 6 – Demo (bisher 6)

Unverändert, 🔒. **Einzige Änderung:** „Nach Abschnitt 6“ → **„Weiter zu Abschnitt 8“** (Projekt).

## 7 – Weiteres Projekt für eine eingetragene Einrichtung (NEU)

„Nach Abschnitt 7“ → „Weiter zu Abschnitt 8“.

| Frage | Typ | Pflicht | öffentlich |
|---|---|---|---|
| **Für welche Einrichtung tragt ihr ein weiteres Projekt ein?** | Drop-down (wird per Skript gefüllt) | ja | ja |
| **Ansprechperson für dieses Projekt** (Vorname, Nachname, Funktion) | Kurzantwort | ja | 🔒 |

Hinweis unter der Auswahl (Vorschlag): *„Eure Einrichtung fehlt? Dann ist sie noch nicht freigegeben –
bitte kurz warten oder den Weg ‚Unsere Einrichtung ist neu hier‘ wählen.“*

Eine eigene E-Mail-Frage ist hier nicht nötig: Das Formular erfasst E-Mail-Adressen ohnehin automatisch (🔒).

## 8 – Betroffenes Projekt / Angebot (bisher 3, umgebaut)

Beschreibung (Vorschlag): *„Ein Projekt = eine Kachel. Für weitere Projekte das Formular bitte erneut ausfüllen.“*

| Frage | Pflicht | Änderung | öffentlich |
|---|---|---|---|
| **Betroffenes Projekt / Angebot** | ja | **NEU** (Kurzantwort, z. B. „Jugendtreff Fuxx“) | ja |
| **Zu welchem Bereich gehört das Projekt / Angebot?** | ja | aus Abschnitt 2 **hierher verschieben** und umbenennen; die 7 Antworten bleiben gleich | ja |
| Welche Zuschüsse / Mittel sollen gestrichen oder gekürzt werden? | ja | – | ja |
| **Geplante Kürzung 2027 in Euro** | nein | umbenennen aus „Geplante Kürzung in Euro pro Jahr“ | ja |
| **Kürzung in den Folgejahren** | nein | **NEU** | ja |
| **Kürzung in Prozent** | nein | **NEU** | ja |
| **Falls es nicht um einen Geldbetrag geht: Was fällt weg?** | nein | **NEU** | ja |
| **Quelle des Betrags** | nein | **NEU** | ja |
| **Welche konkreten Folgen hat die Kürzung?** | ja | umbenennen aus „Betroffenes Projekt / Angebot: Welche konkreten Folgen hat die Kürzung?“ – die bisherigen Antworten beschreiben Folgen und bleiben so richtig zugeordnet; „Absagen von Angeboten, Stellenabbau, Schließzeiten“ als Beschreibung | ja |
| Prägnantes Zitat / Statement zur Lage (Short Quote) | nein | – | ja |
| Wie könnte man Euch helfen, wenn es zur Einsparung kommt? | nein | – | **offen** (siehe unten) |
| Link zu weiterführenden Informationen / Stellungnahmen / Petitionen | nein | – | ja |
| **Bild oder Logo für dieses Projekt** | nein | **NEU** (Datei-Upload, 1 Bild) | ja |
| **Bildnachweis zum Projektbild** | nein | **NEU** | ja |

Beschreibungstexte (Vorschlag):

- *Geplante Kürzung 2027:* „Nur die Zahl für 2027, z. B. 21.000. Sie fließt in die Gesamtsumme auf der Website ein.“
- *Folgejahre:* „z. B. 2028: 85.000 €, 2029: 120.000 €“
- *Prozent:* „z. B. 10 % – wird zusätzlich zum Betrag gezeigt.“
- *Was fällt weg?:* „z. B. Wegfall der Mietzuschüsse für Vereine – steht auf der Kachel statt eines Betrags.“
- *Quelle:* „z. B. Sparliste der Stadt, Vorlage II/056/2026; Schreiben des Kulturamts vom …; eigene Berechnung“
- *Projektbild:* „Optional. Ohne eigenes Bild zeigen wir das Logo der Einrichtung.“

## 9 – Einverständnisse & Datenschutz (bisher 7)

Unverändert: „Freigabe zur Veröffentlichung“ (Pflicht) · „Aufnahme in den Bündnis-Verteiler“ (🔒) · Bildrechte.

- Die Bildrechte-Frage ist derzeit **Pflicht**. Beim Weg „Weiteres Projekt“ ohne Bild müsste man sie
  trotzdem ankreuzen. Vorschlag: **keine Pflicht** – die Website zeigt Bilder ohnehin nur mit Häkchen.
- Im Text steht noch der Platzhalter **[KONTAKTADRESSE]**.

---

## Admin-Spalten im Sheet (unverändert, gelten jetzt pro Projekt)

`Freigeben` · `Betrag_geprüft` (Betrag 2027) · `Hervorheben` · `Status` · `Zuletzt eingegangen`

Nach dem Umbau passe ich die Formel für das Blatt „SHEET_PUBLIC_CSV“ an (neue Spalten) und ergänze das Skript
um die automatische Einrichtungsliste in Abschnitt 7.

## Entscheidungen der Initiative (19.10.2026)

1. Auswahlliste: nur freigegebene Einrichtungen – **ja**
2. Summe: Betrag 2027 – **ja**
3. Kachelfarbe nach Bereich des Projekts – **ja**
4. „Wie könnte man Euch helfen …?“ – **vorerst nicht öffentlich**
5. Bildrechte-Frage ohne Pflicht – **ja**
6. „Telefonnummer für Rückfragen“ und „E-Mail-Adresse für Rückfragen“ – **öffentlich** auf der Einrichtungsseite unter „Kontakt und Links“ (Entscheidung 28.10.2026, vorher intern);
   im Formular steht bei beiden Fragen „Erscheint auf Website“

## Ursprünglich offene Fragen

1. **Auswahlliste in Abschnitt 7:** nur **freigegebene** Einrichtungen (empfohlen – sonst sieht jede Person
   mit dem Formular-Link auch ungeprüfte Namen) oder alle?
2. **Summe:** Bei mehrjährigen Kürzungen zählt der **Betrag 2027**. Einverstanden?
3. **Bereich pro Projekt:** Die Kachelfarbe richtet sich nach dem Bereich des **Projekts** – z. B. Streetwork
   beim E-Werk unter „Soziales, Familie & Senioren“. Einverstanden?
4. **„Wie könnte man Euch helfen …?“** auf der Website zeigen (z. B. „Hilfe möglich: Spende, Mithilfe“ auf
   der Detailseite) oder nur intern nutzen? Bis zur Entscheidung bleibt die Antwort intern.
5. **Bildrechte-Frage** künftig ohne Pflicht? (siehe Abschnitt 9)
