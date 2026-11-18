"""Refresh the provincial shapefile edition and prepare geographic browser layers."""
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urljoin
from urllib.request import Request, urlopen
import gzip
import json
import re
import subprocess
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "web/data"
SOURCE = "https://novascotia.ca/natr/meb/download/dp120.asp"


def get(url):
    with urlopen(Request(url, headers={"User-Agent": "CoolCode Coal Below/1.0"}), timeout=60) as response:
        return response.read()


def refresh():
    landing = get(SOURCE).decode("utf-8", errors="replace")
    edition = re.search(r'dataset is current to ([A-Za-z]+ [0-9]{4})', landing, re.I)
    if not edition:
        raise ValueError("Publisher edition missing")
    page = urljoin(SOURCE, "dp120dds.asp")
    listing = get(page).decode("utf-8", errors="replace")
    found = re.search(r'href\s*=\s*"([^"]*/dp120[^"]*\.zip)"', listing, re.I)
    if not found:
        raise ValueError("Download URL missing")
    url = urljoin(page, found[1])
    if not url.startswith("https://novascotia.ca/"):
        raise ValueError("Unknown download host")
    layers = []
    with ZipFile(BytesIO(get(url))) as z, TemporaryDirectory() as tmp:
        for kind, basename in (("seam","n120nscs"), ("workings","n120nswo")):
            for ext in (".dbf",".shp",".shx",".prj"):
                matches = [k for k in z.namelist() if k.lower().endswith("/"+basename+ext)]
                if len(matches) != 1:
                    raise ValueError("Unexpected shapefile structure")
                (Path(tmp)/(basename+ext)).write_bytes(z.read(matches[0]))
            output = subprocess.check_output(["ogr2ogr","-f","GeoJSON","/vsistdout/",str(Path(tmp)/(basename+".shp")),
                "-simplify","6","-t_srs","EPSG:4326","-lco","COORDINATE_PRECISION=5"])
            rows = json.loads(output)["features"]
            if not rows:
                raise ValueError("Empty provincial layer")
            for f in rows:
                p = f["properties"]
                area = p.get("Coal_Area") or p["COAL_AREA"]
                if not area or not f["geometry"] or not p["GEO_NUM"]:
                    raise ValueError("Incomplete geographic record")
                props = dict(id=p['GEO_NUM'],kind=kind,area=area,name=p['NAME'] if kind=='seam' else 'Workings outline')
                if kind=='workings':
                    props.update(plans=p['Mine_Plans'], county=p['COUNTY'], hectares=round(p['Shape_Area']/10000,2))
                layers.append(dict(type="Feature",geometry=f["geometry"],properties=props))
    if len({f["properties"]["id"] for f in layers}) != len(layers):
        raise ValueError("Duplicate feature IDs")
    full = json.dumps(dict(type="FeatureCollection",features=layers),ensure_ascii=False,separators=(',',':')).encode()
    meta = dict(retrieved=str(datetime.now(timezone.utc).date()),edition=edition[1],count=len(layers),
                seams=sum(f["properties"]["kind"]=="seam" for f in layers),archive=url)
    (DATA/"features.geojson.gz").write_bytes(gzip.compress(full,mtime=0))
    (DATA/"index.json").write_text(json.dumps(meta,indent=2)+"\n")
    print(meta)


if __name__ == "__main__":
    refresh()
