# Formel für das Blatt „SHEET_PUBLIC_CSV“

Diese Formel wählt die Spalten **nach ihren Überschriften** aus, nicht nach Buchstaben. Kommen im Formular
neue Fragen hinzu, verschiebt sich dadurch nichts – und neue Fragen (z. B. eine weitere E-Mail-Frage)
erscheinen **nicht** automatisch im öffentlichen Blatt.

In das Blatt „SHEET_PUBLIC_CSV“, Zelle **A1** (alles andere im Blatt leer lassen):

```
=LET(
  kopf; ARRAYFORMULA(TRIM(Formularantworten!A1:BZ1));
  werte; Formularantworten!A2:BZ;
  begriffe; {"Was möchtet ihr eintragen*"\"Für welche Einrichtung tragt ihr*"\"Name der Institution*"\"Standort*"\"Website*"\"Social Media*"\"Was tut eure Institution*"\"Wen erreicht eure Arbeit*"\"Logo der Einrichtung*"\"Logo-Upload für euer Profil*"\"Bildnachweis zum Logo*"\"Bildnachweis (Fotograf*"\"Betroffenes Projekt / Angebot*"\"Zu welchem Bereich*"\"Welche Zuschüsse*"\"Geplante Kürzung 2027*"\"Geplante Kürzung in Euro pro Jahr*"\"Geplante Kürzung 2028*"\"Geplante Kürzung 2029*"\"Kürzung in den Folgejahren*"\"Kürzung in Prozent*"\"Falls es nicht um einen Geldbetrag*"\"Quelle des Betrags*"\"Welche konkreten Folgen hat die Kürzung*"\"Absagen von Angeboten*"\"Prägnantes Zitat*"\"Link zu weiterführenden*"\"Bild oder Logo für dieses Projekt*"\"Bildnachweis zum Projektbild*"\"Freigabe zur Veröffentlichung*"\"Mit dem Hochladen bestätigen wir*"\"Telefonnummer für Rückfragen"\"E-Mail-Adresse für Rückfragen"\"Freigeben"\"Betrag_geprüft"\"Hervorheben"};
  alle; HSTACK(ARRAYFORMULA(XMATCH(begriffe; kopf; 2)); ARRAYFORMULA(XMATCH(begriffe; kopf; 2; -1)));
  spalten; UNIQUE(FILTER(alle; NOT(ISNA(alle))); TRUE);
  kopfzeile; CHOOSECOLS(kopf; spalten);
  treffer; FILTER(werte; CHOOSECOLS(werte; XMATCH("Freigeben"; kopf; 0)) = TRUE);
  IF(ISERROR(ROWS(treffer)); kopfzeile; VSTACK(kopfzeile; CHOOSECOLS(treffer; spalten)))
)
```

**Zum Einfügen:** A1 einmal anklicken, die Formel in die **Formelleiste** (neben „fx“) einfügen, Enter.
Nicht direkt in die Zelle einfügen – dann verteilt Google Sheets die Zeilen auf A1, A2, A3 … und es kommt
`#ERROR!`. Vorher muss das ganze Blatt außer A1 leer sein, sonst meldet A1 „Array-Ergebnis wurde nicht
erweitert“. Dieselbe Formel in einer Zeile, sicher zum Einfügen:

