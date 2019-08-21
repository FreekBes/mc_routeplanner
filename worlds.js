var worlds = {
    frn: {
        name: "Freeks Realm (2019 Reset)",
        displayName: "Freeks Realm",
        data: "data.json",
        mapSupported: true
    },
    fro: {
        name: "Freeks Realm (2015-2019)",
        displayName: "Freeks Realm [OUD]",
        data: "data-oud.json",
        mapSupported: false
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