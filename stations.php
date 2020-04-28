<?PHP
    error_reporting(E_ALL); ini_set('display_errors', 1);
    require_once("api/import/worlds.php");
    require_once("api/import/items.php");
?>
<!DOCTYPE html>
<html lang="nl">
    <head>
    <link rel="manifest" href="manifest.json" />
        <title>Stationsoverzicht voor <?PHP echo $world["displayName"]; ?></title>
        <meta http-equiv="content-type" content="text/html;charset=UTF-8" />
        <script src="api/jquery.min.js"></script>
        <script src="api/titletooltipper.js"></script>
        <script><?PHP echo readfile("useful.js"); ?></script>
        <script><?PHP echo readfile("planner.js"); ?></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
        <link rel="icon" type="image/ico" href="favicon.ico" />
        <meta name="theme-color" content="#1e90ff" />
        <style><?PHP echo readfile("styles.css"); ?></style>
    </head>
    <body style="user-select: unset; margin: 0px;">
        <div id="content-container">
            <h1>Stationsoverzicht</h1>
            <?PHP
                usort($worldData["stations"], "compare_names");
                foreach ($worldData["stations"] as $station) {
                    $station["lines"] = array();
                    $station["connections"] = array();
                    $station["platform_data"] = array();
                    $station["unknown_platform_data"] = array();
                    array_fill(0, $station["platforms"], null);
                    foreach ($worldData["routes"] as $route) {
                        $amountOfHalts = count($route["halts"]);
                        $hn = 0;
                        foreach ($route["halts"] as $halt) {
                            if ($halt["halt"] === $station["id"]) {
                                if (!in_array($route["line_name"], $station["lines"])) {
                                    array_push($station["lines"], $route["line_name"]);
                                }

                                $haltData = array();
                                $haltData["shared_platform"] = false;
                                $haltData["line_name"] = $route["line_name"];
                                $haltData["line_type"] = $route["type"];
                                $haltData["line_operator"] = $route["operator"];
                                if ($hn+1 != $amountOfHalts) {
                                    $haltData["direction"] = array();
                                    for ($cs = $hn+1; $cs < count($route["halts"]); $cs++) {
                                        array_push($haltData["direction"], $route["halts"][$cs]["halt"]);
                                        array_push($station["connections"], $route["halts"][$cs]["halt"]);
                                    }
                                }
                                else {
                                    $haltData["direction"] = array();
                                }

                                if ($halt["platform_back"] != $halt["platform_forth"] || $halt["platform_back"] <= 0) {
                                    if ($halt["platform_forth"] > 0) {
                                        $station["platform_data"][$halt["platform_forth"]-1] = $haltData;
                                    }
                                    else {
                                        array_push($station["unknown_platform_data"], $haltData);
                                    }

                                    $haltData = array();
                                    $haltData["shared_platform"] = false;
                                    $haltData["line_name"] = $route["line_name"];
                                    $haltData["line_type"] = $route["type"];
                                    $haltData["line_operator"] = $route["operator"];
                                    if ($hn-1 > -1) {
                                        $haltData["direction"] = array();
                                        for ($cs = $hn-1; $cs > -1; $cs--) {
                                            array_push($haltData["direction"], $route["halts"][$cs]["halt"]);
                                            array_push($station["connections"], $route["halts"][$cs]["halt"]);
                                        }
                                    }
                                    else {
                                        $haltData["direction"] = array();
                                    }
                                    if ($halt["platform_back"] > 0) {
                                        $station["platform_data"][$halt["platform_back"]-1] = $haltData;
                                    }
                                    else {
                                        array_push($station["unknown_platform_data"], $haltData);
                                    }
                                }
                                else if ($hn-1 > -1) {
                                    // shared platform or single platform
                                    // check if shared platform... (not at start or end of a line)
                                    if ($hn > 1 && $hn != count($route["halts"])) {
                                        $haltData["shared_platform"] = true;
                                    }
                                    $haltData["direction"] = array();
                                    for ($cs = 0; $cs < count($route["halts"]); $cs++) {
                                        if ($route["halts"][$cs]["halt"] != $halt["halt"]) {
                                            array_push($haltData["direction"], $route["halts"][$cs]["halt"]);
                                            array_push($station["connections"], $route["halts"][$cs]["halt"]);
                                        }
                                        else if ($haltData["shared_platform"]) {
                                            // insert special keyword "current_station" for the current station
                                            // later on, this gets replaced with the current station in cursive
                                            array_push($haltData["direction"], "current_station");
                                        }
                                    }
                                    /*
                                    for ($cs = $hn-1; $cs > -1; $cs--) {
                                        array_push($haltData["direction"], $route["halts"][$cs]["halt"]);
                                        array_push($station["connections"], $route["halts"][$cs]["halt"]);
                                    }
                                    for ($cs = $hn+1; $cs < count($route["halts"]); $cs++) {
                                        array_push($haltData["direction"], $route["halts"][$cs]["halt"]);
                                        array_push($station["connections"], $route["halts"][$cs]["halt"]);
                                    }
                                    */

                                    if ($halt["platform_forth"] > 0) {
                                        $station["platform_data"][$halt["platform_forth"]-1] = $haltData;
                                    }
                                    else {
                                        array_push($station["unknown_platform_data"], $haltData);
                                    }
                                }
                                else {
                                    if ($halt["platform_forth"] > 0) {
                                        $station["platform_data"][$halt["platform_forth"]-1] = $haltData;
                                    }
                                    else {
                                        array_push($station["unknown_platform_data"], $haltData);
                                    }
                                }
                            }
                            $hn += 1;
                        }
                    }
                    $station["connections"] = array_unique($station["connections"]);
                    $station["connections"] = array_diff($station["connections"], array($station["id"]));
                    ?>
                    <div class="station" id="<?PHP echo strtolower($station["id"]); ?>">
                        <h3><a href="/routeplanner/?w=<?PHP echo $w; ?>&t=<?PHP echo $station["id"]; ?>"><?PHP echo $station["name"]; ?></a><?PHP if (!empty($station["location"]) && strpos(strtolower($station["name"]), strtolower($station["location"])) === false) { ?> <small style="font-size: small; font-weight: normal; margin-top: -4px;">(<?PHP echo $station["location"]; ?>)</small><?PHP } ?></h3>
                        <ul class="station-overview-list">
                            <li>Stationsgebouw: <i><?PHP echo ($station["building"] ? "ja" : "nee" ); ?></i></li>
                            <li>Overdekt perron: <i><?PHP echo ($station["roofed"] ? "ja (kan gedeeltelijk zijn)" : "nee" ); ?></i></li>
                            <li>Ondergronds: <i><?PHP echo ($station["underground"] ? "ja (kan gedeeltelijk zijn)" : "nee" ); ?></i></li>
                            <li>Jaar van opening: <i><?PHP echo ($station["opened"] > 0 ? $station["opened"] : "onbekend" ); ?></i></li>
                            <?PHP if (!empty($station["former_name"])) { ?><li>Voormalige naam: <i><?PHP echo $station["former_name"]; ?></i></li><?PHP } ?>
                            <li>Aantal sporen: <i><?PHP echo $station["platforms"]; ?></i></li>
                            <li>Lijnen: <i><?PHP echo implode(", ", $station["lines"]); ?></i></li>
                            <li>Directe verbindingen: <i><?PHP echo count($station["connections"]); ?></i></li></li>
                        </ul>
                        <h4>Spooroverzicht</h4>
                        <table class="station-overview-platforms">
                            <tbody>
                                <?PHP
                                    for ($pn = 0; $pn < $station["platforms"]; $pn++) {
                                        ?>
                                        <tr>
                                            <th>spoor <?PHP echo $pn+1 . ((!empty($station["platform_data"][$pn]) && $station["platform_data"][$pn]["shared_platform"]) ? "<br><small> (<i>verdeeld</i>)</small>" : ""); ?></th>
                                            <?PHP if (!empty($station["platform_data"][$pn])) { ?>
                                                <td class="line_details"><?PHP echo "<span>".$station["platform_data"][$pn]["line_operator"]."</span> <b>".$station["platform_data"][$pn]["line_name"]."</b>"; ?></td>
                                                <td class="line_direction">
                                                    <?PHP
                                                        if (count($station["platform_data"][$pn]["direction"]) > 0) {
                                                            for ($hn = 0; $hn < count($station["platform_data"][$pn]["direction"]); $hn++) {
                                                                if ($station["platform_data"][$pn]["direction"][$hn] != "current_station") {
                                                                    $station["platform_data"][$pn]["direction"][$hn] = '<a href="#'.strtolower($station["platform_data"][$pn]["direction"][$hn]).'">'.get_item_by_id($worldData, $station["platform_data"][$pn]["direction"][$hn])["name"].'</a>';
                                                                }
                                                                else {
                                                                    $station["platform_data"][$pn]["direction"][$hn] = '<small><i>'.$station["name"].'</i></small>';
                                                                }
                                                            }
                                                            echo implode(", ", $station["platform_data"][$pn]["direction"]);
                                                        }
                                                        else {
                                                            echo "<i>lijn eindigt hier</i>";
                                                        }
                                                    ?>
                                                </td>
                                            <?PHP } else { ?>
                                                <td class="line_details"></td>
                                                <td class="line_direction"></td>
                                            <?PHP } ?>
                                        </tr>
                                        <?PHP
                                    }
                                    for ($pn = 0; $pn < count($station["unknown_platform_data"]); $pn++) {
                                        ?>
                                        <tr>
                                            <th>onbekend</th>
                                            <td class="line_details"><?PHP echo "<span>".$station["unknown_platform_data"][$pn]["line_operator"]."</span> <b>".$station["unknown_platform_data"][$pn]["line_name"]."</b>"; ?></td>
                                            <td class="line_direction">
                                                <?PHP
                                                    if (count($station["unknown_platform_data"][$pn]["direction"]) > 0) {
                                                        for ($hn = 0; $hn < count($station["unknown_platform_data"][$pn]["direction"]); $hn++) {
                                                            $station["unknown_platform_data"][$pn]["direction"][$hn] = '<a href="#'.strtolower($station["unknown_platform_data"][$pn]["direction"][$hn]).'">'.get_item_by_id($worldData, $station["unknown_platform_data"][$pn]["direction"][$hn])["name"].'</a>';
                                                        }
                                                        echo implode(", ", $station["unknown_platform_data"][$pn]["direction"]);
                                                    }
                                                    else {
                                                        echo "<i>lijn eindigt hier</i>";
                                                    }
                                                ?>
                                            </td>
                                        </tr>
                                        <?PHP
                                    }
                                ?>
                            </tbody>
                        </table>
                        <h4>Voorzieningen</h4>
                        <?PHP if (isset($station["services"])) { ?>
                        <table class="station-overview-platforms">
                            <tbody>
                                <?PHP
                                    for ($sn = 0; $sn < count($station["services"]); $sn++) {
                                        if (strpos($station["services"][$sn], "nopoi-") === false) {
                                            $station["services"][$sn] = get_item_by_id($worldData, $station["services"][$sn]);
                                            ?>
                                            <tr>
                                                <th class="station-overview-services-type"><?PHP echo $station["services"][$sn]["subtype"]; ?></th>
                                                <td style="font-weight: bold;"><?PHP echo $station["services"][$sn]["name"]; ?></td>
                                            </tr>
                                            <?PHP
                                        }
                                        else {
                                            switch ($station["services"][$sn]) {
                                                case "nopoi-minecart":
                                                    $station["services"][$sn] = array();
                                                    $station["services"][$sn]["subtype"] = '<img src="icons/station.png" /><i>stationsgemak</i>';
                                                    $station["services"][$sn]["name"] = "Gratis Minecart Service";
                                                    break;
                                                case "nopoi-waitingroom":
                                                    $station["services"][$sn] = array();
                                                    $station["services"][$sn]["subtype"] = '<img src="icons/station.png" /><i>stationsgemak</i>';
                                                    $station["services"][$sn]["name"] = "Wachtruimte";
                                                    break;
                                                case "nopoi-map":
                                                    $station["services"][$sn] = array();
                                                    $station["services"][$sn]["subtype"] = '<img src="icons/station.png" /><i>stationsgemak</i>';
                                                    $station["services"][$sn]["name"] = "Kaart van omgeving";
                                                    break;
                                                default:
                                                    continue;
                                            }
                                            ?>
                                            <tr>
                                                <th class="station-overview-services-type do-not-change"><?PHP echo $station["services"][$sn]["subtype"]; ?></th>
                                                <td style="font-weight: bold;"><?PHP echo $station["services"][$sn]["name"]; ?></td>
                                            </tr>
                                            <?PHP
                                        }
                                    }
                                ?>
                            </tbody>
                        </table>
                        <?PHP } else { ?>
                        <div><i>Op dit station zijn geen voorzieningen te vinden.</i></div>
                        <?PHP } ?>
                        <h4>Uitgangen</h4>
                        <table class="station-overview-platforms">
                            <tbody>
                                <?PHP
                                    if (isset($station["exits"])) {
                                        for ($en = 0; $en < count($station["exits"]); $en++) {
                                            ?>
                                            <tr>
                                                <th><?PHP echo $station["exits"][$en]["name"]; ?></th>
                                                <td><a href="/routeplanner/?w=<?PHP echo $w; ?>&t=<?PHP echo implode("%2C", $station["exits"][$en]["coords"]); ?>"><?PHP echo implode(", ", $station["exits"][$en]["coords"]); ?></a></td>
                                            </tr>
                                            <?PHP
                                        }
                                    }
                                    else {
                                        ?>
                                        <tr>
                                            <th>Hoofdingang</th>
                                            <td><a href="/routeplanner/?w=<?PHP echo $w; ?>&t=<?PHP echo implode("%2C", $station["coords"]); ?>"><?PHP echo implode(", ", $station["coords"]); ?></a></td>
                                        </tr>
                                        <?PHP
                                    }
                                ?>
                            </tbody>
                        </table>
                    </div>
                    <?PHP
                }
            ?>
            <script>
            var serviceTypeCells = document.getElementsByClassName("station-overview-services-type");
            var serviceTypeInfo = ["icons/place.png", "Overig"];
            for (var i = 0; i < serviceTypeCells.length; i++) {
                if (serviceTypeCells[i].className.indexOf("do-not-change") == -1) {
                    serviceTypeInfo = planner.getItemIconAndName(serviceTypeCells[i].innerText);
                    serviceTypeCells[i].innerHTML = '<img src="'+serviceTypeInfo[0]+'" /><i>'+serviceTypeInfo[1]+'</i>';
                }
            }
            </script>
        </div>
    </body>
</html>