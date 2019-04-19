<?PHP

?>
<!DOCTYPE html>
<html lang="nl">
    <head>
    <link rel="manifest" href="manifest.json" />
        <title>Routeplanner voor Freeks Realm</title>
        <meta http-equiv="content-type" content="text/html;charset=UTF-8" />
        <link rel="stylesheet" href="styles.css" />
        <script src="jquery.min.js"></script>
        <script><?PHP echo readfile("useful.js"); ?></script>
        <script><?PHP echo readfile("planner.js"); ?></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
        <link rel="icon" type="image/ico" href="favicon.ico" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1e90ff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Routeplanner voor Freeks Realm" />
    </head>
    <body onload="planner.init();">
        <h1>Routeplanner voor Freeks Realm</h1>
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
        <!-- <img src="map/map.png" id="map_src" style="display: none;" onload="console.log('Map image loaded');" /> -->
    </body>
</html>