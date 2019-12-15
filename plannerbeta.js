var planner = {
    init: function(worldToLoad) {
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

    autocompleteRequest: null,
    autocompleteInput: function(event, forWhat) {
        if (event.currentTarget.id == "from") {
            planner.setFrom(null);
        }
        else if (event.currentTarget.id == "to") {
            planner.setTo(null);
        }
        
        if (planner.autocompleteRequest != null) {
            planner.autocompleteRequest.abort();
            planner.autocompleteRequest = null;
        }

        var text = event.target.value.trim().toLowerCase();
        if (text.length > 0) {
            planner.autocompleteRequest = $.getJSON( "api/autocomplete.php", {i: text, w: worldToLoad, noCache: Math.random()} )
                .done(function(json) {
                    planner.removeAutoCompletes();
                    if (json["data"].length > 0) {
                        var a = document.createElement('div');
                        a.setAttribute("id", event.target.getAttribute("id") + "-autocomplete-list");
                        a.setAttribute("class", "autocomplete-items");
                        event.target.parentNode.appendChild(a);
            
                        for (i = 0; i < json["data"].length; i++) {
                            b = planner.createItem(json["data"][i]);
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
                })
                .always(function() {
                    planner.autocompleteRequest = null;
                });
        }
        else {
            planner.removeAutoCompletes();
        }
    },

    planRequest: null,
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

        if (planner.planRequest != null) {
            planner.planRequest.abort();
            planner.planRequest = null;
        }

        var outputField = document.getElementById("output");
        outputField.innerHTML = "";

        console.log("Van " + planner.from.id + " naar " + planner.to.id);
        if (planner.from.id != planner.to.id) {
            planner.planRequest = $.getJSON( "api/planner.php", {from: planner.from.id, to: planner.to.id, w: worldToLoad, noCache: Math.random()} )
                .done(function(json) {
                    planner.planRequest = null;
                    console.log(json);
                    if (json["type"] == "success") {
                        var items = json["data"]["items"];
                        var route = json["data"]["route"];
                        var walking = json["data"]["walking"];
                        var toDoStartItem = true;
                        var toDoEndItem = true;

                        if (walking["from"]["required"]) {
                            // walking is required from the start to a certain train station!
                            var walkingStartItem = items[walking["from"]["start"]];
                            var walkingEndItem = items[walking["from"]["end"]];
                            var walkingHalt = planner.createTimelineItem(walkingStartItem["name"], walkingStartItem["subtype"], true, false);
                            outputField.appendChild(walkingHalt);
                            var timelineWalk = planner.createTimelineWalk(walkingStartItem["coords"], walkingStartItem["name"], planner.getItemIconAndName(walkingStartItem["subtype"])[1], walkingEndItem["coords"], walkingEndItem["name"], planner.getItemIconAndName(walkingEndItem["subtype"])[1]);
                            outputField.appendChild(timelineWalk);
                            toDoStartItem = false;
                        }

                        if (walking["to"]["required"]) {
                            toDoEndItem = false;
                        }

                        if (route != null) {
                            var lastLine = null;
                            var totalDuration = 0;
                            for (i = 0; i < route.halts.length; i++) {
                                if (i == 0) {
                                    var timelineHalt = planner.createTimelineHalt(0, true, items[route.halts[i]]["name"], route.platforms[i], route.lines[i], toDoStartItem, false);
                                    outputField.appendChild(timelineHalt);
                                }
                                else if (i == route.halts.length - 1) {
                                    totalDuration += route.durations[i-1];
                                    var timelineHalt = planner.createTimelineHalt(totalDuration, route.lines[i] != lastLine, items[route.halts[i]]["name"], route.platforms[i*2-1], null, false, toDoEndItem);
                                    outputField.appendChild(timelineHalt);
                                }
                                else {
                                    totalDuration += route.durations[i-1];
                                    var timelineHalt = planner.createTimelineHalt(totalDuration, route.lines[i] != lastLine, items[route.halts[i]]["name"], route.platforms[i*2], route.lines[i], false, false);
                                    outputField.appendChild(timelineHalt);
                                }

                                if (i < route.halts.length - 1) {
                                    lastLine = route.lines[i];
                                }
                            }
                        }
                        else {
                            // no public transport needed for this route
                            // just walk
                            var walkingHalt = planner.createTimelineItem(walkingEndItem["name"], walkingEndItem["subtype"], false, true);
                            outputField.appendChild(walkingHalt);
                        }

                        if (walking["to"]["required"]) {
                            // walking is required from the end to a certain poi!
                            var walkingStartItem = items[walking["to"]["start"]];
                            var walkingEndItem = items[walking["to"]["end"]];
                            var timelineWalk = planner.createTimelineWalk(walkingStartItem["coords"], walkingStartItem["name"], planner.getItemIconAndName(walkingStartItem["subtype"])[1], walkingEndItem["coords"], walkingEndItem["name"], planner.getItemIconAndName(walkingEndItem["subtype"])[1]);
                            outputField.appendChild(timelineWalk);
                            var walkingHalt = planner.createTimelineItem(walkingEndItem["name"], walkingEndItem["subtype"], false, true);
                            outputField.appendChild(walkingHalt);
                        }
                    }
                    else {
                        alert(json["message"]);
                    }
                })
                .fail(function() {
                    planner.planRequest = null;
                    alert("Route kon niet worden berekend door een server error. Probeer het later opnieuw.");
                });
        }
        else {
            alert("Beginlocatie kan niet hetzelfde zijn als eindlocatie!");
        }
    },

    createTimelineItem: function(name, poiType, start, end) {
        var b = document.createElement('div');
        b.setAttribute("class", "timeline-station transfer poi"+(start ? ' start' : '')+(end ? ' end' : ''));
        var bhtml = "";

        bhtml += '<div class="timeline-station-time"></div>';
        bhtml += '<div class="timeline-station-icon"><img class="timeline-station-poi-icon" src="'+planner.getItemIconAndName(poiType)[0]+'" alt="punt" /></div>';
        bhtml += '<div class="timeline-station-name">'+name+'</div>';

        b.innerHTML = bhtml;
        return b;
    },

    createTimelineHalt: function(time, transfer, name, platform, line, start, end) {
        var b = document.createElement('div');
        b.setAttribute("class", "timeline-station"+(transfer ? ' transfer' : '')+(start ? ' start' : '')+(end ? ' end' : ''));
        var bhtml = "";

        if (time > -1) {
            var date = new Date();
            date.setSeconds(date.getSeconds() + time);
            bhtml += '<div class="timeline-station-time" title="'+planner.formatSeconds(time)+'">'+date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})+'</div>';
        }
        else {
            bhtml += '<div class="timeline-station-time"></div>';
        }
        bhtml += '<div class="timeline-station-icon"></div>';
        bhtml += '<div class="timeline-station-name">'+name+'</div>';
        if (platform != undefined && platform != null && platform > 0) {
            bhtml += '<div class="timeline-station-platform">'+platform+'</div>';
        }
        else if (line != null) {
            bhtml += '<div class="timeline-station-line">'+line+'</div>';
        }

        b.innerHTML = bhtml;
        return b;
    },

    createTimelineWalk: function(fromCoords, fromName, fromType, toCoords, toName, toType) {
        var b = document.createElement('div');
        b.setAttribute("class", "timeline-station instruction walk");
        var bhtml = "";

        bhtml += '<div class="timeline-station-time"></div>';
        bhtml += '<div class="timeline-station-icon"></div>';
        bhtml += '<div class="timeline-station-name">Loop '+getDistance(fromCoords, toCoords)+' blokken naar '+toType.toLowerCase()+' '+toName+' <span style="white-space: nowrap;">('+toCoords.join(', ')+')</span></div>';

        b.innerHTML = bhtml;
        return b;
    },

    getItemIconAndName: function(type) {
        switch (type) {
            case 'station':
                return ["icons/place.png", "Station"];
            case 'spawn':
                return ["icons/place.png", "Spawn"];
            case 'end_portal':
                return ["icons/portal.png", "End Portal"];
            case 'nether_portal':
                return ["icons/portal.png", "Nether Portal"];
            case 'farm':
                return ["icons/farm.png", "Farm"];
            case 'community_building':
                return ["icons/bed.png", "Communityhuis"];
            case 'hotel':
                return ["icons/bed.png", "Hotel"];
            case 'bank':
                return ["icons/bank.png", "Bank"];
            case 'home':
                return ["icons/home.png", "Huis"];
            case 'castle':
                return ["icons/castle.png", "Kasteel"];
            case 'gate':
                return ["icons/gate.png", "Poort"];
            case 'church':
                return ["icons/church.png", "Kerk"];
            case 'stable':
                return ["icons/parking.png", "Paardenstal"];
            case 'shop':
                return ["icons/shop.png", "Winkel"];
            case 'food':
                return ["icons/food.png", "Eten"];
            case 'viewpoint':
                return ["icons/viewpoint.png", "Uitzichtpunt"];
            case "terrain":
                return ["icons/terrain.png", "Landschap"];
            case "mine":
                return ["icons/mine.png", "Mijn"];
            case "art":
                return ["icons/place.png", "Kunstwerk"];
            case "enchanting_table":
                return ["icons/place.png", "Enchanting Table"];
            default:
                return ["icons/place.png", "Overig"];
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
                bhtml += '<img src="'+planner.getItemIconAndName(item.subtype)[0]+'" alt="'+planner.getItemIconAndName(item.subtype)[1]+'" />';
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
                bhtml += planner.getItemIconAndName(item.subtype)[1];
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
    
    formatSeconds: function(seconds) {
		var s = Math.floor(seconds % 60);
		var m = Math.floor((seconds / 60) % 60);
		var u = Math.floor(((seconds / 60) / 60 ) % 60);
		if (m < 10) {
			m = '0' + m;
		}
		if (s < 10) {
			s = '0' + s;
		}
		if (u < 1) {
			return (m + ':' + s);
		}
		else if (u >= 1) {
			return (u + ':' + m + ':' + s);
		}
	}
};