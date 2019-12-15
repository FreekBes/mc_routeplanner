<?PHP
    // this library calculates distances from coordinates to the nearest stations and such

    function calculate_distance($fromCoords, $toCoords) {
        $a = $fromCoords[0] - $toCoords[0];
        $b = $fromCoords[2] - $toCoords[2];
        return round(sqrt($a * $a + $b * $b));
    }

    function check_for_nearest_station($coords, $stations) {
        $nearest = null;
        $nearestDistance = null;

        foreach ($stations as $station) {
            $distance = calculate_distance($coords, $station["coords"]);
            if ($distance < $nearestDistance || is_null($nearestDistance)) {
                $nearest = $station;
            }
        }

        return $nearest;
    }

    function points_are_walkable($fromCoords, $toCoords, $stations) {
        $distance = calculate_distance($fromCoords, $toCoords);
        if ($distance < 170) {
            // walkable: it's under 170 blocks (30 seconds running)!
            return true;
        }
        else {
            $nearestStationFrom = check_for_nearest_station($fromCoords, $stations);
            $nearestStationTo = check_for_nearest_station($toCoords, $stations);
            if ($nearestStationFrom["id"] === $nearestStationTo["id"]) {
                // walkable: the same station is the closest one to both coordinates,
                // meaning there is no faster way to travel than walking
                return true;
            }
            else {
                // a railway connection might be faster than walking
                return false;
            }
        }
    }
?>