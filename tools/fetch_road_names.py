#!/usr/bin/env python3
"""Fetch real street names from OpenStreetMap for the Springfield region and save tools/road_names.json.
Run once with internet access, then run tools/build_region.py to put the names into the map squares.
Uses the public Overpass API in tiles so no single request is large."""
import json, math, os, sys, time, urllib.parse, urllib.request
LAT0, LON0, MILES = 37.2089, -93.2923, 50
dlat = MILES*1609.34/110574; dlon = MILES*1609.34/(111320*math.cos(math.radians(LAT0)))
S, N, W, E = LAT0 - dlat, LAT0 + dlat, LON0 - dlon, LON0 + dlon
STEP = 0.25
URL = os.environ.get('OVERPASS', 'https://overpass-api.de/api/interpreter')
out = []; seen = set()
lat = S
while lat < N:
    lon = W
    while lon < E:
        q = '[out:json][timeout:90];way["highway"]["name"~"."](%f,%f,%f,%f);out tags geom;' % (lat, lon, lat + STEP, lon + STEP)
        q2 = '[out:json][timeout:90];way["highway"]["ref"~"."][!"name"](%f,%f,%f,%f);out tags geom;' % (lat, lon, lat + STEP, lon + STEP)
        for qq in (q, q2):
            for attempt in range(4):
                try:
                    data = json.load(urllib.request.urlopen(urllib.request.Request(URL, urllib.parse.urlencode({'data': qq}).encode()), timeout=120)); break
                except Exception as e:
                    print('retry', e, file=sys.stderr); time.sleep(10*(attempt + 1))
            else: continue
            for el in data.get('elements', []):
                if el['id'] in seen or 'geometry' not in el: continue
                seen.add(el['id']); t = el.get('tags', {})
                out.append({'n': t.get('name', ''), 'r': t.get('ref', ''), 'c': [[round(g['lon'], 6), round(g['lat'], 6)] for g in el['geometry']]})
        print('tile', round(lat, 2), round(lon, 2), len(out), file=sys.stderr)
        lon += STEP; time.sleep(2)
    lat += STEP
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'road_names.json'), 'w'), separators=(',', ':'))
print('saved', len(out), 'named ways')
