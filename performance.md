# Suorituskyky ja progressiivinen parantaminen (E5)

## Etusivu (`index.html`)

Mittaukset tehtiin Chrome DevToolsissa incognito-ikkunassa (välimuisti pois päältä, mobiili-Lighthouse, Slow 4G -kuristus).

| Mittari | Ennen (`e4`, localhost) | Jälkeen (`e5`, localhost) | Julkaistu (GitHub Pages) |
|---|---|---|---|
| Siirretty | 17,6 kt | 18,2 kt | 6,8 kt |
| Pyynnöt | 4 | 4 | 4 |
| Lighthouse perf. | 98 | 98 | 100 |
| LCP | 1,9 s | 1,9 s | 1,3 s |

## Mitä muutin
- Lisäsin progressiivisen parantamisen (`no-js`-luokka `about.html`- ja `listing.html`-sivuille sekä `<noscript>`-varasisällön varauslomakkeelle), jotta kaikki tekstisisältö, navigaatio, staattiset saunakortit ja yhteystiedot toimivat ilman JavaScriptiä.
- Piilotin vain JavaScriptillä toimivat suodatinpainikkeet ja verkkovarauslomakkeen ilman JS:ää (`.no-js .filters, .no-js #booking-form { display: none; }`), jotta sivulle ei jää toimimattomia painikkeita.
- Lisäsin `@media (prefers-reduced-motion: reduce)` -säännön animaatioiden ja pehmeän vierityksen poistamiseksi käyttäjän järjestelmäasetuksen mukaan.
- Paransin näppäimistökäytettävyyttä selkeällä `:focus-visible`-reunuksella ja varmistin, että skripti ladataan `defer`-attribuutilla.

## Selitys ja havainnot
- **Mikä teki suurimman eron:** Sivusto oli jo valmiiksi kevyt ilman raskaita kuvatiedostoja tai ulkoisia kirjastoja, joten pyyntöjen määrä ja siirretty tietomäärä pysyivät reilusti alle 1 Mt:n. Suurin vaikutus käyttökokemukseen ja luotettavuuteen tuli ei-toimivien JS-elementtien piilottamisesta, jolloin sivu toimii kaikilla yhteyksillä ja laitteilla. Julkaistussa versiossa GitHub Pagesin zlib pakkaus pienensi siirretyn datan 18,2 kilotavusta 6,8 kilotavuun, nopeutti LCP-ajan 1,9 sekunnista 1,3 sekuntiin ja nosti mobiili-Lighthousen tuloksen sataan.
- **Mitä kokeilin / huomioita:** Testasin sivut DevToolsissa JavaScript päällä sekä hitaalla mobiiliyhteydellä (*Slow 4G*) Paikallisessa palvelimessa siirretty tavumäärä kasvoi hieman (17,6 kt → 18,2 kt) lisättyjen CSS-sääntöjen, `localStorage`-tallennuksen ja varasisältöjen vuoksi, mutta sillä ei ollut vaikutusta latausnopeuteen tai Lighthouse-pisteisiin, ja muutokset varmistivat virheettömän toiminnan JavaScriptillä.