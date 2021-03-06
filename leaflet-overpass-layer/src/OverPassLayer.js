import L from 'leaflet';
import ClipperLib from 'js-clipper';
import './OverPassLayer.css';
import './MinZoomIndicator';

const OverPassLayer = L.FeatureGroup.extend({
  options: {
    debug: false,
    minZoom: 17,
    endPoint: 'https://overpass-api.de/api/',
    query: '(node({{bbox}})[organic];node({{bbox}})[second_hand];);out qt;',
    loadedBounds: [],
    markerIcon: null,
    timeout: 30 * 1000, // Milliseconds
    retryOnTimeout: false,
    noInitialRequest: false,

    beforeRequest() {},

    afterRequest() {},

    onSuccess(data) {
      for (let i = 0; i < data.elements.length; i++) {
        let pos;
        let marker;
        const e = data.elements[i];

        if (e.id in this._ids) {
          continue;
        }

        this._ids[e.id] = true;

        if (e.type === 'node') {
          pos = L.latLng(e.lat, e.lon);
        } else {
          pos = L.latLng(e.center.lat, e.center.lon);
        }

        if (this.options.markerIcon) {
          marker = L.marker(pos, { icon: this.options.markerIcon });
        } else {
          marker = L.circle(pos, 20, {
            stroke: false,
            fillColor: '#E54041',
            fillOpacity: 0.9
          });
        }

        const popupContent = this._getPoiPopupHTML(e.tags, e.id);
        const popup = L.popup().setContent(popupContent);
        marker.bindPopup(popup);

        this._markers.addLayer(marker);
      }
    },

    onError() {},

    onTimeout() {},

    minZoomIndicatorEnabled: true,
    minZoomIndicatorOptions: {
      minZoomMessageNoLayer: 'No layer assigned',
      minZoomMessage:
        'Current zoom Level: CURRENTZOOM. Data are visible at Level: MINZOOMLEVEL.'
    }
  },

  initialize(options) {
    L.Util.setOptions(this, options);

    this._ids = {};
    this._loadedBounds = options.loadedBounds || [];
    this._requestInProgress = false;
  },

  _getPoiPopupHTML(tags, id) {
    let row;
    //const link = document.createElement('a');
    const intro = document.createElement('into');
    const table = document.createElement('table');
    const tr = document.createElement("TR");
    const th = document.createElement("TH");
    const div = document.createElement('div');

    //link.href = `https://www.openstreetmap.org/edit?editor=id&node=${id}`;
    //link.appendChild(document.createTextNode('Edit this entry in iD'));
    
    intro.innerHTML = 'Here is the address as it would appear on an envelope using the <a href="https://wiki.openstreetmap.org/wiki/Addresses_in_the_United_Kingdom#Tags_to_envelope">strict method</a> designed to highlight addr:* tag issues in OpenStreetMap:';

    table.align = 'center';
    table.style.border = "1px solid";
    table.style.borderColor = "#f1d592";
    table.style.borderWidth = '5px 5px 30px 20px';
    table.style.borderSpacing = '5px';
    table.style.borderCollapse = 'separate';
    table.style.whiteSpace = 'nowrap';
    table.style.backgroundColor = "#f1d592";
    table.style.borderRadius = "2px";
    table.style.boxShadow = "0 2px 5px 0px rgba(0,0,0,.6)";
    
    th.style.borderWidth = "2px";
    th.style.borderStyle = "dashed";
    th.style.textAlign = "center";
    th.appendChild(document.createTextNode("affix"));
    th.appendChild(document.createElement("br"));
    th.appendChild(document.createTextNode("stamp"));
    th.appendChild(document.createElement("br"));
    th.appendChild(document.createTextNode("here"));
    
    row = table.insertRow(0);
    row.insertCell(0).appendChild(document.createTextNode(""));
    row.insertCell(1).appendChild(th);

    //Declare variables
    let addrunit;
    let addrname;
    let addrnumber;
    let addrplace;
    let addrstreet;
    let addrparent;
    let addrsuburb;
    let addrcity = "[TOWN/CITY]";
    let addrpostcode = "[Postcode]";

    //Read data into the variables
    for (const key in tags) {
        if (key == "addr:unit") {
          addrunit = tags[key];
        } 
        else if (key == "addr:housename") {
          addrname = tags[key];
        } 
        else if (key == "addr:housenumber") {
          addrnumber = tags[key];
        }   
        else if (key == "addr:place") {
          addrplace = tags[key];
        }
        else if (key == "addr:substreet") {
          addrsubstreet = tags[key];
        }   
        else if (key == "addr:street") {
          addrstreet = tags[key];
        } 
        else if (key == "addr:parentstreet") {
          addrparent = tags[key];
        }
        else if (key == "addr:suburb") {
          addrsuburb = tags[key];
        }
        else if (key == "addr:city") {
          addrcity = tags[key].toUpperCase();
        }
        else if (key == "addr:postcode") {
          addrpostcode = tags[key];
        }  
        else {
        }
    }
    //Pre-processing steps
    if (typeof addrplace !== 'undefined' && addrplace !== addrsubstreet) {
          if (typeof addrsubstreet !== 'undefined') {
            addrsubstreet = addrplace + ' ' + addrsubstreet;
          }
          else {
            addrsubstreet = addrplace;
          }
        }
    
    //Write the address line
        // addressline1
        if (typeof addrunit !== 'undefined' || typeof addrname !== 'undefined') {
          row = table.insertRow(-1);
          if (typeof addrunit !== 'undefined' && typeof addrname !== 'undefined') {
            row.insertCell(0).appendChild(document.createTextNode(addrunit + ' ' + addrname + ','));
          }
          else if (typeof addrname !== 'undefined') {
            row.insertCell(0).appendChild(document.createTextNode(addrname + ','));
          }
          else {
            row.insertCell(0).appendChild(document.createTextNode(addrunit + ','));
          }
        }
  	// addressline2
        if (typeof addrsubstreet !== 'undefined') {
          row = table.insertRow(-1);
          if (typeof addrnumber !== 'undefined') {
            row.insertCell(0).appendChild(document.createTextNode(addrnumber + ' ' + addrsubstreet + ','));
          }
          else {
            row.insertCell(0).appendChild(document.createTextNode(addrsubstreet + ','));
          }
        }
        else if (typeof addrstreet !== 'undefined') {
          row = table.insertRow(-1);
          if (typeof addrnumber !== 'undefined') {
            row.insertCell(0).appendChild(document.createTextNode(addrnumber + ' ' + addrstreet + ','));
          }
          else {
            row.insertCell(0).appendChild(document.createTextNode(addrstreet + ','));
          }
        }
        else {
        }
        // addressline3
        /*
        if (typeof addrsubstreet !== 'undefined') {
          if (typeof addrstreet !== 'undefined') {
            row = table.insertRow(-1);
            row.insertCell(0).appendChild(document.createTextNode(addrstreet + ','));
          }
          else {
          }
        }
        else {
        }
        */
        // addressline4
        if (typeof addrparent !== 'undefined') {
          row = table.insertRow(-1);
          row.insertCell(0).appendChild(document.createTextNode(addrparent + ','));
        }
        else {
        }
        // addressline5
        if (typeof addrsuburb !== 'undefined') {
          row = table.insertRow(-1);
          row.insertCell(0).appendChild(document.createTextNode(addrsuburb + ','));
        }
        else {
        }
        // addressline6
        row = table.insertRow(-1);
        row.insertCell(0).appendChild(document.createTextNode(addrcity));
        // addressline7
        row = table.insertRow(-1);
        row.insertCell(0).appendChild(document.createTextNode(addrpostcode));

    //div.appendChild(link);  
    div.appendChild(intro);
    div.appendChild(table);
    div.appendChild(document.createTextNode('The commas and any parts in [square brackets] have been added in post processing outside of OSM.'));
    

    return div;
  },

  _buildRequestBox(bounds) {
    return L.rectangle(bounds, {
      bounds: bounds,
      color: '#204a87',
      stroke: false,
      fillOpacity: 0.1,
      clickable: false
    });
  },

  _addRequestBox(box) {
    return this._requestBoxes.addLayer(box);
  },

  _getRequestBoxes() {
    return this._requestBoxes.getLayers();
  },

  _removeRequestBox(box) {
    this._requestBoxes.removeLayer(box);
  },

  _removeRequestBoxes() {
    return this._requestBoxes.clearLayers();
  },

  _addResponseBox(box) {
    return this._responseBoxes.addLayer(box);
  },

  _addResponseBoxes(requestBoxes) {
    this._removeRequestBoxes();

    requestBoxes.forEach(box => {
      box.setStyle({
        color: 'black',
        weight: 2
      });
      this._addResponseBox(box);
    });
  },

  _isFullyLoadedBounds(bounds, loadedBounds) {
    if (loadedBounds.length === 0) {
      return false;
    }

    const subjectClips = this._buildClipsFromBounds([bounds]);
    const knownClips = this._buildClipsFromBounds(loadedBounds);
    const clipper = new ClipperLib.Clipper();
    const solutionPolyTree = new ClipperLib.PolyTree();

    clipper.AddPaths(subjectClips, ClipperLib.PolyType.ptSubject, true);
    clipper.AddPaths(knownClips, ClipperLib.PolyType.ptClip, true);

    clipper.Execute(
      ClipperLib.ClipType.ctDifference,
      solutionPolyTree,
      ClipperLib.PolyFillType.pftNonZero,
      ClipperLib.PolyFillType.pftNonZero
    );

    const solutionExPolygons = ClipperLib.JS.PolyTreeToExPolygons(
      solutionPolyTree
    );

    if (solutionExPolygons.length === 0) {
      return true;
    } else {
      return false;
    }
  },

  _getLoadedBounds() {
    return this._loadedBounds;
  },

  _addLoadedBounds(bounds) {
    this._loadedBounds.push(bounds);
  },

  _buildClipsFromBounds(bounds) {
    return bounds.map(bound => [
      {
        X: bound._southWest.lng * 1000000,
        Y: bound._southWest.lat * 1000000
      },
      {
        X: bound._southWest.lng * 1000000,
        Y: bound._northEast.lat * 1000000
      },
      {
        X: bound._northEast.lng * 1000000,
        Y: bound._northEast.lat * 1000000
      },
      {
        X: bound._northEast.lng * 1000000,
        Y: bound._southWest.lat * 1000000
      }
    ]);
  },

  _buildBoundsFromClips(clips) {
    return clips.map(clip =>
      L.latLngBounds(
        L.latLng(clip[0].Y / 1000000, clip[0].X / 1000000).wrap(),
        L.latLng(clip[2].Y / 1000000, clip[2].X / 1000000).wrap()
      )
    );
  },

  _buildOverpassQueryFromQueryAndBounds(query, bounds) {
    const sw = bounds._southWest;
    const ne = bounds._northEast;
    const coordinates = [sw.lat, sw.lng, ne.lat, ne.lng].join(',');

    query = query.replace(/(\/\/.*)/g, '');
    query = query.replace(/(\{\{bbox\}\})/g, coordinates);

    return query;
  },

  _buildOverpassUrlFromEndPointAndQuery(endPoint, query) {
    return `${endPoint}interpreter?data=[out:json];${query}`;
  },

  _buildLargerBounds(bounds) {
    const width = Math.abs(bounds._northEast.lng - bounds._southWest.lng);
    const height = Math.abs(bounds._northEast.lat - bounds._southWest.lat);
    const biggestDimension = width > height ? width : height;

    bounds._southWest.lat -= biggestDimension / 2;
    bounds._southWest.lng -= biggestDimension / 2;
    bounds._northEast.lat += biggestDimension / 2;
    bounds._northEast.lng += biggestDimension / 2;

    return L.latLngBounds(
      L.latLng(bounds._southWest.lat, bounds._southWest.lng).wrap(),
      L.latLng(bounds._northEast.lat, bounds._northEast.lng).wrap()
    );
  },

  _setRequestInProgress(isInProgress) {
    this._requestInProgress = isInProgress;
  },

  _isRequestInProgress() {
    return this._requestInProgress;
  },

  _hasNextRequest() {
    if (this._nextRequest) {
      return true;
    }

    return false;
  },

  _getNextRequest() {
    return this._nextRequest;
  },

  _setNextRequest(nextRequest) {
    this._nextRequest = nextRequest;
  },

  _removeNextRequest() {
    this._nextRequest = null;
  },

  _prepareRequest() {
    if (this._map.getZoom() < this.options.minZoom) {
      return false;
    }

    const bounds = this._buildLargerBounds(this._map.getBounds());
    const nextRequest = this._sendRequest.bind(this, bounds);

    if (this._isRequestInProgress()) {
      this._setNextRequest(nextRequest);
    } else {
      this._removeNextRequest();
      nextRequest();
    }
  },

  _sendRequest(bounds) {
    const loadedBounds = this._getLoadedBounds();

    if (this._isFullyLoadedBounds(bounds, loadedBounds)) {
      this._setRequestInProgress(false);
      return;
    }

    const requestBounds = this._buildLargerBounds(bounds);
    const url = this._buildOverpassUrlFromEndPointAndQuery(
      this.options.endPoint,
      this._buildOverpassQueryFromQueryAndBounds(
        this.options.query,
        requestBounds
      )
    );
    const request = new XMLHttpRequest();
    const beforeRequestResult = this.options.beforeRequest.call(this);

    if (beforeRequestResult === false) {
      this.options.afterRequest.call(this);

      return;
    }

    this._setRequestInProgress(true);

    if (this.options.debug) {
      this._addRequestBox(this._buildRequestBox(requestBounds));
    }

    request.open('GET', url, true);
    request.timeout = this.options.timeout;

    request.ontimeout = () =>
      this._onRequestTimeout(request, url, requestBounds);
    request.onload = () => this._onRequestLoad(request, requestBounds);

    request.send();
  },

  _onRequestLoad(xhr, bounds) {
    if (xhr.status >= 200 && xhr.status < 400) {
      this.options.onSuccess.call(this, JSON.parse(xhr.response));

      this._onRequestLoadCallback(bounds);
    } else {
      this._onRequestErrorCallback(bounds);

      this.options.onError.call(this, xhr);
    }

    this._onRequestCompleteCallback(bounds);
  },

  _onRequestTimeout(xhr, url, bounds) {
    this.options.onTimeout.call(this, xhr);

    if (this.options.retryOnTimeout) {
      this._sendRequest(url);
    } else {
      this._onRequestErrorCallback(bounds);
      this._onRequestCompleteCallback(bounds);
    }
  },

  _onRequestLoadCallback(bounds) {
    this._addLoadedBounds(bounds);

    if (this.options.debug) {
      this._addResponseBoxes(this._getRequestBoxes());
    }
  },

  _onRequestErrorCallback(bounds) {
    if (this.options.debug) {
      this._removeRequestBox(this._buildRequestBox(bounds));
    }
  },

  _onRequestCompleteCallback() {
    this.options.afterRequest.call(this);

    if (this._hasNextRequest()) {
      const nextRequest = this._getNextRequest();

      this._removeNextRequest();

      nextRequest();
    } else {
      this._setRequestInProgress(false);
    }
  },

  onAdd(map) {
    this._map = map;

    if (this.options.minZoomIndicatorEnabled === true) {
      if (this._map.zoomIndicator) {
        this._zoomControl = this._map.zoomIndicator;
        this._zoomControl._addLayer(this);
      } else {
        this._zoomControl = new L.Control.MinZoomIndicator(
          this.options.minZoomIndicatorOptions
        );

        this._map.addControl(this._zoomControl);

        this._zoomControl._addLayer(this);
      }
    }

    if (this.options.debug) {
      this._requestBoxes = L.featureGroup().addTo(this._map);
      this._responseBoxes = L.featureGroup().addTo(this._map);
    }

    this._markers = L.featureGroup().addTo(this._map);

    if (!this.options.noInitialRequest) {
      this._prepareRequest();
    }

    this._map.on('moveend', this._prepareRequest, this);
  },

  onRemove(map) {
    L.LayerGroup.prototype.onRemove.call(this, map);

    if (this.options.minZoomIndicatorEnabled === true) {
      if (this._map.zoomIndicator) {
        this._zoomControl._removeLayer(this);
        this._map.removeControl(this._zoomControl);
        this._zoomControl = null;

        this._map.zoomIndicator = null;
      }
    }

    if (this.options.debug) {
      this._map.removeLayer(this._requestBoxes);
      this._map.removeLayer(this._responseBoxes);
    }

    this._resetData();

    this._map.removeLayer(this._markers);

    this._map.off('moveend', this._prepareRequest, this);
  },

  setQuery(query) {
    this.options.query = query;
    this._resetData();
    this._prepareRequest();
  },

  _resetData() {
    this._ids = {};
    this._loadedBounds = [];
    this._requestInProgress = false;

    this._markers.clearLayers();

    if (this.options.debug) {
      this._requestBoxes.clearLayers();
      this._responseBoxes.clearLayers();
    }
  },

  getData() {
    return this._data;
  }
});

L.OverPassLayer = OverPassLayer;
L.overpassLayer = options => new L.OverPassLayer(options);

export default OverPassLayer;
