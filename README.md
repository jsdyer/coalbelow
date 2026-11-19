# Coal Below

[Explore the map](https://coolcode.ca/coalbelow/)

Explore Nova Scotia Geological Survey records of coal seams and underground mining. Start in Springhill, switch to another coal area or view all the mapped features in the province. Click a feature or choose it from the list to see its provincial identifier. Street tiles show the modern landscape.

<!-- coolcode:guide -->
Start with modern streets and landmarks beneath the Springhill coalfield. Toggle the seam lines and shaded workings separately, then select a workings outline to read its mapped area and mine-plan note. The three Sydney Mines, Florence and Point Aconi workings areas share a seam layer and appear together in the area selector.
<!-- /coolcode:guide -->

For the fossils documented in the Joggins Formation, see [Fossil Neighbours](https://coolcode.ca/fossilneighbours/?formation=Joggins).

## Data and interpretation

The province distributes the two layers together as [Digital Product ME 120, Nova Scotia Coal Seams and Underground Mine Workings](https://novascotia.ca/natr/meb/download/dp120.asp). The initial October 2026 edition includes 257 coal seam segments and 109 underground workings outlines. The retrieval date records the last successful source download. The edition date is the province’s date for the dataset. These dates can differ.

Seam names and area labels come from the source. Each workings polygon retains its county, plan-availability note, and area in hectares, converted from the published square-metre field before simplification. A digitized outline can represent more than one mine. The province describes gaps and uncertainty in the source records. Use the provincial documentation for history, survey references and advice on interpreting the dataset. The map cannot establish mining hazards or conditions at an individual property.

The refresh discovers the published shapefile ZIP, extracts the two named layers, simplifies with a six-metre tolerance in the projected source coordinates, transforms to WGS 84 and rounds to five decimal places. These steps keep the browser download small. The original ZIP retains the full resolution. Provincial geometry loads from the site. Streets are on by default and can be switched off. Displaying streets requests visible map tiles from OpenStreetMap and reveals the viewed area to that provider. The app stores no user selections. Map rendering uses vendored Leaflet 1.9.4 with its BSD-2-Clause license in web/vendor.

## Maintenance

A monthly GitHub Actions job retrieves and validates the provincial archive and publishes the resulting snapshot. The previous published site stays available if the job fails. On a system with GDAL installed, run `python3 scripts/refresh.py` to retrieve current data. Update the short source description in tool.json and the marked guide above when the features or coverage change.

Run `node --test tests/*.test.mjs`, `python3 -m unittest discover -s tests -v`, and `python3 scripts/build.py`. Serve dist with `python3 -m http.server 8000 --directory dist`. CI also verifies feature selection, filtering and the mobile layout in Chromium.
