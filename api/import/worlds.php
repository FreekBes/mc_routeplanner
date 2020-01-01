<?PHP
    $worlds = json_decode(file_get_contents(dirname(__FILE__)."/../../worlds.json"), true);

    // initialize world data
    if (isset($_GET["w"]) && array_key_exists($_GET["w"], $worlds)) {
        $w = $_GET["w"];
    }
    else {
        $w = "frn";
    }
    $world = $worlds[$w];
    $worldData = json_decode(file_get_contents(dirname(__FILE__)."/../../".$world["data"]), true);
?>