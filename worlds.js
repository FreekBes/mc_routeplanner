var worlds = null;

var possibleWorlds = null;
var worldToLoad = null;
function startInit() {
    $.getJSON("worlds.json", {noCache: Math.random()} )
        .done(function(json) {
            worlds = json;
            possibleWorlds = Object.keys(worlds);
            worldToLoad = getParameterByName("w");
            if (worldToLoad == undefined || worldToLoad == null || possibleWorlds.indexOf(worldToLoad) < 0) {
                worldToLoad = "frn";
            }
            document.title = "Routeplanner voor " + worlds[worldToLoad].displayName;
            if (typeof planner != "undefined") {
                planner.init(worldToLoad);
            }

            document.getElementById("worldselector").addEventListener("change", function(event) {
                document.location.href = "?w=" + event.target.value;
            });
            var worldOpts = document.getElementById("worldopts");
            for (var i = 0; i < possibleWorlds.length; i++) {
                var worldOpt = document.createElement("option");
                worldOpt.setAttribute("value", possibleWorlds[i]);
                worldOpt.innerHTML = worlds[possibleWorlds[i]].name;
                worldOpts.appendChild(worldOpt);
            }

            if (getParameterByName("f") != null) {
                planner.getById(getParameterByName("f")).then(function(item) {
                    planner.setFrom(item);

                    if (planner.from != undefined && planner.to != undefined && planner.from != null && planner.to != null) {
                        planner.plan();
                    }
                });
            }
            if (getParameterByName("t") != null) {
                planner.getById(getParameterByName("t")).then(function(item) {
                    planner.setTo(item);

                    if (planner.from != undefined && planner.to != undefined && planner.from != null && planner.to != null) {
                        planner.plan();
                    }
                });
            }
        });
}