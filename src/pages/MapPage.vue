<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import LocateMe from '../components/LocateMe.vue'
import AddEvent from '../components/AddEvent.vue'
import FilterEvents from '../components/FilterEvents.vue'
import LogIn from '../components/LogIn.vue'
import LogOut from '../components/LogOut.vue'
import EditEvent from '../components/EditEvent.vue'
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
import { useAuth0 } from '@auth0/auth0-vue'

const { user, isAuthenticated, idTokenClaims, getAccessTokenSilently } = useAuth0()
const selectedComponent = ref(null)
const leftDrawerOpen = ref(false)
const mapInstance = ref(null)
const vectorSource = ref(null)
const userCoords = ref(null)
const selectedCoords = ref(null)
const eventLocations = ref([])
const categories = computed(() => {
  const allCategories = eventLocations.value.map((event) => event.category)
  return [...new Set(allCategories)]
})
const activePopups = new Set()
const roles = computed(() => {
  const claims = idTokenClaims.value
  return claims ? claims['https://interactive-event-map/roles'] || [] : []
})

const editEventDialog = ref(false)
const currentEventToEdit = ref(null)
const mapClickEnabled = ref(false)

const openEditDialog = (event) => {
  editEventDialog.value = false

  nextTick(() => {
    currentEventToEdit.value = { ...event }
    editEventDialog.value = true
  })
}

