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

        console.log("Van " + planner.from.halt + " naar " + planner.to.halt);
        if (planner.from.halt != planner.to.halt) {
            planner.planRequest = $.getJSON( "api/planner.php", {from: planner.from.halt, to: planner.to.halt, w: worldToLoad, noCache: Math.random()} )
                .done(function(json) {
                    planner.planRequest = null;
                    console.log(json);
                    if (json["type"] == "success") {
                        var items = json["data"]["items"];
                        var route = json["data"]["route"];

                        var lastLine = null;
                        var totalDuration = 0;
                        var step = null;
                        var stepinner = null;
                        for (i = 0; i < route.halts.length; i++) {
                            if (i == 0) {
                                var timelineHalt = planner.createTimelineHalt(0, true, items[route.halts[i]]["name"], route.platforms[i], route.lines[i], true, false);
                                outputField.appendChild(timelineHalt);
                            }
                            else if (i == route.halts.length - 1) {
                                totalDuration += route.durations[i-1];
                                var timelineHalt = planner.createTimelineHalt(totalDuration, route.lines[i] != lastLine, items[route.halts[i]]["name"], route.platforms[i*2-1], null, false, true);
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

    createTimelineHalt: function(time, transfer, name, platform, line, start, end) {
        var b = document.createElement('div');
        b.setAttribute("class", "timeline-station"+(transfer ? ' transfer' : '')+(start ? ' start' : '')+(end ? ' end' : ''));
        var bhtml = "";

        var date = new Date();
        date.setSeconds(date.getSeconds() + time);
        bhtml += '<div class="timeline-station-time">'+date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})+'</div>';
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
                    case 'bank':
                        bhtml += '<img src="icons/bank.png" alt="Bank" />';
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
                    case "art":
                        bhtml += '<img src="icons/place.png" alt="Kunstwerk" />';
                        break;
                    case "enchanting_table":
                        bhtml += '<img src="icons/place.png" alt="Enchanting Table" />';
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
                    case 'bank':
                        bhtml += 'Bank';
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
                    case "art":
                        bhtml += "Kunstwerk";
                        break;
                    case "enchanting_table":
                        bhtml += "Enchanting Table";
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