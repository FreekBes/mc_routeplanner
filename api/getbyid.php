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

    if (isset($_GET["id"]) && !empty($_GET["id"]) && !empty(trim($_GET["id"]))) {
		if (strpos($_GET["id"], ",") != false) {
			$result = coords_to_item(explode(",", $_GET["id"]), check_for_nearest_station(explode(",", $_GET["id"]), $worldData["stations"])["id"]);
		}
		else {
			$result = get_item_by_id($worldData, $_GET["id"]);
		}

        if (count($result) > 0) {
            returnData("Item found", $result);
        }
        else {
            returnData("No item found", null);
        }
    }
    else {
        returnError("GET id not set");
    }
?>