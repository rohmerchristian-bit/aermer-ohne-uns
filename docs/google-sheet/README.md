# Benachrichtigung bei neuen und geänderten Einträgen

Das Skript [`benachrichtigung.gs`](benachrichtigung.gs) markiert neue und geänderte Formular-Antworten im
Sheet und schickt dem Prüf-Team eine E-Mail. Es läuft in Google, nicht auf der Website.

## Einrichtung (einmalig, ca. 10 Minuten)

1. **Zwei Spalten anlegen.** Im Blatt mit den Formularantworten ganz rechts zwei neue Spaltenköpfe in
   Zeile 1 eintragen: `Status` und `Zuletzt eingegangen`. Das Skript findet sie über die Überschrift,
   die Lage ist egal. Die Formel im Blatt „Öffentlich“ ([oeffentlich-formel.md](oeffentlich-formel.md))
   übernimmt sie nicht.
2. **Skript einfügen.** Im Sheet: *Erweiterungen → Apps Script*. Den Inhalt von `benachrichtigung.gs`
   hineinkopieren, oben bei `EMPFAENGER` die E-Mail-Adresse(n) des Prüf-Teams eintragen, speichern.
3. **Trigger anlegen.** In Apps Script links auf das Uhr-Symbol (*Trigger*) → *Trigger hinzufügen*:
   - Funktion: `beiFormularAntwort`
   - Ereignisquelle: *Aus Tabelle*
   - Ereignistyp: *Bei Formularübermittlung*
   Speichern und den Zugriff mit dem Google-Konto erlauben, dem das Sheet gehört.
4. **Testen.** Das Formular einmal selbst ausfüllen. In der neuen Zeile steht dann
   „Neu – bitte prüfen“, und die E-Mail kommt an. Den Testeintrag danach löschen.

## Neue Zeilen farbig markieren (ohne Skript)

*Format → Bedingte Formatierung*, Bereich `A2:AA`, „Benutzerdefinierte Formel“:

- `=LEFT($Z2;3)="Neu"` → gelb
- `=LEFT($Z2;3)="Geä"` → orange

(`$Z` durch den Buchstaben der Spalte „Status“ ersetzen. Achtung: Kommen im Formular neue Fragen dazu,
verschiebt Google die Spalten – dann den Buchstaben hier anpassen. Das Skript selbst ist davon nicht betroffen.)

Nach der Prüfung: „Freigeben“ anhaken und in „Status“ z. B. „Geprüft“ eintragen – dann verschwindet
die Markierung.

## Gut zu wissen

- **Geänderte Einträge** (wenn Einrichtungen ihre Antwort nachträglich bearbeiten) werden erkannt.
  Das Skript nimmt dann das Häkchen „Freigeben“ heraus, damit die Änderung nicht ungeprüft online geht.
  Abschalten: `FREIGABE_BEI_AENDERUNG_ZURUECKSETZEN = false`.
- **Datenschutz:** Die E-Mail enthält nur Name, Bereich und den Link zur Zeile – keine Kontaktdaten.
- **Ganz ohne Skript** geht es auch: *Tools → Benachrichtigungseinstellungen → Benachrichtigungen bearbeiten*
  → „Ein Nutzer sendet ein Formular“ → sofort per E-Mail. Das muss jede Person selbst einschalten und
  markiert keine Zeilen.
