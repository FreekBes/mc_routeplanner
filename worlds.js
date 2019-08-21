var worlds = {
    frn: {
        name: "Freeks Realm (2019 Reset)",
        displayName: "Freeks Realm",
        data: "data.json",
        mapSupported: true
    }
};

var possibleWorlds = Object.keys(worlds);
var worldToLoad = null;
function startInit() {
    worldToLoad = getParameterByName("w");
    if (worldToLoad == undefined || worldToLoad == null || possibleWorlds.indexOf(worldToLoad) < 0) {
        worldToLoad = "frn";
    }
    planner.init(worldToLoad);
}