const combined = "Sydney Mines - Florence - Point Aconi";
export function groupArea(area) {
  return ["Sydney Mines", "Florence", "Point Aconi"].includes(area) ? combined : area;
}
export function recordsFor(features, area, kinds) {
  return features.filter(({properties:p}) => (!area || groupArea(p.area) === area) && kinds.includes(p.kind))
    .sort((a,b) => a.properties.name.localeCompare(b.properties.name) || a.properties.id.localeCompare(b.properties.id, "en", {numeric:true}));
}
