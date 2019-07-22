var planner = {
    data: {},
    graph: {},
    from: null,
    to: null,
    currentFocus: -1,

    init: function() {
        $.getJSON( "data.json", {noCache: Math.random()} )
            .done(function(json) {
                console.log("Data.json fetched");
                json.stations = json.stations.sort(compareNames);
                json.locations = json.locations.sort(compareNames);
                json.pois = json.pois.sort(compareNames);
                planner.data = json;
                planner.graph = {};
                console.log(planner.data);

                for (i = 0; i < planner.data.routes.length; i++) {
                    var lastHalt = null;
                    for (j = 0; j < planner.data.routes[i].halts.length; j++) {
                        if (j > 0) {
                            var thisHalt = planner.data.routes[i].halts[j];
                            
                            if (typeof planner.graph[lastHalt.halt] == "undefined") {
                                planner.graph[lastHalt.halt] = [];
                            }
                            planner.graph[lastHalt.halt][thisHalt.halt] = {
                                to: thisHalt.halt,
                                line: planner.data.routes[i].line_name,
                                platform: lastHalt.platform_forth,
                                duration: lastHalt.time_forth,
                                warnings: lastHalt.warnings_forth
                            };

                            if (typeof planner.graph[thisHalt.halt] == "undefined") {
                                planner.graph[thisHalt.halt] = [];
                            }
                            planner.graph[thisHalt.halt][lastHalt.halt] = {
                                to: lastHalt.halt,
                                line: planner.data.routes[i].line_name,
                                platform: thisHalt.platform_back,
                                duration: thisHalt.time_back,
                                warnings: thisHalt.warnings_back
                            };
                        }
                        lastHalt = planner.data.routes[i].halts[j];
                    }
                }
                console.log(planner.graph);
            })
            .fail(function() {
                console.error("Could not fetch data.json");
            });

        var autocompletes = document.getElementsByClassName("autocomplete");
        for (i = 0; i < autocompletes.length; i++) {
            autocompletes[i].children[0].addEventListener("input", planner.autocompleteInput);
            autocompletes[i].children[0].addEventListener("keydown", planner.autocompleteKeydown);
        }
        document.getElementById("routeform").addEventListener("submit", planner.plan);
    },

    setFrom: function(newFrom) {
        planner.from = newFrom;
        if (newFrom != null) {
            document.getElementById("from").value = newFrom.name;
            document.getElementById("to").focus();
        }
    },

    setTo: function(newTo) {
        planner.to = newTo;
        if (newTo != null) {
            document.getElementById("to").value = newTo.name;
            document.getElementById("plan").focus();
        }
    },


    removeAutoCompletes: function() {
        planner.currentFocus = -1;
        var current = document.getElementsByClassName("autocomplete-items");
        for (i = 0; i < current.length; i++) {
            current[i].parentNode.removeChild(current[i]);
        }
    },

    addActive: function(x) {
        if (!x) return false;
        planner.removeActive(x);
        if (planner.currentFocus >= x.length) planner.currentFocus = 0;
        if (planner.currentFocus < 0) planner.currentFocus = (x.length - 1);
        x[planner.currentFocus].classList.add("autocomplete-active");
        x[planner.currentFocus].scrollIntoView(false);
    },

    removeActive: function(x) {
        for (i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    },

    autocompleteKeydown: function(event, forWhat) {
        var x = document.getElementById(event.target.getAttribute("id") + "-autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (event.keyCode == 40) {
            // ARROW_DOWN
            event.preventDefault();
            planner.currentFocus++;
            planner.addActive(x);
        }
        else if (event.keyCode == 38) {
            // ARROW_UP
            event.preventDefault();
            planner.currentFocus--;
            planner.addActive(x);
        }
        else if (event.keyCode == 13) {
            // ENTER
            event.preventDefault();
            if (planner.currentFocus > -1) {
                if (x) x[planner.currentFocus].click();
            }
        }
    },

    createItem: function(item) {
        var b = document.createElement('div');
        b.setAttribute("class", "item");
        var bhtml = "";
        switch (item.type) {
            case "station":
                bhtml += '<img src="icons/station.png" alt="Station" />';
                break;
            case "location":
                bhtml += '<img src="icons/location.png" alt="Plaats" />';
                break;
            case "poi":
                switch (item.subtype) {
                    case 'spawn':
                        bhtml += '<img src="icons/place.png" alt="Spawn" />';
                        break;
                    case 'end_portal':
                        bhtml += '<img src="icons/portal.png" alt="End Portal" />';
                        break;
                    case 'nether_portal':
                        bhtml += '<img src="icons/portal.png" alt="Nether Portal" />';
                        break;
                    case 'farm':
                        bhtml += '<img src="icons/farm.png" alt="Farm" />';
                        break;
                    case 'community_building':
                        bhtml += '<img src="icons/bed.png" alt="Communityhuis" />';
                        break;
                    case 'home':
                        bhtml += '<img src="icons/home.png" alt="Huis" />';
                        break;
                    case 'castle':
                        bhtml += '<img src="icons/castle.png" alt="Kasteel" />';
                        break;
                    case 'gate':
                        bhtml += '<img src="icons/gate.png" alt="Poort" />';
                        break;
                    case 'church':
                        bhtml += '<img src="icons/church.png" alt="Kerk" />';
                        break;
                    case 'stable':
                        bhtml += '<img src="icons/parking.png" alt="Paardenstal" />';
                        break;
                    case 'shop':
                        bhtml += '<img src="icons/shop.png" alt="Winkel" />';
                        break; 
                    case 'food':
                        bhtml += '<img src="icons/food.png" alt="Eten" />';
                        break;
                    case 'viewpoint':
                        bhtml += '<img src="icons/viewpoint.png" alt="Uitzichtpunt" />';
                        break;
                    case "terrain":
                        bhtml += '<img src="icons/terrain.png" alt="Landschap" />';
                        break;
                    case "mine":
                        bhtml += '<img src="icons/mine.png" alt="Mijn" />';
                        break;
                    default:
                        bhtml += '<img src="icons/place.png" alt="Overig" />';
                        break;
                }
                break;
            default:
                bhtml += '<img src="icons/place.png" alt="Overig" />';
                break;
        }
        bhtml += '<span class="autocomplete-list-item-details"><span>' + item.name + '</span>';
        bhtml += '<small class="location">';
        switch (item.type) {
            case "station":
                bhtml += 'Station';
                break;
            case "location":
                bhtml += 'Plaats';
                break;
            case "poi":
                switch (item.subtype) {
                    case 'spawn':
                        bhtml += 'Spawn';
                        break;
                    case 'end_portal':
                        bhtml += 'End Portal';
                        break;
                    case 'nether_portal':
                        bhtml += 'Nether Portal';
                        break;
                    case 'farm':
                        bhtml += 'Farm';
                        break;
                    case 'community_building':
                        bhtml += 'Communityhuis';
                        break;
                    case 'castle':
                        bhtml += 'Kasteel';
                        break;
                    case 'home':
                        bhtml += 'Huis';
                        break;
                    case 'gate':
                        bhtml += 'Poort';
                        break;
                    case 'church':
                        bhtml += 'Kerk';
                        break;
                    case 'stable':
                        bhtml += 'Paardenstal';
                        break;
                    case 'shop':
                        bhtml += 'Winkel';
                        break; 
                    case 'food':
                        bhtml += 'Eten';
                        break; 
                    case 'viewpoint':
                        bhtml += 'Uitzichtpunt';
                        break;
                    case "terrain":
                        bhtml += "Landschap";
                        break;
                    case "town_hall":
                        bhtml += "Stadhuis";
                        break;
                    case "mine":
                        bhtml += "Mijn";
                        break;
                    default:
                        bhtml += 'Overig';
                        break;
                }
                break;
            default:
                bhtml += 'Overig';
                break;
        }
        if (item.location != "" && item.location != null && item.location != undefined) {
            bhtml += ' &bull; ';
            bhtml += item.location;
        }
        bhtml += '</small></span>';
        bhtml += '<input type="hidden" value="'+JSON.stringify(item).replace(/"/g, '~')+'" />';
        b.innerHTML = bhtml;
        return b;
    },

    autocompleteInput: function(event, forWhat) {
        planner.removeAutoCompletes();

        if (event.currentTarget.id == "from") {
            planner.setFrom(null);
        }
        else if (event.currentTarget.id == "to") {
            planner.setTo(null);
        }

        var text = event.target.value.trim().toLowerCase();
        var results = [];
        if (text.length > 0) {
            for (i = 0; i < planner.data.stations.length; i++) {
                if (planner.data.stations[i].name.toLowerCase().indexOf(text) > -1 || (planner.data.stations[i].location != null && planner.data.stations[i].location.toLowerCase().indexOf(text) > -1) || (planner.data.stations[i].former_name != null && planner.data.stations[i].former_name.toLowerCase().indexOf(text) > -1)) {
                    var tempData = {
                        type: "station",
                        name: planner.data.stations[i].name,
                        location: planner.data.stations[i].location,
                        halt: planner.data.stations[i].id,
                        coords: planner.data.stations[i].coords
                    };
                    results.push(tempData);
                }
            }
            for (i = 0; i < planner.data.locations.length; i++) {
                if (planner.data.locations[i].has_station_with_same_name == false && planner.data.locations[i].name.toLowerCase().indexOf(text) > -1) {
                    var tempData = {
                        type: "location",
                        name: planner.data.locations[i].name,
                        location: '',
                        halt: planner.data.locations[i].closest_station,
                        coords: planner.data.locations[i].coords
                    };
                    results.push(tempData);
                }
            }
            for (i = 0; i < planner.data.pois.length; i++) {
                if (planner.data.pois[i].name.toLowerCase().indexOf(text) > -1 || (planner.data.pois[i].location != null && planner.data.pois[i].location.toLowerCase().indexOf(text) > -1)) {
                    var tempData = {
                        type: "poi",
                        subtype: planner.data.pois[i].type,
                        name: planner.data.pois[i].name,
                        location: planner.data.pois[i].location,
                        halt: planner.data.pois[i].closest_station,
                        coords: planner.data.pois[i].coords
                    };
                    results.push(tempData);
                }
            }
        }

        if (results.length > 0) {
            var a = document.createElement('div');
            a.setAttribute("id", event.target.getAttribute("id") + "-autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            event.target.parentNode.appendChild(a);

            for (i = 0; i < results.length; i++) {
                b = planner.createItem(results[i]);
                b.addEventListener("click", function(event) {
                    if (event.currentTarget.parentNode.getAttribute("id").split("-")[0] == "from") {
                        planner.setFrom(JSON.parse(event.currentTarget.querySelector('input[type=hidden]').value.replace(/~/g, '"')));
                    }
                    else {
                        planner.setTo(JSON.parse(event.currentTarget.querySelector('input[type=hidden]').value.replace(/~/g, '"')));
                    }
                    planner.removeAutoCompletes();
                });
                a.appendChild(b);
            }
        }
        else {

        }
    },

    insertMapOldest: function(start, end) {
        var mapElem = document.createElement("iframe");
        mapElem.innerHTML = "Maps are not supported by your browser. You'll have to find out where to go by yourself.";
        mapElem.setAttribute("class", "map");
        mapElem.setAttribute("sandbox", "allow-same-origin allow-scripts");
        mapElem.setAttribute("src", "map/?start="+start.join(",")+"&end="+end.join(","));
        return mapElem;
    },

    insertMap: function(start, end, step) {
        return new Promise(function(resolve, reject) {
            var mapElem = document.createElement("img");
            mapElem.setAttribute("class", "map");
            mapElem.setAttribute("title", "Looproute");
            mapElem.addEventListener("load", resolve);
            mapElem.addEventListener("error", reject);
            mapElem.setAttribute("alt", "Looproute kan niet worden weergegeven. Sorry voor het ongemak.");
            mapElem.setAttribute("src", "map.php?start="+start.join(",")+"&end="+end.join(",")+"&size=500");
            mapElem.setAttribute("width", "300");
            mapElem.setAttribute("height", "300");
            step.appendChild(mapElem);
        });
    },

    insertMapOld: function(start, end, step) {
        console.log(start.join(","));
        console.log(end.join(","));
        var mapSource = 'map/map-2019-03-17.png';

        var minWorldX = -6352;
        var maxWorldX = 11440 + 15;
        var minWorldY = -3856;
        var maxWorldY = 5280 + 15;
        var mapWidth  = -minWorldX + maxWorldX;
        var mapHeight = -minWorldY + maxWorldY;

        var mapElem = document.createElement("canvas");
        mapElem.setAttribute("class", "map");
        mapElem.setAttribute("title", "Looproute. LET OP: kaart is van "+mapSource.split("map-")[1].split(".")[0]+".");
        mapElem.setAttribute("alt", "Looproute kan niet worden weergegeven.");
        mapElem.innerHTML = "De browser die je momenteel gebruikt ondersteunt geen kaarten.";
        var outputWidth = document.getElementById("output").clientWidth;
        if (outputWidth >= 304) {
            mapElem.width = 300;
        }
        else {
            mapElem.width = outputWidth - 4;
        }
        mapElem.height = mapElem.width;
        var ctx = mapElem.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        step.appendChild(mapElem);

        return new Promise(
            function(resolve, reject) {
                var mapImg = new Image(mapWidth, mapHeight);
                mapImg.onload = function() {
                    console.log("Map image loaded!");
                    var topLeftCorner = [];
                    topLeftCorner[0] = getDifference(minWorldX, (start[0] < end[0] ? start[0] : end[0])) - 14;
                    topLeftCorner[1] = getDifference(minWorldY, (start[2] < end[2] ? start[2] : end[2])) - 14;
                    console.log("topLeftCorner", topLeftCorner);
                    var bottomRightCorner = [];
                    bottomRightCorner[0] = getDifference(minWorldX, (start[0] > end[0] ? start[0] : end[0])) + 28;
                    bottomRightCorner[1] = getDifference(minWorldY, (start[2] > end[2] ? start[2] : end[2])) + 28;
                    console.log("bottomRightCorner", bottomRightCorner);
                    var zoomedMapWidth = bottomRightCorner[0] - topLeftCorner[0];
                    var zoomedMapHeight = bottomRightCorner[1] - topLeftCorner[1];
                    var w = 0;
                    if (zoomedMapHeight > zoomedMapWidth) {
                        w = zoomedMapHeight;
                        topLeftCorner[0] = topLeftCorner[0] - Math.round((zoomedMapHeight - zoomedMapWidth) * 0.5) - 7;
                    }
                    else {
                        w = zoomedMapWidth;
                        topLeftCorner[1] = topLeftCorner[1] - Math.round((zoomedMapWidth - zoomedMapHeight) * 0.5) - 7;
                    }
                    var resizedBy = mapElem.width / w;
                    console.log("Zoomed size", w);
                    console.log("Canvas size", mapElem.width);
                    console.log("Resize by", resizedBy);
                    ctx.drawImage(this, topLeftCorner[0], topLeftCorner[1], w, w, 0, 0, mapElem.width, mapElem.height);

                    var newStartingX = -1 * (topLeftCorner[0] - getDifference(minWorldX, start[0] + 0.5)) * resizedBy;
                    var newStartingY = -1 * (topLeftCorner[1] - getDifference(minWorldY, start[2] + 0.5)) * resizedBy;
                    console.log("newStartingX", newStartingX);
                    console.log("newStartingY", newStartingY);

                    var newEndingX = -1 * (topLeftCorner[0] - getDifference(minWorldX, end[0] + 0.5)) * resizedBy;
                    var newEndingY = -1 * (topLeftCorner[1] - getDifference(minWorldY, end[2] + 0.5)) * resizedBy;
                    console.log("newEndingX", newEndingX);
                    console.log("newEndingY", newEndingY);
                    drawArrow(ctx, newStartingX, newStartingY, newEndingX, newEndingY);

                    resolve([mapElem, step]);
                };
                console.log("Loading map image...");
                mapImg.src = mapSource;
            }
        )
    },

    calculate: function(s, e) {
        // MODIFIED FROM https://gist.github.com/jpillora/7382441

        console.log(planner.graph);

        var solutions = {};
        solutions[s] = [];
        solutions[s][0] = s;
        solutions[s].dist = 0;
        solutions[s].lines = [];
        solutions[s].durations = [];
        solutions[s].warnings = [];
        solutions[s].platforms = [];
        solutions[s].halts = [s];

        while(true) {
            var parent = null;
            var nearest = null;
            var dist = Infinity;
            var lines = [];
            var durations = [];
            var warnings = [];
            var platforms = [];
            var halts = [];

            // for each existing solution
            for (var n in solutions) {
                if (!solutions[n]) {
                    continue;
                }
                var ndist = solutions[n].dist;
                var nlines = solutions[n].lines;
                var ndurations = solutions[n].durations;
                var nwarnings = solutions[n].warnings;
                var nplatforms = solutions[n].platforms;
                var nhalts = solutions[n].halts;
                var adj = planner.graph[n];

                // for each of its adjacent nodes...
                for (var a in adj) {
                    // without a solution already...
                    if (solutions[a]) {
                        continue;
                    }
                    // choose nearest node with lowest *total* cost
                    var d = adj[a]['duration'] + ndist;
                    var l = nlines.concat([adj[a]['line']]);
                    var sd = ndurations.concat([adj[a]['duration']]);
                    var w = nwarnings.concat(adj[a]['warnings']).filter(onlyUnique);
                    var p = nplatforms.concat([adj[a]['platform']]);
                    var h = nhalts.concat([adj[a]['to']]);
                    if (d < dist) {
                        // reference parent
                        parent = solutions[n];
                        nearest = a;
                        dist = d;
                        lines = l;
                        durations = sd;
                        warnings = w;
                        platforms = p;
                        halts = h;
                    }
                }
            }

            // no more solutions
            if (dist === Infinity) {
                break;
            }

            // extens parent's solution path
            solutions[nearest] = parent.concat(nearest);
            // extend parent's cost
            solutions[nearest].dist = dist;
            solutions[nearest].lines = lines;
            solutions[nearest].halts = halts;
            solutions[nearest].durations = durations;
            solutions[nearest].platforms = platforms;
            solutions[nearest].warnings = warnings;
        }

        for (i = 0; i < solutions.length; i++) {
            solutions[i].unshift(s);
        }

        if (e == null) {
            return solutions;
        }
        if (typeof solutions[e] == "undefined") {
            return null;
        }
        else {
            return solutions[e];
        }
    },

    plan: function(event) {
        event.preventDefault();

        if (planner.from == null) {
            alert("Geef eerst aan vanaf waar je de reis wilt maken.");
            return;
        }

        if (planner.to == null) {
            alert("Geef eerst aan waar de reis heen zal gaan.");
            return;
        }

        if (planner.from.type == planner.to.type && planner.from.name == planner.to.name && planner.from.location == planner.to.location && planner.from.halt == planner.to.halt) {
            alert("Bestemming kan niet hetzelfde zijn als het vertrekpunt.");
            return;
        }

        var outputField = document.getElementById("output");
        outputField.innerHTML = "";

        console.log("Van " + planner.from.halt + " naar " + planner.to.halt);
        if (planner.from.halt != planner.to.halt) {
            var solutions = planner.calculate(planner.from.halt, planner.to.halt);
            console.log(solutions);

            if (solutions.warnings.length > 0) {
                var writtenWarnings = [];
                for (i = 0; i < solutions.warnings.length; i++) {
                    switch (solutions.warnings[i]) {
                        case "single_track":
                            writtenWarnings.push("Deze route gaat gedeeltelijk over enkelspoor.");
                            break;
                        case "skeletons":
                            writtenWarnings.push("Op deze route kunnen veel skeletons voorkomen.");
                            break;
                        case "shared_platform":
                            writtenWarnings.push("Deze route gaat langs een gedeeld perron.");
                            break;
						case "mine_track":
							writtenWarnings.push("Deze route gaat gedeeltelijk over een mijnspoor.");
							break;
                        /*
						case "hyperspeed":
                            writtenWarnings.push("Deze route gaat gedeeltelijk over een hyperspeed-traject.");
                            break;
						*/
                    }
                }

                if (writtenWarnings.length > 0) {
                    var warning = document.createElement("div");
                    warning.setAttribute("class", "warning");
                    warning.innerHTML = "<b>"+writtenWarnings.length+" waarschuwing"+(writtenWarnings.length == 1 ? "" : "en")+" voor dit traject:</b><br/>" + writtenWarnings.join("<br/>");
                    outputField.appendChild(warning);
                }
                else {
                    console.log("Alle waarschuwingen voor dit traject zijn genegeerd.");
                }
            }

            var lastLine = null;
            var lastDuration = 0;
            var step = null;
            var stepinner = null;
            if (planner.from.type != "station") {
                stepinner = "";
                step = document.createElement("div");
                step.setAttribute("class", "step");
                step.appendChild(planner.createItem(planner.from));
                var halt = getObjectByKey(planner.data.stations, "id", solutions.halts[0]);
                stepinner += '<div class="stationdetails"><b>Loop</b> naar <b>station '+halt.name + "</b>";
                if (planner.from.coords != null && halt.coords != null) {
                    stepinner += " ("+halt.coords.join(", ")+"; ";
                    var distance = getDistance(planner.from.coords, halt.coords);
                    stepinner += "ongeveer "+distance+" blok";
                    if (distance != 1) {
                        stepinner += "ken";
                    }
                    stepinner += " lopen)";
                }
                else {
                    stepinner += " (onbekende afstand)";
                }
                stepinner += '.</div>';
                step.innerHTML += stepinner;
                planner.insertMap(planner.from.coords, halt.coords, step);
                outputField.appendChild(step);
            }
            for (i = 0; i < solutions.halts.length; i++) {
                stepinner = "";
                if (i < solutions.halts.length - 1) {
                    if (lastLine != solutions.lines[i]) {
                        if (lastLine != null) {
                            lastDuration += solutions.durations[i - 1];
                            stepinner += '<div class="stationdetails"><i>Na ' + secondsToString(lastDuration) + ' kom je aan op station ' + getObjectByKey(planner.data.stations, "id", solutions.halts[i]).name+':</i></div>';
                            step.innerHTML += stepinner;
                            stepinner = "";
                        }
                        lastLine = solutions.lines[i];
                        lastDuration = 0;
                        step = document.createElement("div");
                        step.setAttribute("class", "step");
                        var halt = getObjectByKey(planner.data.stations, "id", solutions.halts[i]);
                        step.appendChild(planner.createItem({
                            type: "station",
                            name: halt.name,
                            location: halt.location,
                            halt: halt.id,
                            coords: halt.coords
                        }));
                        stepinner += '<div class="stationdetails">Neem de <b>'+solutions.lines[i]+'</b> vanaf <b>spoor '+solutions.platforms[i]+'</b> (richting station <b>'+getObjectByKey(planner.data.stations, "id", solutions.halts[i+1]).name+'</b>).</div>';
                        step.innerHTML += stepinner;
                        outputField.appendChild(step);
                    }
                    else {
                        lastDuration += solutions.durations[i - 1];
                        stepinner += '<div class="stationdetails"><i>Sla station '+getObjectByKey(planner.data.stations, "id", solutions.halts[i]).name+' over. Hier kom je langs na '+secondsToString(lastDuration)+'.</i></div>';
                        step.innerHTML += stepinner;
                    }
                }
                else {
                    if (lastLine != null) {
                        lastDuration += solutions.durations[i - 1];
                        stepinner += '<div class="stationdetails"><i>Na ' + secondsToString(lastDuration) + ' kom je aan op station ' + getObjectByKey(planner.data.stations, "id", solutions.halts[i]).name+':</i></div>';
                        step.innerHTML += stepinner;
                        stepinner = "";
                    }
                    step = document.createElement("div");
                    step.setAttribute("class", "step");
                    var halt = getObjectByKey(planner.data.stations, "id", solutions.halts[i]);
                    step.appendChild(planner.createItem({
                        type: "station",
                        name: halt.name,
                        location: halt.location,
                        halt: halt.id,
                        coords: halt.coords
                    }));
                    if (planner.to.type == "station") {
                        stepinner += '<div class="stationdetails"><i>Je hebt je bestemming bereikt.</i></div>';
                    }
                    else {
                        stepinner += '<div class="stationdetails"><b>Loop</b> naar <b>'+planner.to.name + "</b>";
                        if (halt.coords != null && planner.to.coords != null) {
                            stepinner += " ("+planner.to.coords.join(", ")+"; ";
                            var distance = getDistance(halt.coords, planner.to.coords);
                            stepinner += "ongeveer "+distance+" blok";
                            if (distance != 1) {
                                stepinner += "ken";
                            }
                            stepinner += " lopen)";
                        }
                        else {
                            stepinner += " (onbekende afstand)";
                        }
                        stepinner += '.</div>';
                    }
                    step.innerHTML += stepinner;
                    if (planner.to.type != "station" && planner.to.coords != null) {
                        // step.appendChild(planner.insertMap(halt.coords, planner.to.coords));
                        planner.insertMap(halt.coords, planner.to.coords, step);
                    }
                    outputField.appendChild(step);
                }
            }
            if (planner.to.type != "station") {
                stepinner = "";
                step = document.createElement("div");
                step.setAttribute("class", "step");
                step.appendChild(planner.createItem(planner.to));
                stepinner += '<div class="stationdetails"><i>Je hebt je bestemming bereikt.</i></div>';
                step.innerHTML += stepinner;
                outputField.appendChild(step);
            }
        }
        else {
            stepinner = "";
            step = document.createElement("div");
            step.setAttribute("class", "step");
            step.appendChild(planner.createItem(planner.from));
            stepinner += '<div class="stationdetails"><b>Loop</b> naar <b>';
            if (planner.to.type == "station") {
                stepinner += 'station ';
            }
            stepinner += planner.to.name + '</b>';
            if (planner.from.coords != null && planner.to.coords != null) {
                stepinner += " ("+planner.to.coords.join(", ")+"; ";
                var distance = getDistance(planner.from.coords, planner.to.coords);
                stepinner += "ongeveer "+distance+" blok";
                if (distance != 1) {
                    stepinner += "ken";
                }
                stepinner += " lopen)";
            }
            else {
                stepinner += " (onbekende afstand)";
            }
            stepinner += '.</div>';
            step.innerHTML += stepinner;
            // step.appendChild(planner.insertMap(planner.from.coords, planner.to.coords));
            planner.insertMap(planner.from.coords, planner.to.coords, step);
            outputField.appendChild(step);

            stepinner = "";
            step = document.createElement("div");
            step.setAttribute("class", "step");
            step.appendChild(planner.createItem(planner.to));
            stepinner += '<div class="stationdetails"><i>Je hebt je bestemming bereikt.</i></div>';
            step.innerHTML += stepinner;
            outputField.appendChild(step);
        }
    }
};