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
		echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
		die();
	}
	
	function returnWarning($msg) {
		global $data;
		$data["type"] = "warning";
		$data["message"] = $msg;
		$data["data"] = array();
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
		die();
	}
	
	function returnData($msg, $stuff) {
		global $data;
		$data["type"] = "success";
		$data["message"] = $msg;
		$data["data"] = $stuff;
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
		die();
    }

    require_once("import/DijkstraF.php");
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
                $route = $graph->calculate($_GET["from"], $_GET["to"]);
                $stuff = array();
                $stuff["route"] = $route;
                $stuff["items"] = array();
                foreach($route->halts as $halt) {
                    $stuff["items"][$halt] = station_to_item(get_object_by_id($worldData["stations"], $halt));
                }
                returnData("Route from ".$_GET["from"]." to ".$_GET["to"]." retrieved", $stuff);
            }
            else {
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