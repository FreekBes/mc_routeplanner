function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
    results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function compareNames(a, b) {
    if (a.name < b.name)
        return -1;
    if (a.name > b.name)
        return 1;
    if (a.name == b.name) {
        if (a.location < b.location)
            return -1;
        if (a.location > b.location)
            return 1;
    }
    return 0;
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function getObjectByKey(array, key, value) {
    return array.find(function(x) {
        x[key] === value;
    });
}

function getIndexByKey(array, key, value) {
    return array.findIndex(x => x[key] === value);
}

function getDistance(from, to) {
    var a = from[0] - to[0];
    var b = from[2] - to[2];
    return Math.round(Math.sqrt( a* a + b*b));
}

function getDifference(a, b) {
    return Math.abs(a - b);
}

function secondsToString(seconds) {
    var m = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    var s = (((seconds % 31536000) % 86400) % 3600) % 60;
    var returnStr = "";
    if (m > 0) {
        if (m > 1) {
            returnStr += m +" minuten";
        }
        else {
            returnStr += m +" minuut";
        }
    }
    if (m > 0 && s > 1) {
        returnStr += " en ";
    }
    if (s > 1) {
        returnStr += s +" seconden";
    }
    return returnStr;
}

// from https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
function drawArrow(ctx, fromx, fromy, tox, toy){
    //variables to be used when creating the arrow
    var headlen = 8;

    var angle = Math.atan2(toy-fromy,tox-fromx);

    //starting a new path from the head of the arrow to one of the sides of the point
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));

    //path from the side point of the arrow, to the other side point
    ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/7),toy-headlen*Math.sin(angle+Math.PI/7));

    //path from the side point back to the tip of the arrow, and then again to the opposite side point
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));

    //draws the paths created above
    ctx.strokeStyle = "#cc0000";
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = "#cc0000";
    ctx.fill();

    //starting path of the arrow from the start square to the end square and drawing the stroke
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.strokeStyle = "#cc0000";
    ctx.lineWidth = 6;
    ctx.stroke();
}

function detailsTagSupported() {
    var temp = document.createElement("details");
    return (typeof temp.open === "boolean");
}

function updateUrl(f, fName, t, tName) {
    if (window.history.replaceState) {
        var newTitle = "Route van " + fName + " naar " + tName + " | Routeplanner voor " + worlds[worldToLoad].displayName;
        window.history.replaceState({f: f, t: t}, newTitle, "?f="+encodeURIComponent(f)+"&t="+encodeURIComponent(t)+"&w="+worldToLoad);
        document.title = newTitle;
    }
}

function makeUnique(array) {
    return array.filter(function(value, index, self) { 
        return self.indexOf(value) === index;
    });
}