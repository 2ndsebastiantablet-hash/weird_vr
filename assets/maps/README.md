# Match map assets

The three Quest-optimized GLB maps are installed in this folder and loaded directly by `index.html`:

- `street_city_buildings_8.glb`
- `mansion_furnished_quest.glb`
- `pine_forest.glb`

Each map uses a lightweight primitive fallback until its GLB finishes loading. The fallback remains available if a model fails to load. Simplified invisible collision proxies are used for stable Gorilla locomotion performance in Meta Quest Browser.

The mansion file is a Quest-optimized derivative of the originally uploaded `mansion_furnished.glb`.
