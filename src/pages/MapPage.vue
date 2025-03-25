<script setup>
import { onMounted, ref } from 'vue'
import 'ol/ol.css'
import { Map, View, Overlay } from 'ol'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import Point from 'ol/geom/Point'
import { fromLonLat } from 'ol/proj'
import { Icon, Style } from 'ol/style'
import OSM from 'ol/source/OSM'

const popupContent = ref('')
const popupVisible = ref(false)
let popupOverlay = null

onMounted(() => {
  const eventLocations = [
    {
      category: 'Traffic & Accidents',
      name: 'Car Accident',
      description: 'Minor crash at. Traffic is slow.',
      coords: [15.98, 45.81],
    },
    {
      category: 'Traffic & Accidents',
      name: 'Public Transport Delay',
      description: 'Trams/buses stopped at. No info yet.',
      coords: [16.0, 45.8],
    },

    {
      category: 'Emergencies & Hazards',
      name: 'Fire Alert',
      description: 'Small fire spotted near. Firefighters on the way.',
      coords: [15.95, 45.82],
    },
    {
      category: 'Emergencies & Hazards',
      name: 'Street Flooding',
      description: 'Water levels rising at. Avoid this area.',
      coords: [16.01, 45.83],
    },
    {
      category: 'Emergencies & Hazards',
      name: 'Power Outage',
      description: 'No electricity in. Anyone else experiencing this?',
      coords: [15.98, 45.85],
    },

    {
      category: 'Crime & Security',
      name: 'Police Activity',
      description: "Heavy police presence at. Something's happening.",
      coords: [16.05, 45.8],
    },

    {
      category: 'Public Gatherings & Social Events',
      name: 'Protest/Demonstration',
      description: 'Large protest gathering at. Expect delays.',
      coords: [15.96, 45.79],
    },

    {
      category: 'Community & Miscellaneous',
      name: 'Lost & Found',
      description: "Found a wallet at. Contact me if it's yours.",
      coords: [16.02, 45.87],
    },
    {
      category: 'Community & Miscellaneous',
      name: 'Animal Sightings',
      description: 'Stray dog spotted near. Looks lost.',
      coords: [15.99, 45.88],
    },
    {
      category: 'Community & Miscellaneous',
      name: 'Strange Noise',
      description: 'Loud explosion heard near. Anyone know what happened?',
      coords: [15.97, 45.84],
    },
  ]

  const vectorSource = new VectorSource()
  eventLocations.forEach((event) => {
    const marker = new Feature({
      geometry: new Point(fromLonLat(event.coords)),
      eventData: event,
    })
    marker.setStyle(
      new Style({
        image: new Icon({
          src: 'https://openlayers.org/en/latest/examples/data/icon.png',
          scale: 0.8,
          anchor: [0.5, 1],
        }),
      }),
    )
    vectorSource.addFeature(marker)
  })

  const popupElement = document.getElementById('popup')
  popupOverlay = new Overlay({
    element: popupElement,
    positioning: 'top-center',
    offset: [0, -140],
    stopEvent: false,
  })

  const map = new Map({
    target: 'map',
    layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source: vectorSource })],
    view: new View({
      center: fromLonLat([15.9819, 45.8131]),
      zoom: 14,
    }),
    overlays: [popupOverlay],
  })

  map.on('click', (evt) => {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f)
    if (feature) {
      const coords = feature.getGeometry().getCoordinates()
      const eventData = feature.get('eventData')
      popupContent.value = `
        <strong>${eventData.name}</strong><br>
        <em>${eventData.category}</em><br>
        ${eventData.description}
      `
      popupOverlay.setPosition(coords)
      popupVisible.value = true
    } else {
      popupVisible.value = false
    }
  })

  map.on('pointermove', (evt) => {
    const hit = map.hasFeatureAtPixel(evt.pixel)
    const mapElement = map.getTargetElement()
    if (hit) {
      mapElement.style.cursor = 'pointer'
    } else {
      mapElement.style.cursor = ''
    }
  })

  map.on('movestart', () => {
    popupVisible.value = false
  })
})
</script>

<template>
  <div class="map-container">
    <div id="map"></div>
    <div id="popup" v-show="popupVisible" class="popup" v-html="popupContent"></div>
  </div>
</template>

<style>
.popup {
  position: relative;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.popup::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  border-top-color: white;
  transform: translateX(-50%);
}

.map-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

#map {
  width: 100%;
  height: 100vh;
  border-radius: 8px;
}

#map:active {
  cursor: grabbing;
}
</style>
