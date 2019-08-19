<?PHP
set_time_limit(0);

if (isset($_GET["debug"])) {
    error_reporting(E_ALL); ini_set('display_errors', 1);
}

function getDifference($a, $b) {
    return abs($a - $b);
}

function getMiddlePoint($firstPos, $secPos) {
    $diffX = getDifference($firstPos[0], $secPos[0]);
    $diffY = getDifference($firstPos[1], $secPos[1]);
    $lowestX = min($firstPos[0], $secPos[0]);
    $lowestY = min($firstPos[1], $secPos[1]);
    return [$lowestX + $diffX * 0.5, $lowestY + $diffY * 0.5];
}

function drawArrow($image, $fromx, $fromy, $tox, $toy, $color, $headlen = 8) {
    $angle = atan2($toy-$fromy, $tox-$fromx);

    $points = array(
        $tox, $toy,
        $tox - $headlen * cos($angle - pi() / 7), $toy - $headlen * sin($angle - pi() / 7),
        $tox - $headlen * cos($angle + pi() / 7), $toy - $headlen * sin($angle + pi() / 7),
    );
    imagefilledpolygon($image, $points, 3, $color);
    imagepolygon($image, $points, 3, $color);

    $middlePoint = getMiddlePoint([$points[2], $points[3]], [$points[4], $points[5]]);
    $tox = $middlePoint[0];
    $toy = $middlePoint[1];
    if ($tox != $fromx && $toy != $fromy) {
        $k = ($toy - $fromy) / ($tox - $fromx);
    }
    else {
        $k = $headlen;
    }
    $a = ($headlen * 0.1) / sqrt(1 + pow($k, 2));
    $linePoints = array(
        round($fromx - (1+$k)*$a), round($fromy + (1-$k)*$a),
        round($fromx - (1-$k)*$a), round($fromy - (1+$k)*$a),
        round($tox + (1+$k)*$a), round($toy - (1-$k)*$a),
        round($tox + (1-$k)*$a), round($toy + (1+$k)*$a)
    );
    imagefilledpolygon($image, $linePoints, 4, $color);
    return imagepolygon($image, $linePoints, 4, $color);
}

header('Access-Control-Allow-Origin: *'); 
header('Pragma: public');
header('Content-Type: image/png');

// expire cached image in 7 days
header('Cache-Control: max-age=604800, public');
header('Expires: '. gmdate('D, d M Y H:i:s \G\M\T', time() + 604800));

$mapDate = "2019-08-19";
$mapSource = "map/map-".$mapDate.".png";

$minWorldX = -3264;
$maxWorldX = 4320 + 15;
$minWorldY = -4528;
$maxWorldY = 5792 + 15;
$mapWidth = -$minWorldX + $maxWorldX;
$mapHeight = -$minWorldY + $maxWorldY;

if (!isset($_GET["start"]) || !isset($_GET["end"])) {
    // http_response_code(400);
    header("Location: ".$mapSource);
    die();
}
else {
    $start = explode(",", $_GET["start"]);
    $start[0] = intval($start[0]);
    $start[1] = intval($start[1]);
    $start[2] = intval($start[2]);
    $end = explode(",", $_GET["end"]);
    $end[0] = intval($end[0]);
    $end[1] = intval($end[1]);
    $end[2] = intval($end[2]);
}

if (isset($_GET["debug"])) {
    header('Content-Type: text/html');
    echo implode(",", $start) . "<br>";
    echo implode(",", $end) . "<br>";
}

if (!isset($_GET["size"])) {
    $mapWidth = 300;
}
else {
    $mapWidth = intval($_GET["size"]);
    if ($mapWidth < 100) {
        $mapWidth = 100;
    }
    else if ($mapWidth > 2000) {
        $mapWidth = 2000;
    }
}

$topLeftCorner = array();
$topLeftCorner[0] = getDifference($minWorldX, ($start[0] < $end[0] ? $start[0] : $end[0])) - 14;
$topLeftCorner[1] = getDifference($minWorldY, ($start[2] < $end[2] ? $start[2] : $end[2])) - 14;

$bottomRightCorner = array();
$bottomRightCorner[0] = getDifference($minWorldX, ($start[0] > $end[0] ? $start[0] : $end[0])) + 28;
$bottomRightCorner[1] = getDifference($minWorldY, ($start[2] > $end[2] ? $start[2] : $end[2])) + 28;

$zoomedMapWidth = $bottomRightCorner[0] - $topLeftCorner[0];
$zoomedMapHeight = $bottomRightCorner[1] - $topLeftCorner[1];
$w = 0;

if (isset($_GET["debug"])) {
    echo "topLeftCorner: " . $topLeftCorner[0] . "," . $topLeftCorner[1] . "<br>";
    echo "bottomRightCorner: " . $bottomRightCorner[0] . "," . $bottomRightCorner[1] . "<br>";
}

