<?php
class mysql {

	public static $me = null;

	public static function i() {
		
		if(!self::$me) {
			self::$me = new mysql();
		} 
		return self::$me;
	}
	public function __construct() {
		$conn = mysql_connect('localhost','root','chris!benq7*');
		mysql_select_db('jianli',$conn);
		mysql_query("set names utf8;"); 
	}
	public function get_one($sql) {
		$res = mysql_query($sql);
		return mysql_fetch_assoc($res);
	}
	public function get_list($sql) {
		$list = array();

		$res = mysql_query($sql);
		
		while($row = mysql_fetch_assoc($res)) {
		
			$list[] = $row;
		}

		return $list;
	}
	public function exe_sql($sql) {
	
		mysql_query($sql);
	}
}

class WeiboAssist {
	public function run() {
		$params = array();
		foreach($_GET as $k=>$v) {
			$params[$k] = $v;
		}
		foreach($_POST as $k=>$v) {
		
			$params[$k]=$v;
		}
		$action = $params['action'];

		echo json_encode($this->$action($params));
	}
	private function check_comment($params) {
		$list = $params['list'];
		$my = mysql::i();
		$result = array();
		foreach($list as $k=>$v) {
			$sql = "select * from comment where cid='{$v['cid']}'";
			
			if(!$my->get_one($sql)) {
				$sql = "insert into comment(`ouid`,`cid`,`mid`,`comment`,`status_owner_user`) values ('{$v['ouid']}','{$v['cid']}','{$v['mid']}','{$v['comment']}','{$v['status_owner_user']}')";
				
				$my->exe_sql($sql);
				$result[] = $v;
			} else {
			
				
			}
		}
		return $result;
	}
}

$assit = new WeiboAssist();
$assit->run();
?>
