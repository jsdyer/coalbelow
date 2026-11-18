import {groupArea, recordsFor} from "./model.mjs";
const get = id => document.getElementById(id);
const area = get("area"), feature = get("feature"), detail = get("detail");
const map = L.map("map", {scrollWheelZoom:false}).setView([45.5,-62.6],7);
const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19, attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'});
map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
L.control.scale({imperial:false}).addTo(map);
map.createPane("seams").style.zIndex = 415;
const paths = new Map();
let rows = [], selected = null;
function paint(p, active) {
  if (p.kind === "seam") return {pane:"seams",color:active ? "#082e9a" : "#763b1d",weight:active ? 6 : 3};
  return {color:active ? "#082e9a" : "#785a13",weight:active ? 4 : 1.7,fillColor:active ? "#839dd8" : "#d7a941",fillOpacity:0.45};
}
const layers = L.geoJSON(null,{
  style: f => paint(f.properties,false),
  onEachFeature(f, layer) {
    const p = f.properties;
    paths.set(p.id,layer);
    layer.on("click", () => inspect(p.id,false));
    const label = document.createElement("span"); label.textContent = p.name + " · " + p.area;
    layer.bindTooltip(label);
  }
}).addTo(map);
function inspect(id, zoom) {
  if (selected && paths.has(selected)) paths.get(selected).setStyle(paint(paths.get(selected).feature.properties,false));
  selected = id || null;
  feature.value = id;
  const layer = paths.get(id);
  if (!layer) { detail.textContent = "Choose an outline or seam on the map or from the list."; return; }
  const p = layer.feature.properties;
  layer.setStyle(paint(p,true));
  if (zoom) map.fitBounds(layer.getBounds(),{padding:[25,25], maxZoom:15,animate:false});
  detail.textContent = p.name + " · " + p.area + ". " + (p.kind === "workings" ? p.county + " County. Mapped area " + p.hectares.toLocaleString() + " ha. Provincial plan note: " + p.plans + ". " : "") + "Provincial feature " + p.id + ".";
}
function draw() {
  const kinds = ["workings","seam"].filter(k => get(k).checked);
  const visible = recordsFor(rows, area.value, kinds);
  layers.clearLayers(); paths.clear(); selected = null;
  layers.addData(visible);
  feature.replaceChildren(new Option("Choose a feature…",""), ...visible.map(({properties:p}) => new Option(p.name + " · " + p.id,p.id)));
  feature.disabled = !visible.length;
  inspect("",false);
  get("summary").textContent = visible.length + (visible.length === 1 ? " mapped feature" : " mapped features");
  if (visible.length) map.fitBounds(layers.getBounds(),{padding:[22,22],maxZoom:14,animate:false});
}
async function load() {
  const [m,r] = await Promise.all([fetch("./data/index.json"),fetch("./data/features.geojson.gz")]);
  if (!m.ok || !r.ok) throw Error("Source snapshot unavailable");
  const meta = await m.json();
  const bytes = new Uint8Array(await r.arrayBuffer());
  const file = new Blob([bytes]);
  const stream = bytes[0] === 0x1f && bytes[1] === 0x8b ? file.stream().pipeThrough(new DecompressionStream("gzip")) : file.stream();
  const data = await new Response(stream).json();
  rows = data.features;
  const areas = [...new Set(rows.map(f => groupArea(f.properties.area)))].sort();
  area.replaceChildren(new Option("All mapped areas",""),...areas.map(a=>new Option(a,a)));
  area.value = "Springhill";
  for (const id of ["area","seam","workings"]) get(id).addEventListener("change",draw);
  get("streets").addEventListener("change", e => e.target.checked ? tiles.addTo(map) : tiles.remove());
  feature.addEventListener("change", () => inspect(feature.value,true));
  get("stamp").textContent = "Nova Scotia Geological Survey · Edition " + meta.edition + " · Retrieved " + meta.retrieved + ". Province-wide, " + meta.seams + " seam segments and " + (meta.count-meta.seams) + " workings outlines.";
  draw();
}
load().catch(() => { get("summary").textContent = "Could not load the provincial map. Reload in a current browser or open the source below."; });
