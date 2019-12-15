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
            if (array_key_exists($key, $this->nodes)) {
                return $this->nodes[$key];
            }
            else {
                return null;
            }
        }

        public function calculate($start, $end = null) {
            if (!array_key_exists($start, $this->nodes)) {
                throw new Exception("Start station not found");
            }
            if (!empty($end) && !array_key_exists($end, $this->nodes)) {
                throw new Exception("End station not found");
            }

            $solutions = array();
            $solutions[$start] = new Solution(0, array(), array(), array(), array(), array());

            $loops = 0;
            while (true) {
                $parent = null;
                $nearest = null;
                $dist = null;
                $lines = null;
                $durations = null;
                $warnings = null;
                $platforms = null;
                $halts = null;

                // for each existing solution
                $solutionKeys = array_keys($solutions);
                foreach ($solutionKeys as $key) {
                    if (empty($solutions[$key])) {
                        continue;
                    }
                    
                    $adj = $this->get_node($key);
                    $adjKeys = array_keys($adj);

                    // for each of its adjacent nodes...
                    foreach ($adjKeys as $adjKey) {
                        // without a solution already...
                        if (!empty($solutions[$adj[$adjKey]->end])) {
                            continue;
                        }

                        // choose nearest node with lowest *total* cost
                        if (count($solutions[$key]->lines) > 0 && $adj[$adjKey]->line != end($solutions[$key]->lines)) {
                            // last line doesn't equal the next one, add 15 seconds of transfer time
                            $d = $adj[$adjKey]->duration + $solutions[$key]->distance + 15;
                        }
                        else {
                            // continuing on the same line, do not add transfer time
                            $d = $adj[$adjKey]->duration + $solutions[$key]->distance;
                        }

                        if (is_null($dist) || $d < $dist) {
                            $parent = $solutions[$key];
                            $nearest = $adj[$adjKey]->end;
                            $dist = $d;
                            $lines = array_merge($solutions[$key]->lines, array($adj[$adjKey]->line));
                            if (count($solutions[$key]->lines) > 0 && $adj[$adjKey]->line != end($solutions[$key]->lines)) {
                                // last line doesn't equal the next one, add 15 seconds of transfer time
                                $durations = array_merge($solutions[$key]->durations, array($adj[$adjKey]->duration + 15));
                            }
                            else {
                                // continuing on the same line, do not add transfer time
                                $durations = array_merge($solutions[$key]->durations, array($adj[$adjKey]->duration));
                            }
                            $warnings = array_merge($solutions[$key]->warnings, array($adj[$adjKey]->warnings));
                            $platforms = array_merge($solutions[$key]->platforms, array($adj[$adjKey]->platform));
                            $halts = array_merge($solutions[$key]->halts, array($adj[$adjKey]->end));
                        }
                    }
                }

                // no more solutions
                if (is_null($dist)) {
                    break;
                }

                // extend the nearest solution's path
                $solutions[$nearest] = new Solution($dist, $lines, $durations, $warnings, $platforms, $halts);
                $loops += 1;

                if ($loops > 300) {
                    break;
                }
            }

            // remove route from start to start from solutions
            array_splice($solutions, 0, 1);

            if (!empty($end)) {
                return $solutions[$end];
            }
            else {
                return $solutions;
            }
        }
    }
?>