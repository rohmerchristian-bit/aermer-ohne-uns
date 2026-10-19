# Formular „#ÄrmerOhneUns“ – Fragenliste (Entwurf zur Abstimmung)

*Stand: 19.10.2026 · Vorschlag für den Umbau auf „eine Antwort = ein Projekt = eine Kachel“*

## Grundidee

Eine Einrichtung kann **mehrere betroffene Projekte** eintragen, jedes wird eine eigene Kachel.
Dafür hat das Formular am Anfang **zwei Wege**:

```
Abschnitt 1  Was möchtet ihr eintragen?
   ├─ „Unsere Einrichtung ist neu hier“ ──▶ Abschnitt 2  Eure Einrichtung ─┐
   └─ „Weiteres Projekt …“             ──▶ Abschnitt 3  Welche Einrichtung? ─┤
                                                                            ▼
                                                     Abschnitt 4  Das betroffene Projekt
                                                                            ▼
                                                     Abschnitt 5  Freigabe und Absenden
```

Wer mehrere Projekte hat, füllt das Formular einmal über den Weg „neu“ aus (Einrichtung + erstes
Projekt) und danach für jedes weitere Projekt kurz über den Weg „weiteres Projekt“.

**Damit bestehende Antworten erhalten bleiben:** Vorhandene Fragen werden nur **umbenannt oder in einen
anderen Abschnitt verschoben**, nicht gelöscht und neu angelegt. Google behält dann die Spalte im Sheet.
In der Tabelle unten steht bei jeder Frage, ob sie *bestehend* (umbenennen/verschieben) oder *neu* ist.

Legende: **Pflicht** = Pflichtfrage · 🔒 = wird nie veröffentlicht

---

## Abschnitt 1 – Willkommen

Beschreibungstext (Vorschlag):

> Hier tragen Einrichtungen aus Erlangen ein, welche ihrer Angebote von den Kürzungen im Haushalt 2027
> betroffen sind. Jedes Projekt erscheint als eigene Kachel auf der Website des Bündnisses. Das Bündnis prüft jeden
> Eintrag, bevor er veröffentlicht wird.

| # | Frage | Typ | Pflicht | Spalte |
|---|---|---|---|---|
| 1.1 | **Was möchtet ihr eintragen?** | Multiple Choice, *Je nach Antwort zu Abschnitt wechseln* | ja | neu |

Antworten:
- „Unsere Einrichtung ist neu hier – wir tragen die Einrichtung und ein erstes betroffenes Projekt ein“ → **Abschnitt 2**
- „Ein weiteres betroffenes Projekt für eine bereits eingetragene Einrichtung“ → **Abschnitt 3**

---

## Abschnitt 2 – Eure Einrichtung

*Nach diesem Abschnitt: weiter mit Abschnitt 4.*

| # | Frage | Typ | Pflicht | Spalte | öffentlich |
|---|---|---|---|---|---|
| 2.1 | Name der Institution / Einrichtung | Kurzantwort | ja | bestehend | ja |
| 2.2 | Standort / Adresse | Kurzantwort | nein | bestehend | ja |
| 2.3 | Website / Social-Media-Kanäle | Absatz | nein | bestehend | ja |
| 2.4 | Was tut eure Institution in Kürze? (Kurzbeschreibung der Arbeit) | Absatz | ja | bestehend | ja |
| 2.5 | Wen erreicht eure Arbeit? (Zielgruppen & Reichweite in Zahlen) | Absatz | nein | bestehend | ja |
| 2.6 | **Logo der Einrichtung** *(umbenannt aus „Logo-Upload für euer Profil auf der Plattform“)* | Datei-Upload, 1 Datei, Bild | nein | bestehend | ja |
| 2.7 | **Bildnachweis zum Logo** *(umbenannt aus „Bildnachweis (Fotograf\*in / Rechteinhaber)“)* | Kurzantwort | nein | bestehend | ja |
| 2.8 | Ansprechperson für das Bündnis (Format: Vorname, Nachname, Funktion) | Kurzantwort | ja | bestehend | 🔒 |
| 2.9 | E-Mail-Adresse für Rückfragen & Bündnisarbeit | Kurzantwort, Validierung E-Mail | ja | bestehend | 🔒 |
| 2.10 | Plant ihr eigene Aktionen, Proteste oder Veranstaltungen zur Kürzungswelle? Wenn ja, welche? | Absatz | nein | bestehend | 🔒 |
| 2.11 | Wärt ihr bereit, Räume oder Infrastruktur für Treffen des Bündnisses bereitzustellen? | Multiple Choice | nein | bestehend | 🔒 |
| 2.12 | Ich möchte dabei sein und als Teil des Bündnis … *(bestehende Frage(n) zu Bündnis und Verteiler, Wortlaut wie bisher)* | Kästchen | nein | bestehend | 🔒 |

