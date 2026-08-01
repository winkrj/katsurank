declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions)
    setLevel(level: number): void
    getLevel(): number
    setMaxLevel(level: number): void
    setCenter(latlng: LatLng): void
    getCenter(): LatLng
    panTo(latlng: LatLng): void
    getProjection(): Projection
  }

  class LatLng {
    constructor(lat: number, lng: number)
    getLat(): number
    getLng(): number
  }

  class Point {
    constructor(x: number, y: number)
    x: number
    y: number
  }

  interface Projection {
    pointFromCoords(coords: LatLng): Point
    coordsFromPoint(point: Point): LatLng
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions)
    setMap(map: Map | null): void
    getContent(): HTMLElement | string
    setContent(content: HTMLElement | string): void
    getPosition(): LatLng
  }

  interface MapOptions {
    center: LatLng
    level?: number
    draggable?: boolean
    scrollwheel?: boolean
    disableDoubleClick?: boolean
    disableDoubleClickZoom?: boolean
  }

  class Marker {
    constructor(options: MarkerOptions)
    setMap(map: Map | null): void
  }

  interface MarkerOptions {
    position: LatLng
    map?: Map
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions)
    open(map: Map, marker: Marker): void
    close(): void
  }

  interface InfoWindowOptions {
    content: HTMLElement | string
    removable?: boolean
  }

  interface CustomOverlayOptions {
    position: LatLng
    content: HTMLElement | string
    xAnchor?: number
    yAnchor?: number
    zIndex?: number
  }
}

interface Window {
  kakao: typeof kakao & {
    maps: typeof kakao.maps & {
      load(callback: () => void): void
    }
  }
}
