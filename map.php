<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="content-type" content="text/html;charset=UTF-8" />
        <title>Kaart van Freeks Realm</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css" integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ==" crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.6.0/dist/leaflet.js" integrity="sha512-gZwIG9x3wUXg2hdXF6+rVkLF/0Vi9U8D2Ntg4Ga5I5BZpVkVxlJWbSQtXPSiUTtC0TjtGOmxa1AJPuV0CPthew==" crossorigin=""></script>
        <script src="useful.js"></script>
        <script src="planner.js"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
        <link rel="icon" type="image/ico" href="favicon.ico" />
        <style>
            html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
            }
            #map {
                width: 100%;
                height: 100%;
                background-color: #000000;
            }
            .map-icon {
                background: red;
            }
            .leaflet-control-input {
                display: inline-block;
                vertical-align: middle;
                border: none;
                border-bottom-right-radius: 0px !important;
                border-top-right-radius: 0px !important;
                border-top-left-radius: 4px !important;
                border-bottom-left-radius: 4px !important;

                height: 26px;
                max-width: 220px;
                padding: 0px 0px 0px 6px;
                line-height: 26px;
                text-align: left;
                color: black;
                background-color: #fff;
                outline: none;
                -webkit-tap-highlight-color: rgba(51, 181, 229, 0.4);
            }
            .leaflet-control-input:hover, .leaflet-control-input:hover + a {
                background-color: #f4f4f4;
            }
            .leaflet-touch .leaflet-control-input {
                height: 30px;
            }
            .leaflet-control-search {
                display: inline-block !important;
                vertical-align: middle;
                border-bottom-right-radius: 4px !important;
                border-top-right-radius: 4px !important;
                border-top-left-radius: 0px !important;
                border-bottom-left-radius: 0px !important;
            }
        </style>
        <script>
            // SEARCH FROM Q PARAMETER (SEE BOTTOM OF CODE)
            var q = getParameterByName("q");
            
            var leafletRedMarkerIcon = new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            
            function getCookie(name, defaultValue) {
                var re = new RegExp(name + "=([^;]+)");
                var value = re.exec(document.cookie);
                return (value != null) ? unescape(value[1]) : defaultValue;
            }

            function setCookie(name, value) {
                document.cookie = name + " = " + value + "; expires=Mon, 14 Sep 2025 18:49:22 GMT; path=/";
            }

            function popupCenter(url, title, w, h) {
                // Fixes dual-screen position                             Most browsers      Firefox
                const dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
                const dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;

                const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
                const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

                const systemZoom = width / window.screen.availWidth;
                const left = (width - w) / 2 / systemZoom + dualScreenLeft
                const top = (height - h) / 2 / systemZoom + dualScreenTop
                const newWindow = window.open(url, title, 
                `
                    scrollbars=yes,
                    width=${w / systemZoom}, 
                    height=${h / systemZoom}, 
                    top=${top}, 
                    left=${left}
                `
                )

                if (window.focus) newWindow.focus();
            }

            function calcRoute(event) {
                event.preventDefault();
                // window.open(event.target.href, 'targetWindow', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=420,height=700');
                popupCenter(event.target.href, "Reisplanner", 420, 750);
                return true;
            }

            function getIconBG(iconType) {
                switch (iconType) {
                    case "station":
                        return "icons/station_bg.png";
                    case "bank":
                        return "icons/bank_bg.png";
                    case "shop":
                        return "icons/shop_bg.png";
                    case "home":
                        return "icons/shadow.png";
                    default:
                        return "icons/other_bg.png";
                }
            }

            var searchMarkers = null;
            var searchRequest = null;
            function mapSearch(event) {
                if (event != null) {
                    event.stopPropagation();
                }
                var q = document.getElementById("search-input").value.trim();

                if (searchRequest != null) {
                    searchRequest.abort();
                    searchRequest = null;
                }

                if (q != "") {
                    theMap.removeLayer(poiMarkers);
                    if (searchMarkers != null) {
                        theMap.removeLayer(searchMarkers);
                        searchMarkers = null;
                    }

                    searchRequest = new XMLHttpRequest();
                    searchRequest.addEventListener("load", function(event) {
                        var results = JSON.parse(this.responseText);
                        console.log(results);

                        var futureSearchMarkers = [];
                        if (results["data"].length > 0) {
                            for (var i = 0; i < results["data"].length; i++) {
                                var tempLatLng = L.CRS.mc.pointToLatLng(L.point(results["data"][i].coords[0], results["data"][i].coords[2]), 16);
                                var tempMarker = L.marker(tempLatLng, {
                                    icon: leafletRedMarkerIcon,
                                    keyboard: true,
                                    id: results["data"][i].id,
                                    title: results["data"][i].name + (results["data"][i].location != null ? ", " + results["data"][i].location : ""),
                                    alt: "V",
                                    zIndexOffset: 1000
                                });
                                var popupText = '<big><b>'+results["data"][i].name+'</b></big><br>'+planner.getItemIconAndName(results["data"][i]["type"])[1]+'<br>';
                                if (results["data"][i].location != null) {
                                    popupText += '<i>'+results["data"][i].location+' <small>('+results["data"][i].coords.join(', ')+')</small></i><br>';
                                }
                                else {
                                    popupText += '<i>'+results["data"][i].coords.join(', ')+'</i><br>';
                                }
                                popupText += '<br><a onclick="calcRoute(event)" target="_blank" href="https://freekb.es/routeplanner/?t=' + results["data"][i].id + '">Routebeschrijving >></a>';
                                tempMarker.bindPopup(popupText);
                                futureSearchMarkers.push(tempMarker);
                            }

                            searchMarkers = L.featureGroup(futureSearchMarkers);
                            theMap.addLayer(searchMarkers);

                            theMap.fitBounds(searchMarkers.getBounds().pad(0.05), {
                                maxZoom: 18
                            });
                            /*
                            if (!theMap.getBounds().intersects(searchMarkers.getBounds())) {
                                
                            }
                            */
                        }
                        else {
                            alert("Geen resultaten gevonden.");
                        }
                    });
                    searchRequest.open('GET', 'api/autocomplete.php?i='+encodeURIComponent(q));
                    searchRequest.send();
                }
                else {
                    theMap.removeLayer(searchMarkers);
                    searchMarkers = L.layerGroup([]);
                    theMap.addLayer(poiMarkers);
                }
            }
        </script>
    </head>
    <body>
        <div id="map"></div>
        <script>
            L.CRS.mc = L.extend({}, L.CRS.Simple, {
                projection: L.Projection.LonLat,
                transformation: new L.Transformation(0.0625, 0, 0.0625, 0),

                scale: function(zoom) {
                    return Math.pow(2, zoom);
                },

                zoom: function(scale) {
                    return Math.log(scale) / Math.LN2;
                },

                distance: function(latlng1, latlng2) {
                    var dx = latlng2.lng - latlng1.lng;
                    var dy = latlng2.lat - latlng1.lat;

                    return Math.sqrt(dx * dx + dy * dy);
                },

                infinite: true
            });

            L.TileLayer.MinecraftLayer = L.TileLayer.extend({
                getTileUrl: function(coords) {
                    return L.TileLayer.prototype.getTileUrl.call(this, coords);
                }
            });

            L.TileLayer.minecraftLayer = function(templateUrl, options) {
                return new L.TileLayer.MinecraftLayer(templateUrl, options);
            }

            
            var theMap = L.map('map', {
                crs: L.CRS.mc,
                center: [0, 0],
                zoom: 15
            });

            L.TileLayer.minecraftLayer('papyrus/{id}/{z}/{x}/{y}.png', {
                attribution: 'Map generated by <a href="https://github.com/mjungnickel18/papyruscs" target="_blank">PapyrusCS</a>',
                maxNativeZoom: 20,
                minNativeZoom: 11,
                tms: false,
                maxZoom: 22,
                minZoom: 11,
                id: 'dim0',
                tileSize: 512,
                noWrap: true,
                defaultRadius: 1,
                zIndex: 1
            }).addTo(theMap);

            L.Control.Search = L.Control.extend({
                onAdd: function(map) {
                    var searchDiv = L.DomUtil.create('div');
                    searchDiv.setAttribute("class", "leaflet-control leaflet-bar");
                    L.DomEvent.disableClickPropagation(searchDiv);
                    L.DomEvent.disableScrollPropagation(searchDiv);

                    var searchBar = L.DomUtil.create('input');
                    searchBar.setAttribute("id", "search-input");
                    searchBar.setAttribute("class", "leaflet-control-input");
                    searchBar.setAttribute("type", "text");
                    searchBar.setAttribute("placeholder", "Zoeken");
                    searchBar.addEventListener("keyup", function(event) {
                        event.stopPropagation();
                        if (event.keyCode === 13) {
                            mapSearch(event);
                        }
                    });

                    
                    var searchBtn = L.DomUtil.create('a');
                    searchBtn.setAttribute("class", "leaflet-control-search");
                    searchBtn.setAttribute("href", "#");
                    searchBtn.setAttribute("title", "Search");
                    searchBtn.setAttribute("aria-label", "Search");
                    searchBtn.setAttribute("role", "button");
                    searchBtn.setAttribute("style", "font-family: monospace;");
                    searchBtn.innerHTML = "&#x1F50E;&#xFE0E;";
                    searchBtn.addEventListener("click", mapSearch);

                    searchDiv.appendChild(searchBar);
                    searchDiv.appendChild(searchBtn);

                    return searchDiv;
                },
                
                onRemove: function(map) {
                    // Nothing to do here
                }
            });

            L.control.search = function(opts) {
                return new L.Control.Search(opts);
            }

            L.control.search({ position: 'topright' }).addTo(theMap);

            var poiMarkers = null;
            var dataRequest = new XMLHttpRequest();
            dataRequest.addEventListener("load", function() {
                var data = JSON.parse(this.responseText);
                console.log(data);

                var futurePoiMarkers = [];
                var stationIcon = L.icon({
                    iconUrl: "icons/station.png",
                    iconSize: 16,
                    shadowUrl: getIconBG("station"),
                    shadowSize: 18
                });
                for (var i = 0; i < data.stations.length; i++) {
                    var tempLatLng = L.CRS.mc.pointToLatLng(L.point(data.stations[i].coords[0], data.stations[i].coords[2]), 16);
                    var tempMarker = L.marker(tempLatLng, {
                        icon: stationIcon,
                        keyboard: true,
                        id: data.stations[i].id,
                        title: data.stations[i].name,
                        alt: "Station",
                        riseOnHover: true,
                        zIndexOffset: 100
                    });
                    var popupText = '<big><b>'+data.stations[i].name+'</b></big><br>Station<br>';
                    if (data.stations[i].location != null) {
                        popupText += '<i>'+data.stations[i].location+' <small>('+data.stations[i].coords.join(', ')+')</small></i><br>';
                    }
                    else {
                        popupText += '<i>'+data.stations[i].coords.join(', ')+'</i><br>';
                    }
                    popupText += '<br><a onclick="calcRoute(event)" target="_blank" href="https://freekb.es/routeplanner/?t=' + data.stations[i].id + '">Routebeschrijving >></a>';
                    tempMarker.bindPopup(popupText);
                    // tempMarker.addTo(theMap);
                    futurePoiMarkers.push(tempMarker);
                }
                
                for (var i = 0; i < data.pois.length; i++) {
                    if (data.pois[i]["type"] == "home") {
                        continue;
                    }
                    var itemIconAndName = planner.getItemIconAndName(data.pois[i]["type"]);
                    var poiIcon = L.icon({
                        iconUrl: itemIconAndName[0],
                        iconSize: 14,
                        shadowUrl: getIconBG(data.pois[i]["type"]),
                        shadowSize: 18
                    });
                    var tempLatLng = L.CRS.mc.pointToLatLng(L.point(data.pois[i].coords[0], data.pois[i].coords[2]), 16);
                    var tempMarker = L.marker(tempLatLng, {
                        icon: poiIcon,
                        keyboard: false,
                        id: data.pois[i].id,
                        title: data.pois[i].name,
                        alt: "POI",
                        riseOnHover: true
                    });
                    var popupText = '<big><b>'+data.pois[i].name+'</b></big><br>'+itemIconAndName[1]+'<br>';
                    if (data.pois[i].location != null) {
                        popupText += '<i>'+data.pois[i].location+' <small>('+data.pois[i].coords.join(', ')+')</small></i><br>';
                    }
                    else {
                        popupText += '<i>'+data.pois[i].coords.join(', ')+'</i><br>';
                    }
                    popupText += '<br><a onclick="calcRoute(event)" target="_blank" href="https://freekb.es/routeplanner/?t=' + data.pois[i].id + '">Routebeschrijving >></a>';
                    tempMarker.bindPopup(popupText);
                    // tempMarker.addTo(theMap);
                    futurePoiMarkers.push(tempMarker);
                }

                poiMarkers = L.layerGroup(futurePoiMarkers);
                poiMarkers.addTo(theMap);
            });
            dataRequest.open("GET", "data.json?nc="+Math.random());
            dataRequest.send();

            theMap.on('click', function(e) {
                console.log(L.CRS.mc.latLngToPoint(e.latlng, 16));
            });

            function updateCookiesAndUrl(event) {
                var center = L.CRS.mc.latLngToPoint(theMap.getCenter(), 16);
                setCookie("z", theMap.getZoom());
                setCookie("cx", center.x);
                setCookie("cy", center.y);
                window.location.hash = "#"+theMap.getZoom()+"/"+center.x+"/"+center.y+"?q="+encodeURIComponent(document.getElementById("search-input").value);
            }

            theMap.on('zoomend', updateCookiesAndUrl);

            theMap.on('moveend', updateCookiesAndUrl);

            // SEARCH FOR Q PARAMETER
            if (typeof q === "string") {
                document.getElementById("search-input").value = q;
                setTimeout(function() {
                    mapSearch();
                }, 500);
            }
            else {
                // RESTORE POSITION
                var cookieCenter = [parseInt(getCookie("cx")), parseInt(getCookie("cy"))];
                var cookieZoom = parseInt(getCookie("z"));
                if (window.location.hash != "" && window.location.hash != null) {
                    var parsedHash = window.location.hash.substr(1).split("/");
                    if (parsedHash.length == 3) {
                        cookieCenter = [parseInt(parsedHash[1]), parseInt(parsedHash[2])];
                        cookieZoom = parseInt(parsedHash[0]);
                    }
                }

                if (!isNaN(cookieCenter[0]) && !isNaN(cookieCenter[1]) && !isNaN(cookieZoom)) {
                    theMap.setView(L.CRS.mc.pointToLatLng(L.point(cookieCenter[0], cookieCenter[1]), 16), cookieZoom);
                }
            }
        </script>
    </body>
</html>