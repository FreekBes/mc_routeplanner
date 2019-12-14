<?php
/*
 * Author: doug@neverfear.org
 * Modified by: freekbes@github
 */

require_once("PriorityQueue.php");

class Edge {
	
	public $start;
	public $end;
	public $weight;
	public $line;
	public $platform;
	public $warnings;
	
	public function __construct($start, $end, $weight, $line, $platform, $warnings) {
		$this->start = $start;
		$this->end = $end;
		$this->weight = $weight;
		$this->line = $line;
		$this->platform = $platform;
		$this->warnings = $warnings;
	}
}

class Graph {
	
	public $nodes = array();
	
	public function addedge($start, $end, $weight = 0, $line, $platform, $warnings) {
		if (!isset($this->nodes[$start])) {
			$this->nodes[$start] = array();
		}
		array_push($this->nodes[$start], new Edge($start, $end, $weight, $line, $platform, $warnings));
	}
    
    public function removenode($index) {
		array_splice($this->nodes, $index, 1);
	}
	
	
	public function paths_from($from) {
		$dist = array();
		$dist[$from] = 0;
		
		$visited = array();
		
		$previous = array();
		
		$queue = array();
		$Q = new PriorityQueue("compareWeights");
		$Q->add(array($dist[$from], $from));
		
		$nodes = $this->nodes;
		
		while($Q->size() > 0) {
			list($distance, $u) = $Q->remove();
			
			if (isset($visited[$u])) {
				continue;
			}
			$visited[$u] = True;
			
			if (!isset($nodes[$u])) {
				throw new Exception("'$u' is not found in the node list");
			}
			
			foreach($nodes[$u] as $edge) {
				
				$alt = $dist[$u] + $edge->weight;
				$end = $edge->end;
				if (!isset($dist[$end]) || $alt < $dist[$end]) {
					$previous[$end] = $u;
					$dist[$end] = $alt;
					$Q->add(array($dist[$end], $end));
				}
			}
		}
		return array($dist, $previous);
	}
	
	public function paths_to($node_dsts, $tonode) {
		// unwind the previous nodes for the specific destination node
		
		$current = $tonode;
		$path = array();
		
		if (isset($node_dsts[$current])) { // only add if there is a path to node
			array_push($path, $tonode);
		}
		while(isset($node_dsts[$current])) {
			$nextnode = $node_dsts[$current];
			
			array_push($path, $nextnode);
			
			$current = $nextnode;
		}
		
		return array_reverse($path);
		
	}
	
	public function getpath($from, $to) {
		list($distances, $prev) = $this->paths_from($from);
		return $this->paths_to($prev, $to);
	}
	
}

function compareWeights($a, $b) {
	return $a->data[0] - $b->data[0];
}


