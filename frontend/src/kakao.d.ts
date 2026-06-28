declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions)
    setLevel(level: number): void
    getLevel(): number
    setCenter(latlng: LatLng): void
    getCenter(): LatLng
  }

  class LatLng {
    constructor(lat: number, lng: number)
    getLat(): number
    getLng(): number
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
