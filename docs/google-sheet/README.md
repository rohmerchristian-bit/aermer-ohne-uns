# Benachrichtigung bei neuen und geänderten Einträgen

Das Skript [`benachrichtigung.gs`](benachrichtigung.gs) markiert neue und geänderte Formular-Antworten im
Sheet und schickt dem Prüf-Team eine E-Mail. Es läuft in Google, nicht auf der Website.

## Einrichtung (einmalig, ca. 10 Minuten)

1. **Skript einfügen.** Im Sheet: *Erweiterungen → Apps Script*. Den Inhalt von `benachrichtigung.gs`
   hineinkopieren, oben bei `EMPFAENGER` die E-Mail-Adresse(n) des Prüf-Teams eintragen, speichern.
2. **Einrichten ausführen.** Oben in der Funktionsauswahl `einrichten` wählen → *Ausführen*. Beim ersten
   Mal fragt Google nach Berechtigungen (Tabelle bearbeiten, E-Mails senden) – mit dem Konto bestätigen,
   dem das Sheet gehört. Das legt die Spalten `Status` und `Zuletzt eingegangen` ganz rechts an und prüft
   die übrigen Überschriften. Im *Ausführungsprotokoll* steht „Alles bereit“ oder, was fehlt.
   Die beiden Spalten übernimmt das Blatt „Öffentlich“ nicht ([oeffentlich-formel.md](oeffentlich-formel.md)).
3. **Trigger anlegen.** Links auf das Uhr-Symbol (*Trigger*) → *Trigger hinzufügen*:
   - Funktion: `beiFormularAntwort`
   - Ereignisquelle: *Aus Tabelle*
   - Ereignistyp: *Bei Formularübermittlung*
4. **Testen ohne Formular.** `probelauf` auswählen → *Ausführen*. Es kommt eine Mail mit „[TEST]“ im
   Betreff zur letzten Antwortzeile; im Sheet wird dabei nichts verändert.

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
