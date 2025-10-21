// Import stylesheets
//import './style.css';

//require('leaflet');
//require('leaflet-overpass-layer');

var attr_osm = 'Map data &copy; <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors';
var attr_overpass = 'POI via <a href="http://www.overpass-api.de/">Overpass API</a>';

var osm = new L.TileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        'opacity': 0.7,
        'attribution': [attr_osm, attr_overpass].join(', ')
    }
);

var map = new L.Map('map')
.addLayer(osm)
.setView(new L.LatLng(55.7, -2.16), 6);

var hash = new L.Hash(map);

var icon = new L.Icon.Default();

var opl = new L.OverPassLayer({
    'query': '(node[~"^addr:.*$"~"."]({{bbox}});way[~"^addr:.*$"~"."]({{bbox}});relation[~"^addr:.*$"~"."]({{bbox}}););out center;',
    markerIcon: icon,
});

map.addLayer(opl);