---

## Abschnitt 3 – Weiteres Projekt für eine eingetragene Einrichtung

*Nach diesem Abschnitt: weiter mit Abschnitt 4.*

| # | Frage | Typ | Pflicht | Spalte | öffentlich |
|---|---|---|---|---|---|
| 3.1 | **Für welche Einrichtung tragt ihr ein weiteres Projekt ein?** | Drop-down | ja | neu | ja |
| 3.2 | **Ansprechperson für dieses Projekt** (Vorname, Nachname, Funktion) | Kurzantwort | ja | neu | 🔒 |
| 3.3 | **E-Mail-Adresse für Rückfragen zu diesem Projekt** | Kurzantwort, Validierung E-Mail | ja | neu | 🔒 |

Hinweistext unter 3.1 (Vorschlag):

> Eure Einrichtung fehlt in der Liste? Dann ist sie noch nicht freigegeben – bitte kurz warten oder den
> Weg „Unsere Einrichtung ist neu hier“ nehmen.

Die Auswahlliste in 3.1 füllt ein Skript automatisch mit den Namen der Einrichtungen (siehe offene Fragen).

---

## Abschnitt 4 – Das betroffene Projekt / Angebot

*Dieser Abschnitt ist für beide Wege derselbe. Eine Antwort = eine Kachel.*

| # | Frage | Typ | Pflicht | Spalte | öffentlich |
|---|---|---|---|---|---|
| 4.1 | **Betroffenes Projekt / Angebot** *(umbenannt aus „Betroffenes Projekt / Angebot: Welche konkreten Folgen hat die Kürzung?“)* | Kurzantwort | ja | bestehend | ja |
| 4.2 | **Zu welchem Bereich gehört das Projekt / Angebot?** *(verschoben aus Abschnitt 2, umbenannt aus „Zu welchem Bereich gehört eure Einrichtung?“)* | Drop-down, 7 Bereiche | ja | bestehend | ja |
| 4.3 | Welche Zuschüsse / Mittel sollen gestrichen oder gekürzt werden? | Absatz | ja | bestehend | ja |
| 4.4 | **Geplante Kürzung 2027 in Euro** *(umbenannt aus „Geplante Kürzung in Euro pro Jahr“)* | Kurzantwort | nein | bestehend | ja |
| 4.5 | **Kürzung in den Folgejahren** | Kurzantwort | nein | neu | ja |
| 4.6 | **Kürzung in Prozent** | Kurzantwort | nein | neu | ja |
| 4.7 | **Falls es nicht um einen Geldbetrag geht: Was fällt weg?** | Kurzantwort | nein | neu | ja |
| 4.8 | **Quelle des Betrags** | Kurzantwort | nein | neu *(war ohnehin geplant)* | ja |
| 4.9 | **Welche konkreten Folgen hat die Kürzung?** *(umbenannt aus „Absagen von Angeboten, Stellenabbau, Schließzeiten, etc.“)* | Absatz | ja | bestehend | ja |
| 4.10 | Prägnantes Zitat / Statement zur Lage (Short Quote) | Absatz | nein | bestehend | ja |
| 4.11 | Link zu weiterführenden Informationen / Stellungnahmen / Petitionen | Kurzantwort | nein | bestehend | ja |
| 4.12 | **Bild oder Logo für dieses Projekt** | Datei-Upload, 1 Datei, Bild | nein | neu | ja |
| 4.13 | **Bildnachweis zum Projektbild** | Kurzantwort | nein | neu | ja |

