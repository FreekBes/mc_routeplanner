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
        return get_object_by($objects, "id", $id);
    }

    function get_object_by($objects, $by_what, $value) {
        foreach ($objects as $object) {
            if ($object[$by_what] == $value) {
                return $object;
            }
        }
        return null;
    }

    function string_might_be_coords($str) {
        return (strpos($str,",") > -1 || strpos($str," ") > -1 || is_numeric($str));
    }

    function string_to_coords($str) {
        if (string_might_be_coords($str)) {
            if (strpos($str, ",") > -1) {
                $coords = explode(",", $str);
            }
            else if (strpos($str, " ") > -1) {
                $coords = explode(" ", $str);
            }
            else {
                $coords = array(intval($str), 0, 0);
            }

            while (count($coords) < 3) {
                array_push($coords, 0);
            }
            $coords = array_slice($coords, 0, 3);
            
            for ($i = 0; $i < 3; $i++) {
                $coords[$i] = intval($coords[$i]);
            }

            return $coords;
        }
        else {
            return array(0, 0, 0);
        }
    }

    function coords_to_item($coords, $nearestHaltId) {
        $res = array();
        $res["id"] = implode(",", $coords);
        $res["type"] = "poi";
        $res["subtype"] = "coords";
        $res["name"] = implode(", ", $coords);
        $res["location"] = null;
        $res["halt"] = $nearestHaltId;
        $res["coords"] = $coords;
        return $res;
    }

    function station_to_item($station) {
        $res = array();
        $res["id"] = $station["id"];
        $res["type"] = "station";
        $res["subtype"] = "station";
        $res["name"] = $station["name"];
        $res["location"] = $station["location"];
        $res["halt"] = $station["id"];
        $res["coords"] = $station["coords"];
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