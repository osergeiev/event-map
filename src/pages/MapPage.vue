<script setup>
import { ref, onMounted, computed } from 'vue'
import LocateMe from '../components/LocateMe.vue'
import AddEvent from '../components/AddEvent.vue'
import FilterEvents from '../components/FilterEvents.vue'
import 'ol/ol.css'
import { Map, View, Overlay } from 'ol'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import Point from 'ol/geom/Point'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Icon, Style } from 'ol/style'
import OSM from 'ol/source/OSM'

const selectedComponent = ref(null)
const leftDrawerOpen = ref(false)
const mapInstance = ref(null)
const vectorSource = ref(null)
const userCoords = ref(null)

function haversineDistance(coords1, coords2) {
  const [lon1, lat1] = coords1
  const [lon2, lat2] = coords2

  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  console.log('Distance:', R * c, 'km')
  return R * c
}

const eventLocations = ref([
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
])

const categories = computed(() => {
  const allCategories = eventLocations.value.map((event) => event.category)
  return [...new Set(allCategories)]
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function selectComponent(component) {
  selectedComponent.value = component
}

const userLocationSource = new VectorSource()
const userLocationLayer = new VectorLayer({
  source: userLocationSource,
  style: new Style({
    image: new Icon({
      src: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png',
      scale: 0.7,
      anchor: [0.5, 1],
    }),
  }),
})

const handleLocationFound = (projectedCoords) => {
  userLocationSource.clear()
  if (projectedCoords) {
    const wgs84Coords = toLonLat(projectedCoords)
    userCoords.value = wgs84Coords

    const feature = new Feature(new Point(projectedCoords))
    userLocationSource.addFeature(feature)

    mapInstance.value.getView().animate({
      center: projectedCoords,
      zoom: 14,
      duration: 1000,
    })
  } else {
    userCoords.value = null
  }
}

const handleLocationError = (message) => {
  alert(message)
}

function handleFilterChange(filters) {
  vectorSource.value.clear()

  const filteredEvents = eventLocations.value.filter((event) => {
    const matchesCategory = filters.category === 'All' || event.category === filters.category
    const matchesName =
      !filters.name.trim() || event.name.toLowerCase().includes(filters.name.toLowerCase().trim())
    const matchesDescription =
      !filters.description.trim() ||
      event.description.toLowerCase().includes(filters.description.toLowerCase().trim())
    let matchesDistance = true
    if (filters.distance !== 'All' && userCoords.value) {
      const maxDistance = parseInt(filters.distance.value)
      const distance = haversineDistance(userCoords.value, event.coords)
      matchesDistance = distance <= maxDistance
    }

    return matchesCategory && matchesName && matchesDescription && matchesDistance
  })

  filteredEvents.forEach((event) => {
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
    vectorSource.value.addFeature(marker)
  })
}

onMounted(() => {
  vectorSource.value = new VectorSource()

  eventLocations.value.forEach((event) => {
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
    vectorSource.value.addFeature(marker)
  })

  const map = new Map({
    target: 'map',
    layers: [
      new TileLayer({ source: new OSM() }),
      new VectorLayer({ source: vectorSource.value }),
      userLocationLayer,
    ],
    view: new View({
      center: fromLonLat([15.9819, 45.8131]),
      zoom: 14,
    }),
  })

  map.on('click', (evt) => {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f)
    if (feature) {
      const coords = feature.getGeometry().getCoordinates()
      const eventData = feature.get('eventData')

      const popupElement = document.createElement('div')
      popupElement.className = 'popup'
      popupElement.innerHTML = `
        <div>
          <strong>${eventData.name}</strong><br>
          <em>${eventData.category}</em><br>
          ${eventData.description}
        </div>
        <button class="close-btn">X</button>
      `

      popupElement.querySelector('.close-btn').addEventListener('click', () => {
        map.removeOverlay(overlay)
      })

      const overlay = new Overlay({
        element: popupElement,
        position: coords,
        positioning: 'bottom-center',
        stopEvent: true,
        offset: [0, -45],
      })

      map.addOverlay(overlay)

      setTimeout(() => {
        map.removeOverlay(overlay)
      }, 5000)
    }
  })

  map.on('pointermove', (evt) => {
    const hit = map.hasFeatureAtPixel(evt.pixel)
    const mapElement = map.getTargetElement()
    mapElement.style.cursor = hit ? 'pointer' : ''
  })

  mapInstance.value = map
})
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>Interactive Event Map</q-toolbar-title>
        <LocateMe @location-found="handleLocationFound" @location-error="handleLocationError" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>Menu</q-item-label>
        <q-item clickable @click="selectComponent('AddEvent')">
          <q-item-section>Add Event</q-item-section>
        </q-item>
        <q-item clickable @click="selectComponent('FilterEvents')">
          <q-item-section>Filter Events</q-item-section>
        </q-item>
      </q-list>

      <div v-if="selectedComponent === 'AddEvent'" class="drawer-content">
        <AddEvent />
      </div>
      <div v-else-if="selectedComponent === 'FilterEvents'" class="drawer-content">
        <FilterEvents
          :categories="categories"
          @filter-change="handleFilterChange"
          :location-available="!!userCoords"
        />
      </div>
    </q-drawer>

    <q-page-container>
      <div class="map-container">
        <div id="map"></div>
      </div>
    </q-page-container>
  </q-layout>
</template>

<style>
.popup {
  position: absolute;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  transform: translate(-50%, -100%);
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

.popup:active {
  cursor: default;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #333;
}

.map-container {
  position: relative;
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
