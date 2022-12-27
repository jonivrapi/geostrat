import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import * as L from 'leaflet';
import { Control, Map, TileLayer, GeoJSON as GeoJson, DomUtil } from 'leaflet';
import { GeoJSON } from 'geojson';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    title = 'geostrat';
    statesData: GeoJSON = {} as GeoJSON;

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        const map = new Map('map').setView([37.8, -96], 4);

        const tiles = new TileLayer(
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                maxZoom: 19,
                attribution:
                    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }
        ).addTo(map);

        this.http
            .get<GeoJSON>('assets/us-states.json')
            .subscribe((statesData: GeoJSON) => {
                this.statesData = statesData;
                new GeoJson(this.statesData).addTo(map);
                const getColor = (d: number) => {
                    return d > 1000
                        ? '#800026'
                        : d > 500
                        ? '#BD0026'
                        : d > 200
                        ? '#E31A1C'
                        : d > 100
                        ? '#FC4E2A'
                        : d > 50
                        ? '#FD8D3C'
                        : d > 20
                        ? '#FEB24C'
                        : d > 10
                        ? '#FED976'
                        : '#FFEDA0';
                };

                const style = (feature: any) => {
                    return {
                        fillColor: getColor(feature.properties.density),
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.7,
                    };
                };

                new GeoJson(this.statesData, { style: style }).addTo(map);

                const info: Control | any = new Control();

                const highlightFeature = (e: { target: any }) => {
                    var layer = e.target;

                    layer.setStyle({
                        weight: 5,
                        color: '#666',
                        dashArray: '',
                        fillOpacity: 0.7,
                    });

                    layer.bringToFront();
                    info.update(layer.feature.properties);
                };

                const resetHighlight = (e: { target: any }) => {
                    geojson.resetStyle(e.target);
                    info.update();
                };

                const zoomToFeature = (e: {
                    target: { getBounds: () => L.LatLngBoundsExpression };
                }) => {
                    map.fitBounds(e.target.getBounds());
                };

                var geojson: L.GeoJSON<any>;

                const onEachFeature = (
                    feature: any,
                    layer: {
                        on: (arg0: {
                            mouseover: { (e: any): void; (e: any): void };
                            mouseout: { (e: any): void; (e: any): void };
                            click: (e: any) => void;
                        }) => void;
                    }
                ) => {
                    layer.on({
                        mouseover: (e) => highlightFeature(e),
                        mouseout: (e) => resetHighlight(e),
                        click: (e) => zoomToFeature(e),
                    });
                };

                geojson = L.geoJson(this.statesData, {
                    style: style,
                    onEachFeature: onEachFeature,
                }).addTo(map);

                info.onAdd = function (map: any) {
                    this._div = DomUtil.create('div', 'info'); // create a div with a class "info"
                    this.update();
                    return this._div;
                };

                // method that we will use to update the control based on feature properties passed
                info.update = function (props: {
                    name: string;
                    density: string;
                }) {
                    this._div.innerHTML =
                        '<h4>US Population Density</h4>' +
                        (props
                            ? '<b>' +
                              props.name +
                              '</b><br />' +
                              props.density +
                              ' people / mi<sup>2</sup>'
                            : 'Hover over a state');
                };

                info.addTo(map);

                var legend = new Control({ position: 'bottomright' });

                legend.onAdd = function (map: any) {
                    var div = DomUtil.create('div', 'info legend'),
                        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
                        labels = [];

                    // loop through our density intervals and generate a label with a colored square for each interval
                    for (var i = 0; i < grades.length; i++) {
                        div.innerHTML +=
                            '<i style="background:' +
                            getColor(grades[i] + 1) +
                            '"></i> ' +
                            grades[i] +
                            (grades[i + 1]
                                ? '&ndash;' + grades[i + 1] + '<br>'
                                : '+');
                    }

                    return div;
                };

                legend.addTo(map);
            });
    }
}