Beschreibungstexte (Vorschlag):

- **4.4:** „Nur die Zahl für das Jahr 2027, z. B. 21.000. Diese Zahl fließt in die Gesamtsumme auf der Website ein.“
- **4.5:** „z. B. 2028: 85.000 €, 2029: 120.000 €“
- **4.6:** „z. B. 10 % – wird zusätzlich zum Betrag angezeigt.“
- **4.7:** „z. B. Wegfall der Mietzuschüsse für Vereine. Wird auf der Kachel statt eines Betrags gezeigt.“
- **4.8:** „Woher stammt der Betrag? z. B. Sparliste der Stadt, Vorlage II/056/2026; Schreiben des Kulturamts vom …; eigene Berechnung“
- **4.9:** „z. B. Absagen von Angeboten, Stellenabbau, Schließzeiten“
- **4.12:** „Optional. Ohne eigenes Bild zeigen wir das Logo der Einrichtung.“

---

## Abschnitt 5 – Freigabe

| # | Frage | Typ | Pflicht | Spalte | öffentlich |
|---|---|---|---|---|---|
| 5.1 | Freigabe zur Veröffentlichung | Kästchen | ja | bestehend | Filter |
| 5.2 | Mit dem Hochladen bestätigen wir, dass wir die erforderlichen Nutzungsrechte … *(bestehender Einwilligungstext, gilt für Logo und Projektbild)* | Kästchen | nein | bestehend | Filter |

Hinweis: Im bestehenden Einwilligungstext steht noch der Platzhalter `[KONTAKTADRESSE]`.

---

## Formular-Einstellungen

- **Antworten nach dem Senden bearbeiten:** an – so können Einrichtungen ihren Eintrag später korrigieren
  (Bearbeiten-Link in der Bestätigungsmail).
- **E-Mail-Adressen erfassen:** „Von Befragten eingegeben“ mit **Kopie der Antworten senden** – nötig,
  damit der Bearbeiten-Link per Mail ankommt. Diese Spalte „E-Mail-Adresse“ ist 🔒.
- **Bestätigungsnachricht** (Vorschlag): „Danke! Das Bündnis prüft euren Eintrag und schaltet ihn frei.
  Für jedes weitere betroffene Projekt füllt das Formular bitte erneut aus und wählt ‚Weiteres Projekt‘.“

## Admin-Spalten im Sheet (unverändert, gelten jetzt pro Projekt)

`Freigeben` · `Betrag_geprüft` (Betrag 2027) · `Hervorheben` · `Status` · `Zuletzt eingegangen`

---

## Offene Fragen an die Initiative

1. **Auswahlliste in 3.1:** Sollen dort **nur freigegebene** Einrichtungen stehen (empfohlen – sonst sieht
   jede Person mit dem Formular-Link auch noch ungeprüfte Namen) oder alle eingetragenen?
2. **Summe:** Bei mehrjährigen Kürzungen zählt der **Betrag 2027** (4.4) für die Gesamtsumme. Einverstanden?
3. **Bereich pro Projekt:** Die Kachelfarbe richtet sich nach dem Bereich des **Projekts** (4.2), nicht der
   Einrichtung – z. B. Streetwork beim E-Werk unter „Soziales“. Einverstanden?
4. **Ansprechperson beim Weg „weiteres Projekt“** (3.2/3.3): Pflicht, damit das Bündnis bei Rückfragen
   jemanden erreicht. Oder reicht die Ansprechperson der Einrichtung?
5. **Endgültige Namen der sieben Bereiche** für das Drop-down in 4.2 (bisher Platzhalter: Kultur, Bildung,
   Soziales, Jugend, Sport, Umwelt, Sonstiges).