const handleUpdateEvent = async (updatedEvent) => {
  try {
    const token = await getAccessTokenSilently()
    const res = await fetch(`https://localhost:7236/api/Event/${updatedEvent.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        EventName: updatedEvent.name,
        Description: updatedEvent.description,
        CategoryName: updatedEvent.category,
        Status: updatedEvent.status,
        Longitude: updatedEvent.coords[0],
        Latitude: updatedEvent.coords[1],
      }),
    })

    if (!res.ok) throw new Error('Failed to update event')

    const index = eventLocations.value.findIndex((e) => e.id === updatedEvent.id)
    if (index !== -1) {
      eventLocations.value[index] = updatedEvent
      refreshMarkers()
    }

    activePopups.forEach((popup) => mapInstance.value.removeOverlay(popup))
    activePopups.clear()
  } catch (error) {
    console.error('Error updating event:', error)
  }
}

function haversineDistance(coords1, coords2) {
  const [lon1, lat1] = coords1
  const [lon2, lat2] = coords2

  const R = 6371
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

async function loadEvents() {
  try {
    const res = await fetch('https://localhost:7236/api/Event', {})
    if (!res.ok) throw new Error('Failed to load events')
    const data = await res.json()
    eventLocations.value = data.map((event) => ({
      id: event.eventId,
      name: event.eventName,
      category: event.categoryName,
      description: event.description,
      coords: [event.longitude, event.latitude],
      status: event.status.toLowerCase(),
      date: event.eventDate,
    }))
    refreshMarkers()
  } catch (error) {
    console.error('Error loading events:', error)
  }
}

loadEvents()

const handleEventSubmit = async (newEvent) => {
  try {
    const token = await getAccessTokenSilently()
    console.log(token)
    const res = await fetch('https://localhost:7236/api/Event', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        EventName: newEvent.name,
        Description: newEvent.description,
        CategoryName: newEvent.category,
        Longitude: newEvent.coords[0],
        Latitude: newEvent.coords[1],
      }),
    })
    if (!res.ok) throw new Error('Failed to create event')

    const createdEvent = await res.json()
    const formattedEvent = {
      id: createdEvent.eventId,
      name: createdEvent.eventName,
      category: createdEvent.categoryName,
      description: createdEvent.description,
      coords: [createdEvent.longitude, createdEvent.latitude],
      status: 'pending',
    }
    eventLocations.value.push(formattedEvent)
    addMarker(formattedEvent)
    selectedCoords.value = null
    loadEvents()
    selectedCoords.value = null
  } catch (error) {
    console.error('Error submitting event:', error)
  }
}

function addMarker(event) {
  const marker = new Feature({
    geometry: new Point(fromLonLat(event.coords)),
    eventData: event,
  })
  const iconSrc =
    event.status === 'approved'
      ? 'https://openlayers.org/en/latest/examples/data/icon.png'
      : 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png'

  marker.setStyle(
    new Style({
      image: new Icon({
        src: iconSrc,
        scale: 0.8,
        anchor: [0.5, 1],
      }),
    }),
  )
  vectorSource.value.addFeature(marker)
}

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function selectComponent(component) {
  selectedComponent.value = component
  selectedCoords.value = null
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

    console.log(event.status)
    const iconSrc =
      event.status === 'approved'
        ? 'https://openlayers.org/en/latest/examples/data/icon.png'
        : 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png'
    marker.setStyle(
      new Style({
        image: new Icon({
          src: iconSrc,
          scale: 0.8,
          anchor: [0.5, 1],
        }),
      }),
    )
    vectorSource.value.addFeature(marker)
  })
}

async function approveEvent(event) {
  try {
    const token = await getAccessTokenSilently()
    const res = await fetch(`https://localhost:7236/api/Event/${event.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    })
    if (!res.ok) throw new Error('Failed to approve event')

    const updatedEvent = await res.json()
    const index = eventLocations.value.findIndex((e) => e.id === updatedEvent.id)
    if (index !== -1) {
      eventLocations.value[index].status = 'approved'
      refreshMarkers()
    }
  } catch (error) {
    console.error('Error approving event:', error)
  }
}

async function deleteEvent(event) {
  try {
    const token = await getAccessTokenSilently()
    const res = await fetch(`https://localhost:7236/api/Event/${event.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Failed to delete event')

    eventLocations.value = eventLocations.value.filter((e) => e.id !== event.id)
    refreshMarkers()
  } catch (error) {
    console.error('Error deleting event:', error)
  }
}

function refreshMarkers() {
  vectorSource.value.clear()
  eventLocations.value.forEach((event) => {
    const marker = new Feature({
      geometry: new Point(fromLonLat(event.coords)),
      eventData: event,
    })

    const iconSrc =
      event.status === 'approved'
        ? 'https://openlayers.org/en/latest/examples/data/icon.png'
        : 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png'

    marker.setStyle(
      new Style({
        image: new Icon({
          src: iconSrc,
          scale: 0.8,
          anchor: [0.5, 1],
        }),
      }),
    )
    vectorSource.value.addFeature(marker)
  })
}

function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString)

  // Format time (HH:mm) in 24-hour format
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

  // Format date (DD/MM/YYYY)
  const formattedDate = date.toLocaleDateString('en-GB') // 'en-GB' ensures DD/MM/YYYY format

  return `${time} ${formattedDate}`
}

onMounted(() => {
  vectorSource.value = new VectorSource()

  eventLocations.value.forEach((event) => {
    const marker = new Feature({
      geometry: new Point(fromLonLat(event.coords)),
      eventData: event,
    })

    const iconSrc =
      event.status === 'approved'
        ? 'https://openlayers.org/en/latest/examples/data/icon.png' // Approved marker
        : 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png'

    marker.setStyle(
      new Style({
        image: new Icon({
          src: iconSrc,
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
    if (mapClickEnabled.value) {
      const coords = toLonLat(evt.coordinate)
      selectedCoords.value = coords
      mapClickEnabled.value = false
      return
    }
    if (selectedComponent.value === 'AddEvent') {
      const coords = toLonLat(evt.coordinate)
      selectedCoords.value = coords
      return
    }
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f)
    if (feature) {
      if (activePopups.has(feature)) {
        return
      }

      const coords = feature.getGeometry().getCoordinates()
      const eventData = feature.get('eventData')

      const popupElement = document.createElement('div')
      popupElement.className = 'popup'
      popupElement.innerHTML = `
        <div>
          <strong>${eventData.name}</strong><br>
          <em>${eventData.category}</em><br>
          ${eventData.description}<br>
          Created: ${formatDateTime(eventData.date)}
        </div>
        <button class="close-btn">X</button>
        ${
          roles.value?.includes('admin') && eventData.status !== 'approved'
            ? '<button class="approve-btn">✔</button>'
            : ''
        }
        ${roles.value?.includes('admin') ? '<button class="delete-btn">🗑</button>' : ''}
        ${
          roles.value?.includes('admin') && eventData.status == 'approved'
            ? '<button class="edit-btn">✎</button>'
            : ''
        }
        `

      if (roles.value?.includes('admin') && eventData.status !== 'approved') {
        popupElement.querySelector('.approve-btn').addEventListener('click', () => {
          approveEvent(eventData)
          map.removeOverlay(overlay)
          activePopups.delete(feature)
        })

        popupElement.querySelector('.delete-btn').addEventListener('click', () => {
          deleteEvent(eventData)
          map.removeOverlay(overlay)
          activePopups.delete(feature)
        })
      }
      if (roles.value?.includes('admin') && eventData.status == 'approved') {
        popupElement.querySelector('.edit-btn').addEventListener('click', () => {
          openEditDialog(eventData)
          map.removeOverlay(overlay)
          activePopups.delete(feature)
        })

        popupElement.querySelector('.delete-btn').addEventListener('click', () => {
          deleteEvent(eventData)
          map.removeOverlay(overlay)
          activePopups.delete(feature)
        })
      }

      popupElement.querySelector('.close-btn').addEventListener('click', () => {
        map.removeOverlay(overlay)
        activePopups.delete(feature)
      })

      const overlay = new Overlay({
        element: popupElement,
        position: coords,
        positioning: 'bottom-center',
        stopEvent: true,
        offset: [0, -45],
      })

      map.addOverlay(overlay)
      activePopups.add(feature)

      setTimeout(() => {
        map.removeOverlay(overlay)
        activePopups.delete(feature)
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
  <q-layout view="hHh Lpr fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>Interactive Event Map</q-toolbar-title>
        <LocateMe @location-found="handleLocationFound" @location-error="handleLocationError" />
        <LogIn v-if="!isAuthenticated" />
        <LogOut v-if="isAuthenticated" />
        <q-chip square color="primary" text-color="white" v-if="isAuthenticated">
          {{ user.name }}
          <q-tooltip>{{ user.email }}</q-tooltip>
        </q-chip>
      </q-toolbar>
    </q-header>
    <EditEvent
      v-if="editEventDialog"
      :event="currentEventToEdit"
      :categories="categories"
      :selected-coords="selectedCoords"
      :map-click-enabled="mapClickEnabled"
      @update-event="handleUpdateEvent"
      @update:mapClickEnabled="(val) => (mapClickEnabled = val)"
    />
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>Menu</q-item-label>
        <q-item v-if="isAuthenticated" clickable @click="selectComponent('AddEvent')">
          <q-item-section>Add Events</q-item-section>
        </q-item>
        <q-item clickable @click="selectComponent('FilterEvents')">
          <q-item-section>Filter Events</q-item-section>
        </q-item>
      </q-list>

      <div v-if="selectedComponent === 'AddEvent'" class="drawer-content">
        <AddEvent
          :categories="categories"
          :user-coords="userCoords"
          :selected-coords="selectedCoords"
          @event-submitted="handleEventSubmit"
        />
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

#map:hover {
  cursor: pointer;
}

#map:active {
  cursor: grabbing;
}

.approve-btn,
.delete-btn,
.edit-btn {
  display: inline-block;
  padding: 3px 8px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition:
    background-color 0.3s,
    transform 0.2s;
  margin-top: 4px;
}

.approve-btn {
  background-color: #4caf50;
  color: white;
}

.approve-btn:hover {
  background-color: #43a047;
  transform: scale(1.05);
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover {
  background-color: #e53935;
  transform: scale(1.05);
}

.edit-btn {
  background-color: #ffc107;
}
.edit-btn:hover {
  background-color: #ffbf00;
  transform: scale(1.05);
}

.approve-btn + .delete-btn {
  margin-left: 4px;
}
</style>
