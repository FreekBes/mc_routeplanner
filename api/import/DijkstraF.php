<?PHP
    // inspiration taken from https://github.com/DonVictor/PHP-Dijkstra

    class Route {
        public $start;
        public $end;
        public $duration;
        public $line;
        public $platform;
        public $warnings;
        
        public function __construct($start, $end, $duration, $line, $platform, $warnings) {
            $this->start = $start;
            $this->end = $end;
            $this->duration = $duration;
            $this->line = $line;
            $this->platform = $platform;
            $this->warnings = $warnings;
        }
    }
    
    class Solution {
        public $distance;
        public $lines;
        public $durations;
        public $warnings;
        public $platforms;
        public $halts;

        public function __construct($distance, $lines, $durations, $warnings, $platforms, $halts) {
            $this->distance = $distance;
            $this->lines = $lines;
            $this->durations = $durations;
            $this->warnings = $warnings;
            $this->platforms = $platforms;
            $this->halts = $halts;
        }
    }

    class Graph {
        private $nodes = array();

        public function add_route($start, $end, $duration, $line, $platform, $warnings) {
            if (!isset($this->nodes[$start])) {
                $this->nodes[$start] = array();
            }
            array_push($this->nodes[$start], new Route($start, $end, $duration, $line, $platform, $warnings));
        }

        public function remove_node($index) {
            array_splice($this->nodes, $index, 1);
        }

        public function get_nodes() {
            return $this->nodes;
        }

        public function get_node($key) {
            return $this->nodes[$key];
        }

        public function calculate($start, $end = null) {
            $solutions = array();

            $solutions[$start] = new Solution(0, array(), array(), array(), array(), array());

            $loops = 0;
            while (true) {
                $parent = null;
                $nearest = null;
                $dist = 9999999999;
                $lines = null;
                $durations = null;
                $warnings = null;
                $platforms = null;
                $halts = null;

                // for each existing solution
                $solutionKeys = array_keys($solutions);
                foreach ($solutionKeys as $key) {
                    echo $solutions[$key]->distance;
                    if (empty($solutions[$key])) {
                        continue;
                    }
                    
                    $adj = $this->get_node($key);
                    $adjKeys = array_keys($adj);

                    // for each of its adjacent nodes...
                    foreach ($adjKeys as $adjKey) {
                        // without a solution already...
                        if (!empty($solutions[$adjKey])) {
                            continue;
                        }

                        // choose nearest node with lowest *total* cost
                        $d = $adj[$adjKey]->duration + $solutions[$key]->distance;
                        if ($d < $dist) {
                            $parent = $solutions[$key];
                            $nearest = $adj[$adjKey]->end;
                            $dist = $d;
                            $lines = array_merge($solutions[$key]->lines, array($adj[$adjKey]->line));
                            $durations = array_merge($solutions[$key]->durations, array($adj[$adjKey]->duration));
                            $warnings = array_merge($solutions[$key]->warnings, array($adj[$adjKey]->warnings));
                            $platforms = array_merge($solutions[$key]->platforms, array($adj[$adjKey]->platform));
                            $halts = array_merge($solutions[$key]->platforms, array($adj[$adjKey]->end));
                        }
                    }
                }

                // no more solutions
                if ($dist == INF) {
                    break;
                }

                // extend the nearest solution's path
                $solutions[$nearest] = new Solution($dist, $lines, $durations, $warnings, $platforms, $halts);
                $loops += 1;

                if ($loops > 300) {
                    break;
                }
            }

            if (!empty($end)) {
                return $solutions[$end];
            }
            else {
                return $solutions;
            }
        }
    }
?>