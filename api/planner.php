<?PHP
    error_reporting(E_ALL); ini_set('display_errors', 1);

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
    $worlds = json_decode(file_get_contents("../worlds.json"), true);

    // initialize world data
    if (isset($_GET["w"]) && array_key_exists($_GET["w"], $worlds)) {
        $w = $_GET["w"];
    }
    else {
        $w = "frn";
    }
    $world = $worlds[$w];
    $worldData = json_decode(file_get_contents("../".$world["data"]), true);

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
                $graph->add_route($lastHalt["halt"], $thisHalt["halt"], $lastHalt["time_forth"], $lineName, $lastHalt["platform_forth"], $lastHalt["warnings_forth"]);
                $graph->add_route($thisHalt["halt"], $lastHalt["halt"], $thisHalt["time_back"], $lineName, $thisHalt["platform_back"], $thisHalt["warnings_back"]);
            }
            $lastHalt = $worldData["routes"][$i]["halts"][$j];
        }
    }

    returnData("A", $graph->get_nodes())
?>