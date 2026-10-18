# Ideen für später

Gesammelte Erweiterungen, die noch nicht eingeplant sind.

## Karte der betroffenen Einrichtungen (OpenStreetMap)

*Vorschlag vom 18.10.2026*

Alle betroffenen Einrichtungen auf einer Karte von Erlangen zeigen, platziert über die Angabe
„Standort / Adresse“ – damit sichtbar wird, wie sich die Kürzungen über die Stadt verteilen.

Zu klären bzw. zu beachten:

- **Keine externen Anfragen beim Besuch.** Die üblichen OSM-Kacheln (tile.openstreetmap.org) würden
  beim Besuch Daten an Dritte senden. Stattdessen die Kartendaten für Erlangen selbst ausliefern
  (z. B. eine Protomaps/PMTiles-Datei mit MapLibre) oder eine statische Karte beim Build erzeugen.
- **Adressen beim Build in Koordinaten umwandeln** (z. B. mit Nominatim, max. 1 Anfrage pro Sekunde,
  Ergebnisse zwischenspeichern). Adressen, die nicht gefunden werden, erzeugen eine Build-Warnung.
- **Darstellung:** Bei einigen Dutzend Einrichtungen wirken Punkte in den Bereichsfarben (Größe nach
  Kürzungsbetrag) vermutlich klarer als eine Heatmap; beides ausprobieren.
- **Barrierefreiheit:** Die Karte ergänzt die Liste, ersetzt sie nicht; Tastaturbedienung und eine
  Textalternative mitdenken.
- **Lizenz:** OpenStreetMap-Daten stehen unter ODbL; Quellenangabe „© OpenStreetMap-Mitwirkende“ ist Pflicht.
- **Adresse ist öffentlich:** Das Feld ist bereits öffentlich; ggf. im Formular kurz darauf hinweisen,
  dass die Adresse auch auf einer Karte erscheint.
