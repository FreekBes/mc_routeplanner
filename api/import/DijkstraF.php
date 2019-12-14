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
    }
?>