```
=LET(kopf; ARRAYFORMULA(TRIM(Formularantworten!A1:BZ1)); werte; Formularantworten!A2:BZ; begriffe; {"Was möchtet ihr eintragen*"\"Für welche Einrichtung tragt ihr*"\"Name der Institution*"\"Standort*"\"Website*"\"Social Media*"\"Was tut eure Institution*"\"Wen erreicht eure Arbeit*"\"Logo der Einrichtung*"\"Logo-Upload für euer Profil*"\"Bildnachweis zum Logo*"\"Bildnachweis (Fotograf*"\"Betroffenes Projekt / Angebot*"\"Zu welchem Bereich*"\"Welche Zuschüsse*"\"Geplante Kürzung 2027*"\"Geplante Kürzung in Euro pro Jahr*"\"Geplante Kürzung 2028*"\"Geplante Kürzung 2029*"\"Kürzung in den Folgejahren*"\"Kürzung in Prozent*"\"Falls es nicht um einen Geldbetrag*"\"Quelle des Betrags*"\"Welche konkreten Folgen hat die Kürzung*"\"Absagen von Angeboten*"\"Prägnantes Zitat*"\"Link zu weiterführenden*"\"Bild oder Logo für dieses Projekt*"\"Bildnachweis zum Projektbild*"\"Freigabe zur Veröffentlichung*"\"Mit dem Hochladen bestätigen wir*"\"Telefonnummer für Rückfragen"\"E-Mail-Adresse für Rückfragen"\"Freigeben"\"Betrag_geprüft"\"Hervorheben"}; alle; HSTACK(ARRAYFORMULA(XMATCH(begriffe; kopf; 2)); ARRAYFORMULA(XMATCH(begriffe; kopf; 2; -1))); spalten; UNIQUE(FILTER(alle; NOT(ISNA(alle))); TRUE); kopfzeile; CHOOSECOLS(kopf; spalten); treffer; FILTER(werte; CHOOSECOLS(werte; XMATCH("Freigeben"; kopf; 0)) = TRUE); IF(ISERROR(ROWS(treffer)); kopfzeile; VSTACK(kopfzeile; CHOOSECOLS(treffer; spalten))))
```

## Was die Formel tut

- Sie sucht **36 Überschriften**, darunter auch die alten und neuen Titel beim Formular-Umbau
  (z. B. „Logo-Upload für euer Profil …“ *und* „Logo der Einrichtung“). Was es im Formular (noch) nicht
  gibt, lässt sie einfach weg – das Formular kann also Schritt für Schritt umgebaut werden.
- Kommt eine Überschrift **mehrfach** vor (eine Frage wurde im Formular gelöscht und neu angelegt – Google behält die
  alte Spalte), übernimmt die Formel die erste **und** die letzte passende Spalte. Die Website nimmt pro Zeile die
  Spalte, in der etwas steht.
- „Telefonnummer für Rückfragen“ und „E-Mail-Adresse für Rückfragen“ (Abschnitt 8) werden **exakt** gesucht
  (ohne `*`), damit die interne „E-Mail-Adresse für Rückfragen & Bündnisarbeit“ nie mitkommt.
- Private Fragen (Ansprechperson, E-Mail für Bündnisarbeit, Aktionen, Räume, Demo, Verteiler, „Wie könnte man Euch helfen“)
  stehen **nicht** in der Liste und kommen deshalb nie ins öffentliche Blatt.
- Überschriften (Zeile 1) und Antworten (ab Zeile 2) werden getrennt gelesen; die Admin-Spalten
  „Freigeben“, „Betrag_geprüft“ und „Hervorheben“ werden exakt gesucht.
- Sie übernimmt nur Zeilen, in denen „Freigeben“ angehakt ist. Ist noch nichts freigegeben, steht nur die
  Kopfzeile im Blatt. Bewusst `IF(ISERROR(ROWS(…)))` statt `IFERROR(…)`: IFERROR arbeitet zellweise und
  würde sonst die Kopfzeile in Zeile 2 kopieren.
- `Formularantworten` ist der Name des Antwort-Tabs. Wird er umbenannt, hier anpassen; enthält der neue
  Name Leerzeichen, muss er in einfache Anführungszeichen (`'Neuer Name'!A1:BZ1`).
- Geschrieben für deutsche Spracheinstellung (`;` zwischen Argumenten, `\` zwischen Spalten im `{…}`-Block).

## Wenn eine Frage dazukommt, die öffentlich sein soll

Einen weiteren Eintrag in die Liste `{…}` setzen, z. B. `\"Neue Frage*"` – und in `src/data/columns.ts`
prüfen, ob der Fragetitel dort bekannt ist.

## Wenn etwas nicht stimmt

- Steht in A1 ein Fehler (`#N/A`, `#REF!`, `#NAME?`), bricht der Build mit einer Meldung ab und die
  Website bleibt unverändert. Häufigste Ursache: Tab-Name falsch.
- Fehlt eine **Pflichtspalte** (Name, Bereich, Freigabe zur Veröffentlichung, Freigeben), bricht der Build
  ebenfalls ab und nennt die fehlende Spalte.
- Nach dem Einfügen prüfen: In Zeile 1 darf **keine** E-Mail-, Kontakt-, Demo- oder Verteiler-Spalte stehen.
