<?PHP
    function compare_names($a, $b) {
        if ($a["name"] < $b["name"]) {
            return -1;
        }
        if ($a["name"] > $b["name"]) {
            return 1;
        }
        if ($a["name"] == $b["name"]) {
            if ($a["location"] < $b["location"]) {
                return -1;
            }
            if ($a["location"] > $b["location"]) {
                return 1;
            }
        }
        return 0;
    }

    function get_object_by_id($objects, $id) {
        foreach ($objects as $object) {
            if ($object["id"] == $id) {
                return $object;
            }
        }
        return null;
    }

    function station_to_item($station) {
        $res = array();
        $res["id"] = $station["id"];
        $res["type"] = "station";
        $res["name"] = $station["name"];
        $res["location"] = $station["location"];
        $res["halt"] = $station["id"];
        $res["coords"] = $station["coords"];
        return $res;
    }

    function location_to_item($location) {
        $res = array();
        $res["id"] = urlencode($location["name"]);
        $res["type"] = "location";
        $res["name"] = $location["name"];
        $res["location"] = '';
        $res["halt"] = $location["closest_station"];
        $res["coords"] = $location["coords"];
        return $res;
    }

    function poi_to_item($poi) {
        $res = array();
        $res["id"] = $poi["id"];
        $res["type"] = "poi";
        $res["subtype"] = $poi["type"];
        $res["name"] = $poi["name"];
        $res["location"] = $poi["location"];
        $res["halt"] = $poi["closest_station"];
        $res["coords"] = $poi["coords"];
        return $res;
    }
?>