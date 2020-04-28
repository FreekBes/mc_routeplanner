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
		echo json_encode($data, JSON_UNESCAPED_UNICODE);
		die();
	}
	
	function returnWarning($msg) {
		global $data;
		$data["type"] = "warning";
		$data["message"] = $msg;
		$data["data"] = array();
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($data, JSON_UNESCAPED_UNICODE);
		die();
	}
	
	function returnData($msg, $stuff) {
		global $data;
		$data["type"] = "success";
		$data["message"] = $msg;
		$data["data"] = $stuff;
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode($data, JSON_UNESCAPED_UNICODE);
		die();
    }

    require_once("import/worlds.php");
    require_once("import/items.php");
    require_once("import/PoiCalculator.php");

    if (isset($_GET["i"]) && !empty($_GET["i"]) && !empty(trim($_GET["i"]))) {
        $input = strtolower(trim($_GET["i"]));
        $results = array();

        if (!isset($_GET["stations_only"])) {
            if (string_might_be_coords($_GET["i"])) {
                $inputCoords = string_to_coords($_GET["i"]);
                array_push($results, coords_to_item($inputCoords, check_for_nearest_station($inputCoords, $worldData["stations"])["id"]));
            }

            foreach ($worldData["pois"] as $poi) {
                if (strpos(strtolower($poi["name"]), $input) > -1 || (!empty($poi["location"]) && strpos(strtolower($poi["location"]), $input) > -1)) {
                    array_push($results, poi_to_item($poi, check_for_nearest_station($poi["coords"], $worldData["stations"])["id"]));
                }
            }

            // sort alphabetically
            usort($results, "compare_names");
        }

        // add stations to top of the list
        $stationResults = array();
        foreach ($worldData["stations"] as $station) {
            if (strpos(strtolower($station["name"]), $input) > -1 || (!empty($station["location"]) && strpos(strtolower($station["location"]), $input) > -1) || (!empty($station["former_name"]) && strpos(strtolower($station["former_name"]), $input) > -1)) {
                array_push($stationResults, station_to_item($station));
            }
        }
        usort($stationResults, "compare_names");
        $results = array_merge($stationResults, $results);

        returnData("Autocompletions found", $results);
    }
    else {
        returnData("No autocompletions found", array());
    }
?>