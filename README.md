# VaraMap Studio

VaraMap Studio is an interactive, responsive, high-aesthetic React web application built for performing basic geospatial operations. It integrates Maplibre GL JS (a 100% free, open-source mapping engine requiring no credentials or payment card sign-ups) alongside Turf.js for real-time area calculations. The UI is built using Bootstrap layout grids and CSS-based Dark Glassmorphism styles.

---

<img width="1920" height="1080" alt="Screenshot 2026-07-06 193031" src="https://github.com/user-attachments/assets/887d6548-fb9a-4ff1-ad3e-576a61cf44d6" />


## Key Features

### 1. Map Canvas Setup
- Centered on **AECS Layout, Bangalore, India** (`[77.7125, 12.9645]`) on startup.
- Uses CARTO's free Dark Matter raster tiles to maintain a premium dark-themed map canvas.
- Incorporates a 3D-angled map pitch for aesthetic depth.

### 2. Interactive Markers
- **Add Markers:** Click the map canvas in **Marker Mode** to place custom glowing markers featuring a cyan inner core and pulsing animation.
- **Marker Popups:** Click on any placed marker to see its exact longitude and latitude in a map popup.
- **Sidebar List:** Track all placed markers in the sidebar. Click any marker in the list to fly the map camera directly to that coordinate.
- **Individual Deletion:** Delete specific markers directly from the list.

### 3. Polygon Drawing & Turf.js Calculations
- **Draw Vertices:** Click the map canvas in **Draw Mode** to draw polygon vertices.
- **Visual Feedback:** Renders vertices as glowing dots, drawing connecting lines for 2 vertices and a translucent purple fill layer with cyan outlines for 3+ vertices.
- **Real-time Area Calculation:** Automatically processes the coordinates with Turf.js (`turf.polygon`, `turf.area`) to output the surface area in real-time in square meters ($m^2$) or square kilometers ($km^2$) if the area is large.
- **Individual Deletion:** Remove specific vertices from the list to modify shape points in real-time.

### 4. Cache Persistence (Autosave & Auto-restore)
- **Background Autosave:** Automatically updates and saves the map state (markers and polygon vertices) in the browser's `localStorage` cache in real-time as you add, modify, or delete elements.
- **Automatic Restoration:** Re-reads the browser cache on startup and instantly restores the last session's active markers, polygon vertices, and map center coordinates, providing a seamless user experience.
- **Clear Canvas:** Single-click "Clear Active Map" clears all active markers, polygon overlays, and stats from both the screen and the local cache.

### 5. GeoJSON Interoperability (Bonus Features)
- **GeoJSON Export:** Downloads a compiled `.geojson` file representing the current map features (Points for markers, and LineString/Polygon for drawn shapes) directly to your local computer.
- **GeoJSON Import:** Uploads a `.geojson` file to parse and render markers and polygons onto the active canvas, immediately flying the map camera to focus on the imported data.

### 6. Fully Responsive Design
- Powered by Bootstrap grids and flex layout properties.
- **Desktop:** Sidebar dashboard fits on the left side, map occupies the right side.
- **Mobile/Tablets:** Flex layout stacks elements vertically. The map occupies the top portion ($60\%$ height) and the control sidebar fits in a scrollable bottom section ($40\%$ height) so all tools and visual elements remain accessible simultaneously.

---

## Project Structure

This project follows React best practices by isolating business logic into a custom hook and partitioning layout segments into modular components:

```
src/
├── components/          # Modular UI components
│   ├── ActionPanel.js   # Save, Load, Import, and Export operations
│   ├── InfoBanner.js    # Quick start instructions overlay
│   ├── MapContainer.js  # Maplibre GL JS map canvas component
│   ├── ModeSelector.js  # Interaction mode toggle (Navigate/Marker/Draw)
│   ├── SidebarHeader.js # Sidebar title and app logo
│   ├── StatsDisplay.js  # Placed markers count and Turf.js area display
│   ├── TabsSection.js   # Marker and Vertex list coordinate trackers
│   └── Toast.js         # Floating feedback popups
├── hooks/
│   └── useMapState.js   # Custom hook handling map state, LocalStorage, and Turf computations
├── App.js               # Entry point (imports components and coordinates state)
├── App.css              # Custom Glassmorphic styles
├── index.js             # React DOM root setup & Bootstrap import
└── index.css            # Base resets and global variable definitions
```

---

## Tech Stack
- **Framework:** ReactJS
- **Mapping Engine:** Maplibre GL JS (Open-source fork of Mapbox GL JS)
- **Tile Provider:** CARTO (Dark Matter Tiles)
- **Geospatial Processing:** Turf.js
- **Styling:** Bootstrap v5 (Grid & Spacing utilities) + Vanilla CSS (Glassmorphism card layers)
- **Icons:** Lucide React

---

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

### Installation & Local Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Rajdeep1060/varaha-assignment.git
   cd varaha-assignment
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   You can run the standard React script. To suppress warnings about missing third-party package source maps (from Turf's dependencies) directly in your terminal console, use:
   - **Windows (PowerShell):**
     ```powershell
     $env:GENERATE_SOURCEMAP="false"; npm start
     ```
   - **macOS/Linux:**
     ```bash
     GENERATE_SOURCEMAP=false npm start
     ```
   - **Alternative (Standard):**
     ```bash
     npm start
     ```
   Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

4. **Run Unit Tests:**
   ```bash
   npm test
   ```
   Runs Jest test cases checking core layout mounting and element availability.

5. **Build for Production:**
   ```bash
   npm run build
   ```
   Compiles optimized production builds into the `build` directory.
