<?PHP
    // error_reporting(E_ALL); ini_set('display_errors', 1);

    header('Content-Type: text/html; charset=utf-8');
	header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
	header("Cache-Control: post-check=0, pre-check=0", false);
	header("Pragma: no-cache");

    $data = array();
	$data["type"] = "error";
	$data["message"] = "Onbekende error";
	$data["data"] = array();
	
	function returnError($msg) {
		global $data;
		$data["type"] = "error";
		$data["message"] = $msg;
		$data["data"] = array();
        header('Content-Type: application/json; charset=utf-8');
        if (isset($_GET["pretty"])) {
            echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
        }
		else {
            echo json_encode($data, JSON_UNESCAPED_UNICODE);
        }
		die();
	}
	
	function returnWarning($msg) {
		global $data;
		$data["type"] = "warning";
		$data["message"] = $msg;
		$data["data"] = array();
		header('Content-Type: application/json; charset=utf-8');
		if (isset($_GET["pretty"])) {
            echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
        }
		else {
            echo json_encode($data, JSON_UNESCAPED_UNICODE);
        }
		die();
	}
	
	function returnData($msg, $stuff) {
		global $data;
		$data["type"] = "success";
		$data["message"] = $msg;
		$data["data"] = $stuff;
		header('Content-Type: application/json; charset=utf-8');
		if (isset($_GET["pretty"])) {
            echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
        }
		else {
            echo json_encode($data, JSON_UNESCAPED_UNICODE);
        }
		die();
    }

    require_once("import/DijkstraF.php");
    require_once("import/PoiCalculator.php");
    require_once("import/worlds.php");
    require_once("import/items.php");

    // initialize routes
    $graph = new Graph();
    
    $routeCount = count($worldData["routes"]);
    for ($i = 0; $i < $routeCount; $i++) {
        $lineName = $worldData["routes"][$i]["line_name"];
        $lastHalt = null;
        $haltCount = count($worldData["routes"][$i]["halts"]);
        for ($j = 0; $j < $haltCount; $j++) {
            if ($j > 0) {
                $thisHalt = $worldData["routes"][$i]["halts"][$j];
                $graph->add_route($lastHalt["halt"], $thisHalt["halt"], $lastHalt["time_forth"], $lineName, $lastHalt["platform_forth"], $thisHalt["platform_forth"], $lastHalt["warnings_forth"]);
                $graph->add_route($thisHalt["halt"], $lastHalt["halt"], $thisHalt["time_back"], $lineName, $thisHalt["platform_back"], $lastHalt["platform_back"], $thisHalt["warnings_back"]);
            }
            $lastHalt = $worldData["routes"][$i]["halts"][$j];
        }
    }

    if (isset($_GET["from"])) {
        try {
            if (isset($_GET["to"])) {
                if ($_GET["to"] == $_GET["from"]) {
                    returnError("Beginlocatie kan niet hetzelfde zijn als eindlocatie!");
                }

                $stuff = array();
                $stuff["items"] = array();
                $stuff["line_data"] = array();
                
                $fromNoStation = false;
                $fromStation = $_GET["from"];
                $fromWalking = false;
                $fromWalkingStart = null;
                $fromWalkingEnd = null;
                if (strlen($_GET["from"]) > 4) {
                    // from is not a station, but a poi
                    $fromNoStation = true;
                    $coords = [];
                    foreach ($worldData["pois"] as $poi) {
                        if ($poi["id"] == $_GET["from"]) {
                            $coords = $poi["coords"];
                            $fromWalkingStart = $poi["id"];
                            $stuff["items"][$poi["id"]] = poi_to_item($poi);
                            break;
                        }
                    }

                    if (count($coords) > 0) {
                        $station = check_for_nearest_station($coords, $worldData["stations"]);
                        $fromStation = $station["id"];
                        $fromWalkingEnd = $station["id"];
                        $fromWalking = true;
                    }
                    else {
                        returnError("Beginlocatie niet gevonden");
                    }
                }

                $toNoStation = false;
                $toStation = $_GET["to"];
                $toWalking = false;
                $toWalkingStart = null;
                $toWalkingEnd = null;
                if (strlen($_GET["to"]) > 4) {
                    // to is not a station, but a poi
                    $toNoStation = true;
                    $coords = [];
                    foreach ($worldData["pois"] as $poi) {
                        if ($poi["id"] == $_GET["to"]) {
                            $coords = $poi["coords"];
                            $toWalkingEnd = $poi["id"];
                            $stuff["items"][$poi["id"]] = poi_to_item($poi);
                            break;
                        }
                    }

                    if (count($coords) > 0) {
                        $station = check_for_nearest_station($coords, $worldData["stations"]);
                        $toStation = $station["id"];
                        $toWalkingStart = $station["id"];
                        $toWalking = true;
                    }
                    else {
                        returnError("Eindlocatie niet gevonden");
                    }
                }

                $doCalculateRoute = true;
                if ($fromNoStation && $toNoStation) {
                    if (points_are_walkable($stuff["items"][$fromWalkingStart]["coords"], $stuff["items"][$toWalkingEnd]["coords"], $worldData["stations"])) {
                        // from and to are within walkable distance or the same station is closest by for both pois
                        // do not calculate a route using public transport, just walk
                        $doCalculateRoute = false;
                    }
                }

                if ($doCalculateRoute) {
                    $route = $graph->calculate($fromStation, $toStation);
                    foreach($route->halts as $halt) {
                        $stuff["items"][$halt] = station_to_item(get_object_by_id($worldData["stations"], $halt));
                    }
                    foreach($route->lines as $line) {
                        $stuff["line_data"][$line] = get_object_by($worldData["routes"], "line_name", $line);
                        unset($stuff["line_data"][$line]["halts"]);
                    }
                }
                else {
                    $route = null;
                    $fromWalkingEnd = $toWalkingEnd;
                    $toWalking = false;
                    $toWalkingStart = null;
                    $toWalkingEnd = null;
                }

                $stuff["route"] = $route;
                $stuff["walking"] = array();
                $stuff["walking"]["from"] = array();
                $stuff["walking"]["from"]["required"] = $fromWalking;
                $stuff["walking"]["from"]["start"] = $fromWalkingStart;
                $stuff["walking"]["from"]["end"] = $fromWalkingEnd;
                $stuff["walking"]["to"] = array();
                $stuff["walking"]["to"]["required"] = $toWalking;
                $stuff["walking"]["to"]["start"] = $toWalkingStart;
                $stuff["walking"]["to"]["end"] = $toWalkingEnd;
                returnData("Route from ".$_GET["from"]." to ".$_GET["to"]." retrieved", $stuff);
            }
            else {
                // check if from is a station id (always 3 or 4 characters in length)
                if (strlen($_GET["from"]) <= 4) {
                    $routes = $graph->calculate($_GET["from"]);
                    $stuff = array();
                    $stuff["routes"] = $routes;
                    $stuff["items"] = array();
                    $allStationIds = array_keys($routes);
                    foreach($allStationIds as $stationId) {
                        $stuff["items"][$stationId] = station_to_item(get_object_by_id($worldData["stations"], $stationId));
                    }
                    returnData("All possible routes from ".$_GET["from"]." retrieved", $stuff);
                }
                else {
                    returnError("Zonder eindlocatie kunnen alleen routes vanaf stations worden berekend.");
                }
            }
        }
        catch (Exception $e) {
            returnError($e->getMessage());
        }
    }
    else {
        returnError("GET from not set");
    }

    // returnData("A", $graph->get_nodes());
    returnData("A", $graph->calculate("Tcs"));
?>