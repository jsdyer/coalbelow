import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";
import {groupArea,recordsFor} from "../web/model.mjs";
const rows = JSON.parse(gunzipSync(readFileSync(new URL("../web/data/features.geojson.gz",import.meta.url)))).features;
const meta = JSON.parse(readFileSync(new URL("../web/data/index.json",import.meta.url)));
test("Snapshot totals match the two mapped layers",()=>{
  assert.equal(rows.length, meta.count);
  assert.equal(recordsFor(rows,"",["seam"]).length,meta.seams);
  assert.ok(rows.every(f=>f.geometry?.coordinates.length));
});
test("Combined Cape Breton seam area retains its component workings",()=>{
  const subset = recordsFor(rows,groupArea("Florence"),["workings"]);
  assert.deepEqual(new Set(subset.map(f=>f.properties.area)),new Set(["Florence","Point Aconi","Sydney Mines"]));
  assert.deepEqual(recordsFor(rows,"Springhill",[]),[]);
});
