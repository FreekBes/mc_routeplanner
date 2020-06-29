<?PHP
    error_reporting(E_ALL); ini_set('display_errors', 1);
    require_once("api/import/worlds.php");
    require_once("api/import/items.php");
?>
<!DOCTYPE html>
<html lang="nl">
    <head>
    <link rel="manifest" href="manifest.json" />
        <?PHP if (isset($_GET["f"]) && !empty($_GET["f"]) && isset($_GET["t"]) && !empty($_GET["t"])) {
            $fromItem = get_item_by_id($worldData, $_GET["f"]);
            $toItem = get_item_by_id($worldData, $_GET["t"]);
            if (count($fromItem) > 0 && count($toItem) > 0) {
                echo'<title>Route van '.$fromItem["name"].' naar '.$toItem["name"].' | Routeplanner voor '.$world["displayName"].'</title>';
            }
            else {
                echo'<title>Routeplanner voor '.$world["displayName"].'</title>';
            }
        }
        else {
            echo'<title>Routeplanner voor '.$world["displayName"].'</title>';
        }
        ?>
        <meta http-equiv="content-type" content="text/html;charset=UTF-8" />
        <script src="api/jquery.min.js"></script>
        <script src="api/titletooltipper.js"></script>
        <script><?PHP echo readfile("useful.js"); ?></script>
        <script><?PHP echo readfile("worlds.js"); ?></script>
        <script><?PHP echo readfile("planner.js"); ?></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
        <link rel="icon" type="image/ico" href="favicon.ico" />
        <meta name="theme-color" content="#1e90ff" />
        <style><?PHP echo readfile("styles.css"); ?></style>
    </head>
    <body>
        <div id="worldselector-outer">
            <select id="worldselector" title="Selecteer om een andere wereld te kiezen...">
                <option selected disabled>Routeplanner <?PHP echo $world["displayName"]; ?></option>
                <optgroup label="Of kies een andere wereld:" id="worldopts"></optgroup>
            </select><span id="fakedownarrow">&#x25BE;</span>
        </div>
        <form id="routeform">
            <table>
                <tr>
                    <th>Van:</th>
                    <td class="autocomplete"><input type="text" name="from" id="from" placeholder="Een station of locatie" autocomplete="off" autofocus="autofocus" /></td>
                </tr>
                <tr>
                    <th>Naar:</th>
                    <td class="autocomplete"><input type="text" name="to" id="to" placeholder="Een station of locatie" autocomplete="off" /></td>
                </tr>
                <tr>
                    <td></td>
                    <td><input type="submit" id="plan" value="Plan mijn reis" /></td>
                </tr>
            </table>
        </form>
        <div id="output"></div>
        <script>startInit();</script>
        <?PHP
        if (!empty($world["metroMap"])) {
            echo '<img src="'.$world["metroMap"].'?r='.mt_rand(1,299).'" id="metromap" onclick="window.open(this.src);" title="Klik om in te zoomen..." />';
        }
        ?>
        <div id="stationsoverview" style="text-align: center;"><a href="stations.php?w=<?PHP echo $w; ?>">Stationsoverzicht</a><br><br><a href="map.php">Dynamic Map</a></div>
    </body>
</html>