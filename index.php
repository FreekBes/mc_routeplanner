<?PHP
    error_reporting(E_ALL); ini_set('display_errors', 1);
    require_once("api/import/worlds.php");
?>
<!DOCTYPE html>
<html lang="nl">
    <head>
    <link rel="manifest" href="manifest.json" />
        <title>Routeplanner voor <?PHP echo $world["displayName"]; ?></title>
        <meta http-equiv="content-type" content="text/html;charset=UTF-8" />
        <script src="jquery.min.js"></script>
        <script><?PHP echo readfile("useful.js"); ?></script>
        <script><?PHP echo readfile("worlds.js"); ?></script>
        <script><?PHP echo readfile("planner.js"); ?></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
        <link rel="icon" type="image/ico" href="favicon.ico" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1e90ff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Routeplanner voor <?PHP echo $world["displayName"]; ?>" />
        <style><?PHP echo readfile("styles.css"); ?></style>
    </head>
    <body onload="startInit();">
        <div id="worldselector-outer">
            <select id="worldselector" title="Selecteer om een andere wereld te kiezen...">
                <option selected disabled>Routeplanner <?PHP echo $world["displayName"]; ?></option>
                <optgroup label="Of kies een andere wereld:" id="worldopts"></optgroup>
            </select><span id="fakedownarrow">&#x25BE;</span>
        </div>
        <form id="routeform">
            <table>
                <tr>
                    <th>Van</th>
                    <td class="autocomplete"><input type="text" name="from" id="from" placeholder="Een station of locatie" autocomplete="off" autofocus="autofocus" /></td>
                </tr>
                <tr>
                    <th>Naar</th>
                    <td class="autocomplete"><input type="text" name="to" id="to" placeholder="Een station of locatie" autocomplete="off" /></td>
                </tr>
                <tr>
                    <td></td>
                    <td><input type="submit" id="plan" value="Plan mijn reis" /></td>
                </tr>
            </table>
        </form>
        <div id="output"></div>
        <?PHP
        if (!empty($world["metroMap"])) {
            echo '<img src="'.$world["metroMap"].'?r='.mt_rand(1,299).'" id="metromap" onclick="window.open(this.src);" title="Klik om in te zoomen..." />';
        }
        ?>
    </body>
</html>