import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment';
import type { FleetPosition } from './fleet-intelligence.models';

@Component({
  selector: 'app-fleet-map',
  template: '<div #map class="fleet-map" aria-label="Fleet location map"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetMapComponent implements AfterViewInit, OnDestroy {
  readonly positions = input<FleetPosition[]>([]);
  private readonly mapElement = viewChild.required<ElementRef<HTMLElement>>('map');
  private map?: L.Map;
  private readonly markers = L.layerGroup();

  constructor() {
    effect(() => {
      const positions = this.positions();
      if (this.map) this.render(positions);
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement().nativeElement, { scrollWheelZoom: false }).setView(
      [20.5937, 78.9629],
      5,
    );
    L.tileLayer(environment.fleet.tileUrl, {
      attribution: environment.fleet.tileAttribution,
      maxZoom: 19,
    }).addTo(this.map);
    this.markers.addTo(this.map);
    this.render(this.positions());
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private render(positions: FleetPosition[]): void {
    this.markers.clearLayers();
    const points: L.LatLngExpression[] = [];
    for (const position of positions) {
      const point: L.LatLngExpression = [position.latitude, position.longitude];
      points.push(point);
      const simulated = position.source === 'SIMULATOR';
      L.circleMarker(point, {
        radius: 8,
        color: simulated ? '#6d4aff' : '#2563eb',
        fillOpacity: 0.8,
      })
        .bindPopup(
          `<strong>${this.escape(position.vehicleRef)}</strong><br>${simulated ? 'SIMULATED LOCATION' : 'Live provider location'}<br>${new Date(position.recordedAt).toLocaleString()}`,
        )
        .addTo(this.markers);
    }
    if (points.length)
      this.map?.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 15 });
  }

  private escape(value: string): string {
    return value.replace(
      /[&<>'"]/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ??
        character,
    );
  }
}
