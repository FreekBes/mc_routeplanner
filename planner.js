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

    reverseFromAndTo: function() {
        var tempTo = planner.to;
        planner.to = planner.from;
        planner.from = tempTo;
        if (planner.from != null) {
            document.getElementById("from").value = planner.from.name;
        }
        else {
            document.getElementById("from").focus();
        }
        if (planner.to != null) {
            document.getElementById("to").value = planner.to.name;
        }
        else {
            document.getElementById("to").focus();
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

    getById: function(id) {
        return new Promise(function(resolve, reject) {
            planner.autocompleteRequest = $.getJSON( "api/getbyid.php", {id: id, w: worldToLoad, noCache: Math.random()} )
                .done(function(json) {
                    if (json["data"] != null) {
                        resolve(json["data"]);
                    }
                    else {
                        reject();
                    }
                })
                .fail(function() {
                    reject();
                });
        });
    },

    planRequest: null,
    plan: function(event) {
        if (event != null) {
            event.preventDefault();
        }

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

        if (typeof window.metromap == "object") {
            document.getElementById("metromap").style.display = "none";
        }

        console.log("Van " + planner.from.id + " naar " + planner.to.id);
        if (planner.from.id != planner.to.id) {
            planner.planRequest = $.getJSON( "api/planner.php", {from: planner.from.id, to: planner.to.id, w: worldToLoad, noCache: Math.random()} )
                .done(function(json) {
                    planner.planRequest = null;
                    console.log(json);
                    if (json["type"] == "success") {
                        var items = json["data"]["items"];
                        var route = json["data"]["route"];
                        var lineData = json["data"]["line_data"];
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
                            var lineSummary = null;
                            var lineGroupOutput = null;
                            var lineGroupFirstStationAdded = false;
                            var lineWarningsCombined = [];
                            for (i = 0; i < route.halts.length; i++) {
                                if (route.lines[i] != lastLine && i != route.halts.length - 1) {
                                    if (lineGroupOutput != null) {
                                        lineGroupOutput.appendChild(planner.createTimelineFiller());
                                        if (lineSummary != null && lineWarningsCombined.length > 0) {
                                            var warningsSumm = document.createElement('div');
                                            warningsSumm.className = 'timeline-station-warnings combined-warnings';
                                            if (!detailsTagSupported()) {
                                                warningsSumm.setAttribute("style", "right: 4px;");
                                            }
                                            for (var j = 0; j < lineWarningsCombined.length; j++) {
                                                var warningInfo = planner.getWarningIconAndName(lineWarningsCombined[j]);
                                                warningsSumm.innerHTML += '<span class="timeline-station-warning-icon" onclick="event.stopPropagation(); return false;" style="background-image: url(\''+warningInfo[0]+'\');" rel="tooltip" title="'+warningInfo[1].replace(/"/g, '\\\"')+'"></span>';
                                            }
                                            var summ = lineSummary.children[1];
                                            summ.insertBefore(warningsSumm, summ.children[3]);
                                        }
                                        outputField.appendChild(lineGroupOutput);
                                    }
                                    lineGroupOutput = document.createElement('details');
                                    lineGroupFirstStationAdded = false;
                                    lineSummary = document.createElement('summary');
                                    if (detailsTagSupported()) {
                                        lineSummary.setAttribute("title", "Tik/klik om tussenstops te weergeven");
                                    }
                                    lineSummary.appendChild(planner.createTimelineLineSummary(route.lines[i], lineData[route.lines[i]]["type"], lineData[route.lines[i]]["operator"], items[route.halts[i+1]]["name"], route.warnings[i]));
                                    lineGroupOutput.appendChild(lineSummary);
                                    lineWarningsCombined = [];
                                }

                                if (i == 0) {
                                    var timelineHalt = planner.createTimelineHalt(0, true, items[route.halts[i]]["name"], route.platforms[i], route.lines[i], toDoStartItem, false, route.warnings[i]);
                                    lineSummary.insertBefore(timelineHalt, lineSummary.firstChild);
                                    lineGroupFirstStationAdded = true;
                                    if (route.warnings[i].length > 0) {
                                        lineWarningsCombined = makeUnique(lineWarningsCombined.concat(route.warnings[i]));
                                        // lineGroupOutput.appendChild(planner.createTimelineWarnings(route.warnings[i]));
                                    }
                                }
                                else if (i == route.halts.length - 1) {
                                    totalDuration += route.durations[i-1];
                                    var timelineHalt = planner.createTimelineHalt(totalDuration, route.lines[i] != lastLine, items[route.halts[i]]["name"], route.platforms[i*2-1], null, false, toDoEndItem, null);
                                    lineGroupOutput.appendChild(planner.createTimelineFiller());
                                    if (lineSummary != null && lineWarningsCombined.length > 0) {
                                        var warningsSumm = document.createElement('div');
                                        warningsSumm.className = 'timeline-station-warnings combined-warnings';
                                        if (!detailsTagSupported()) {
                                            warningsSumm.setAttribute("style", "right: 4px;");
                                        }
                                        for (var j = 0; j < lineWarningsCombined.length; j++) {
                                            var warningInfo = planner.getWarningIconAndName(lineWarningsCombined[j]);
                                            warningsSumm.innerHTML += '<span class="timeline-station-warning-icon" style="background-image: url(\''+warningInfo[0]+'\');" rel="tooltip" title="'+warningInfo[1].replace(/"/g, '\\\"')+'"></span>';
                                        }
                                        var summ = lineSummary.children[1];
                                        summ.insertBefore(warningsSumm, summ.children[3]);
                                    }
                                    outputField.appendChild(lineGroupOutput);
                                    outputField.appendChild(timelineHalt);
                                }
                                else {
                                    totalDuration += route.durations[i-1];
                                    var timelineHalt = planner.createTimelineHalt(totalDuration, route.lines[i] != lastLine, items[route.halts[i]]["name"], route.platforms[i*2], route.lines[i], false, false, route.warnings[i]);
                                    if (!lineGroupFirstStationAdded) {
                                        lineGroupFirstStationAdded = true;
                                        lineSummary.insertBefore(timelineHalt, lineSummary.firstChild);
                                    }
                                    else {
                                        lineGroupOutput.appendChild(timelineHalt);
                                    }
                                    if (route.warnings[i].length > 0) {
                                        lineWarningsCombined = makeUnique(lineWarningsCombined.concat(route.warnings[i]));
                                        // lineGroupOutput.appendChild(planner.createTimelineWarnings(route.warnings[i]));
                                    }
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

                        updateUrl(planner.from.id, planner.from.name, planner.to.id, planner.to.name);

                        bindTooltips();
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

    createTimelineHalt: function(time, transfer, name, platform, line, start, end, warningsForth) {
        var b = document.createElement('div');
        b.setAttribute("class", "timeline-station"+(transfer ? ' transfer' : ' normal')+(start ? ' start' : '')+(end ? ' end' : ''));
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

        if (warningsForth != null && warningsForth.length > 0 && transfer == false) {
            bhtml += '<div class="timeline-station-warnings inline smaller-icons">';
            for (var i = 0; i < warningsForth.length; i++) {
                var warningInfo = planner.getWarningIconAndName(warningsForth[i]);
                bhtml += '<span class="timeline-station-warning-icon" style="background-image: url(\''+warningInfo[0]+'\');" rel="tooltip" title="'+warningInfo[1].replace(/"/g, '\\\"')+'"></span>';
            }
            bhtml += '</div>';
        }

        if (platform != undefined && platform != null && platform > 0) {
            bhtml += '<div class="timeline-station-platform">'+platform+'</div>';
        }
        else {
            bhtml += '<div class="timeline-station-line" title="Dit station heeft geen spoorindeling">- - - - - -</div>';
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
        bhtml += '<div class="timeline-station-name">Loop '+getDistance(fromCoords, toCoords)+' blokken naar '+toType.toLowerCase()+' '+toName;
        if (toType.toLowerCase() != "coördinaten" && toType.toLowerCase() != 'coords') {
            bhtml += ' <span style="white-space: nowrap;">('+toCoords.join(', ')+')</span>';
        }
        bhtml += '</div>';

        b.innerHTML = bhtml;
        return b;
    },

    createTimelineLineSummary: function(name, type, operator, direction, warningsForth) {
        var b = document.createElement('div');
        b.setAttribute("class", "timeline-station instruction line-summary");
        var bhtml = "";

        bhtml += '<div class="timeline-station-time">'+operator+'</div>';
        bhtml += '<div class="timeline-station-icon"></div>';
        bhtml += '<div class="timeline-station-name"><b>'+operator+' '+planner.getPublicTransportTypeName(type).toLowerCase()+' '+name+'</b><br/><i>richting '+direction+'</i></div>';
        if (warningsForth != null && warningsForth.length > 0) {
            bhtml += '<div class="timeline-station-warnings smaller-icons">';
            for (var i = 0; i < warningsForth.length; i++) {
                var warningInfo = planner.getWarningIconAndName(warningsForth[i]);
                bhtml += '<span class="timeline-station-warning-icon" onclick="event.stopPropagation(); return false;" style="background-image: url(\''+warningInfo[0]+'\');" rel="tooltip" title="'+warningInfo[1].replace(/"/g, '\\\"')+'"></span>';
            }
            bhtml += '</div>';
        }
        if (detailsTagSupported()) {
            bhtml += '<div class="timeline-station-expand"><img class="expand-icon up" src="icons/expand-up.png" /><img class="expand-icon down" src="icons/expand-down.png" /></div>';
        }
        
        b.innerHTML = bhtml;
        return b;
    },

    createTimelineWarnings: function(warnings) {
        var b = document.createElement('div');
        b.setAttribute("class", "timeline-station warnings");
        var bhtml = "";

        bhtml += '<div class="timeline-station-time"></div>';
        bhtml += '<div class="timeline-station-icon"></div>';
        bhtml += '<div class="timeline-station-name">';

        for (var i = 0; i < warnings.length; i++) {
            var warningInfo = planner.getWarningIconAndName(warnings[i]);
            bhtml += '<span class="timeline-station-warning-icon" style="background-image: url(\''+warningInfo[0]+'\');" rel="tooltip" title="'+warningInfo[1].replace(/"/g, '\\\"')+'"></span>';
        }

        bhtml += '</div>';

        b.innerHTML = bhtml;
        return b;
    },

    createTimelineFiller: function() {
        var b = document.createElement('div');
        b.setAttribute("class", "timeline-station filler");
        var bhtml = "";

        bhtml += '<div class="timeline-station-time"></div>';
        bhtml += '<div class="timeline-station-icon"></div>';
        bhtml += '<div class="timeline-station-name"></div>';

        b.innerHTML = bhtml;
        return b;
    },
    
    getPublicTransportTypeName: function(type) {
        switch (type) {
            case 'train':
                return 'Trein';
            case 'subway':
            case 'metro':
                return 'Metro';
            case 'ring_line':
                return 'Ringlijn';
            case 'tram':
                return 'Tram';
            case 'mine':
                return 'Mijnspoor';
            default:
                return 'Verbinding';
        }
    },

    getItemIconAndName: function(type) {
        switch (type) {
            case 'station':
                return ["icons/station.png", "Station"];
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
            case "coords":
                return ["icons/place.png", "Coördinaten"];
            default:
                return ["icons/place.png", "Overig"];
        }
    },

    getWarningIconAndName: function(warning) {
        switch (warning) {
            case "single_track":
                return ["icons/warnings/single-track.png", "Dit traject gaat gedeeltelijk over enkelspoor."];
            case "skeletons":
                return ["icons/warnings/skeletons.png", "Op dit traject kunnen veel skeletons voorkomen."];
            case "zombies":
                return ["icons/warnings/zombies.png", "Op dit traject kunnen veel zombies voorkomen."];
            case "shared_platform":
                return ["icons/warnings/shared-platform.png", "Dit traject gaat langs een gedeeld perron."];
            case "mine_track":
                return ["icons/warnings/mine-track.png", "Deze route gaat over een mijnspoor."];
            case "own_minecart":
                return ["icons/warnings/own-minecart.png", "Voor dit traject moet je je eigen minecart meenemen!"];
            case "cactus_breaker":
                return ["icons/warnings/no-icon.png", "Dit traject wordt onderbroken door een cactus. Je zult daar opnieuw in moeten stappen."];
            case "no_stop_take_off":
                return ["icons/warnings/no-stop-take-off.png", "De minecart zal gelijk wegrijden bij het drukken op de knop. Stap snel in!"];
            case "no_fence":
                return ["icons/warnings/no-fence.png", "Langs dit traject staat geen hek! Pas op voor mobs op het spoor."];
            case "messy":
                return ["icons/warnings/messy.png", "Dit traject is erg rommelig!"];
            case "left_side":
                return ["icons/warnings/left-side.png", "Op dit traject wordt links aangehouden."];
            case "lever_for_minecart":
                return ["icons/warnings/lever-for-minecart.png", "Op dit traject moet je levers omschakelen in plaats van op knoppen drukken om minecarts te verkrijgen."];
            default:
                return ["icons/warnings/no-icon.png", warning];
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