if ($zoomedMapHeight > $zoomedMapWidth) {
    $w = $zoomedMapHeight;
    $topLeftCorner[0] = $topLeftCorner[0] - round(($zoomedMapHeight - $zoomedMapWidth) * 0.5) - 7;
}
else {
    $w = $zoomedMapWidth;
    $topLeftCorner[1] = $topLeftCorner[1] - round(($zoomedMapWidth - $zoomedMapHeight) * 0.5) - 7;
}

$resizedBy = $mapWidth / $w;

if (isset($_GET["debug"])) {
    echo "zoomed size: " . $w . "<br>";
    echo "canvas size: " . $mapWidth . "<br>";
    echo "resize by: " . $resizedBy . "<br>";
}

$drawer = imagecreatetruecolor($mapWidth, $mapWidth);

// draw map
$mapImage = imagecreatefrompng($mapSource);
if (!$mapImage) {
    echo "memory peak usage: " . memory_get_peak_usage() . " bytes";
    http_response_code(503);
    die();
}
$success = imagecopyresized($drawer, $mapImage, 0, 0, $topLeftCorner[0], $topLeftCorner[1], $mapWidth, $mapWidth, $w, $w);
imagedestroy($mapImage);
if (!$success) {
    echo "memory peak usage: " . memory_get_peak_usage() . " bytes";
    http_response_code(500);
    die();
}

// create arrow overlay
$arrowOverlay = imagecreatetruecolor($mapWidth, $mapWidth);
$transparent = imagecolorallocatealpha($arrowOverlay, 0, 0, 0, 127);
$arrowColor = imagecolorallocate($arrowOverlay, 255, 0, 0);
imagefill($arrowOverlay, 0, 0, $transparent);
$newStartingX = -1 * ($topLeftCorner[0] - getDifference($minWorldX, $start[0] + 0.5)) * $resizedBy;
$newStartingY = -1 * ($topLeftCorner[1] - getDifference($minWorldY, $start[2] + 0.5)) * $resizedBy;
$newEndingX = -1 * ($topLeftCorner[0] - getDifference($minWorldX, $end[0] + 0.5)) * $resizedBy;
$newEndingY = -1 * ($topLeftCorner[1] - getDifference($minWorldY, $end[2] + 0.5)) * $resizedBy;
if (isset($_GET["debug"])) {
    echo "newStartingX: " . $newStartingX . "<br>";
    echo "newStartingY: " . $newStartingY . "<br>";
    echo "newEndingX: " . $newEndingX . "<br>";
    echo "newEndingY: " . $newEndingY . "<br>";
}
// imageline($arrowOverlay, $newStartingX, $newStartingY, $newEndingX, $newEndingY, $arrowColor);
drawArrow($arrowOverlay, $newStartingX, $newStartingY, $newEndingX, $newEndingY, $arrowColor, round($mapWidth * 0.08));

$arrowOverlaySuccess = imagecopyresized($drawer, $arrowOverlay, 0, 0, 0, 0, $mapWidth, $mapWidth, $mapWidth, $mapWidth);
imagedestroy($arrowOverlay);

// create text overlay
$overlaySize = 450;
$textOverlay = imagecreatetruecolor($overlaySize, $overlaySize);
$textColor = imagecolorallocate($textOverlay, 255, 255, 255);
$transparent = imagecolorallocatealpha($textOverlay, 0, 0, 0, 127);
$semiTransparent = imagecolorallocatealpha($textOverlay, 0, 0, 0, 64);
imagefill($textOverlay, 0, 0, $transparent);
$textSize = 5;
$text = "Kaart van ".$mapDate;
$length = strlen($text);
$tw = $length * imagefontwidth($textSize);
$th = imagefontheight($textSize);
imagefilledrectangle($textOverlay, $overlaySize-$tw-6, $overlaySize-$th-6, $overlaySize, $overlaySize, $semiTransparent);
imagerectangle($textOverlay, $overlaySize-$tw-6, $overlaySize-$th-6, $overlaySize+1, $overlaySize+1, $semiTransparent);
imagestring($textOverlay, 5, $overlaySize-$tw-3, $overlaySize-$th-3, $text, $textColor);
$overlaySuccess = imagecopyresampled($drawer, $textOverlay, 0, 0, 0, 0, $mapWidth, $mapWidth, $overlaySize, $overlaySize);
imagedestroy($textOverlay);

if (!isset($_GET["debug"])) {
    // output image
    imagepng($drawer);
    imagedestroy($drawer);
}
else {
    echo "memory peak usage: " . memory_get_peak_usage() . "bytes";
}
?>