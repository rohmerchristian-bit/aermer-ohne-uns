# Formel für das Blatt „Öffentlich“

Diese Formel wählt die Spalten **nach ihren Überschriften** aus, nicht nach Buchstaben. Kommen im Formular
neue Fragen hinzu, verschiebt sich dadurch nichts – und neue Fragen (z. B. eine weitere E-Mail-Frage)
erscheinen **nicht** automatisch im öffentlichen Blatt.

In das Blatt „Öffentlich“, Zelle **A1** (alles andere im Blatt leer lassen):

```
=LET(
  daten; Formularantworten!A1:AZ;
  kopf; CHOOSEROWS(daten; 1);
  spalten; XMATCH({"*Name der Institution*"\"*Zu welchem Bereich*"\"*Standort*"\"*Website*"\"*Was tut eure Institution*"\"*Wen erreicht*"\"*Geplante Kürzung*"\"*Welche Zuschüsse*"\"*Betroffenes Projekt*"\"*Absagen von Angeboten*"\"*Prägnantes Zitat*"\"*Link zu weiterführenden*"\"*Bildnachweis*"\"*Logo-Upload*"\"*Freigabe zur Veröffentlichung*"\"*Mit dem Hochladen*"\"*Freigeben*"\"*Betrag_geprüft*"\"*Hervorheben*"}; kopf; 2);
  freigegeben; FILTER(daten; CHOOSECOLS(daten; XMATCH("*Freigeben*"; kopf; 2)) = TRUE);
  IFNA(VSTACK(CHOOSECOLS(kopf; spalten); CHOOSECOLS(freigegeben; spalten)); "")
)
```

- `Formularantworten` ist der Name eures Antwort-Tabs. Wird er umbenannt, hier anpassen; enthält der neue
  Name Leerzeichen, muss er in einfache Anführungszeichen (`'Neuer Name'!A1:AZ`).
- Die Formel ist für deutsche Spracheinstellung geschrieben (`;` zwischen Argumenten, `\` zwischen
  Spalten im `{…}`-Block).
- Sie übernimmt nur Zeilen, in denen „Freigeben“ angehakt ist.

## Wenn eine Frage dazukommt, die öffentlich sein soll

Einen weiteren Eintrag in die Liste `{…}` setzen, z. B. `\"*Quelle des Betrags*"` – und in
`src/data/columns.ts` prüfen, ob der Fragetitel dort bekannt ist.

## Wenn etwas nicht stimmt

- Steht in A1 ein Fehler (`#N/A`, `#REF!`, `#NAME?`), bricht der Build mit einer Meldung ab und die
  Website bleibt unverändert. Häufigste Ursache: Tab-Name falsch oder eine Überschrift aus der Liste
  wurde im Formular umbenannt.
- Ist das Blatt ganz leer, meldet der Build ebenfalls einen Fehler.
- Diese Formel wurde nicht in eurem Sheet getestet – bitte nach dem Einfügen prüfen, dass in Zeile 1
  genau die 19 Überschriften stehen und **keine** E-Mail-, Kontakt- oder Verteiler-Spalte dabei ist.
