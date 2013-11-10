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
		$conn = mysql_connect('127.0.0.1','root','chris!benq7*');
		mysql_select_db('stylosophy',$conn);
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
	private function get_key_list($params) {
		$uid = $params['uid'];
		$sql = "select * from keywords where uid='{$uid}' order by rank asc";
		$list = mysql::i()->get_list($sql);
		return $list;
	}
	private function add_key($params) {
		$sql  = "select * from keywords where `key`='{$params['key']}' and `uid`='{$params['uid']}'";
		
		if($row=mysql::i()->get_one($sql)) {
			$sql = "update keywords set `text`='{$params['text']}' where `key`='{$params['key']}' and `uid`='{$params['uid']}'";
			mysql::i()->exe_sql($sql);
			return array('error'=>0,'key_id'=>$row['id']);
		} else {
			$sql = "insert into keywords (`key`,`text`,`uid`,`rank`) values('{$params['key']}','{$params['text']}','{$params['uid']}','{$params['rank']}')";
			mysql::i()->exe_sql($sql);
			return array('error'=>0,'key_id'=>mysql_insert_id());
		}
		
	}
	private function set_default($params) {
	
		$uid = $params['uid'];
		$text = $params['text'];

		$sql = "select * from default_text where uid='{$uid}'";
		if($row = mysql::i()->get_one($sql)) {
			$sql =  "update default_text set `text`='{$text}' where uid={$uid}";
			mysql::i()->exe_sql($sql);
		} else {
			$sql =  "insert into  default_text (`uid`,`text`) values('{$uid}','{$text}')";
			mysql::i()->exe_sql($sql);
		}
	}
	private function get_default($params) {
	
		$uid = $params['uid'];
		$sql = "select * from default_text where uid='{$uid}'";
		if($row = mysql::i()->get_one($sql)) {
			return $row;
		} else {
			return array('error'=>1,'message');
		}
	}
	private function del_key($params) {
	
		$sql = "delete from keywords where id='{$params['key_id']}'";
		mysql::i()->exe_sql($sql);
		return array('error'=>0);
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
	private function check_notes($params) {
		$list = $params['list'];
		$result = array();
		foreach($list as $k=>$v){
			$sql  = "select * from notes where uid='{$params['user_id']}' and mid='{$v['mid']}'";
			if(!mysql::i()->get_one($sql)) {
				$sql = "insert into notes(`uid`,`mid`,`from_uid`) values ('{$params['user_id']}','{$v['mid']}','{$v['uid']}')";
				mysql::i()->exe_sql($sql);
				$result[] = $v;
			}
		
		}
		return $result;
	}
	private function sync_rank($params) {
	
		$data = $params['list'];
		foreach($data as $id=>$rank) {
			$sql = "update keywords set rank={$rank} where id={$id}";
			mysql::i()->exe_sql($sql);
		}
		return array('error'=>0);
	}
	
	private function get_message($params) {
		$message = $params['message'];
		$uid = $params['uid'];
		//每次1000条
		$page = 0;
		$text = '';
		$data = array();
		while(true) {
			$offset = $page*1000;
			$sql = "select * from keywords where uid={$uid}  order by rank asc limit {$offset},1000";
			$key_list = mysql::i()->get_list($sql);
			//print_r($key_list);
			foreach ($key_list as $word) {
				if(strpos($message,$word['key'])!==false) {
					$data[] = $word['text'];
				}
			}
			if(count($key_list)<1000) {
				break;
			}
			$page++;
		}
		return $data;
	}
	
	
	private function get_message_new($params) {
		$message = $params['message'];
		$message = preg_replace('/(\d+)[^\d]+(\d+)/',"\\1-\\2",$message);
		$uid = $params['uid'];
		//每次1000条
		$page = 0;
		$text = '';
		$data = array();
		while(true) {
			$offset = $page*1000;
			$sql = "select * from keywords where uid={$uid}  order by rank asc limit {$offset},1000";
			$key_list = mysql::i()->get_list($sql);
			//print_r($key_list);
			foreach ($key_list as $word) {
			    $words = explode(',',$word['key']);    
			    foreach($words as $key) {
    				if(strpos($message,$key)!==false) {
    					$data[] = $word['text'];
    				}
				}
			}
			if(count($key_list)<1000) {
				break;
			}
			$page++;
		}
		return $data;
	}
	
	
	private function check_at($params) {
		
		$uid = $params['uid'];
		$sql =  "select * from at where uid='{$uid}'";
		if(!mysql::i()->get_one($sql)) { //一条也没找到
			//查看一下
			$at_list = $params['data'];
			foreach ($at_list as $k=>$v) {
				$sql = "insert into at(mid,uid,text,ouid) values('{$v['mid']}','{$uid}','{$v['text']}','{$v['ouid']}')";
				mysql::i()->exe_sql($sql);
			}
			return $at_list;
		} else {
			//查看一下
			$at_list = $params['data'];
			$result = array();
			foreach ($at_list as $k=>$v) {
				$sql = "select * from at where uid='{$uid}' and mid='{$v['mid']}'";
				if(!mysql::i()->get_one($sql)) {
					$sql = "insert into at(mid,uid,text,ouid) values('{$v['mid']}','{$uid}','{$v['text']}','{$v['ouid']}')";
					mysql::i()->exe_sql($sql);
					$result[] = $v;
				}
			}
			return $result;
		}
		
	}
	private function check_like($params) {
		$uid = $params['uid'];
		$data_list = $params['data'];
		$result = array();
		foreach($data_list as $cell) {
			$sql = "select * from likes where uid={$uid} and mid={$cell['mid']}";
			if(!$row = mysql::i()->get_one($sql)) {
				//是否已经回复？
				$sql = "select id from likes where touid={$cell['uid']}";
				if(mysql::i()->get_one($sql)) {
					$cell['replied'] = 1;
				}
				$result[] = $cell;
				//写入
				$sql = "insert into likes(uid,mid,touid)"
				." values('{$uid}','{$cell['mid']}','{$cell['uid']}')";
				mysql::i()->exe_sql($sql);
			}
		}
		return $result;
	}
	private function save_black($params) {
		$uid = $params['uid'];
		$content = $params['content'];
		$sql = "select * from black_words where uid={$uid}";
		if($row = mysql::i()->get_one($sql)) {
			$sql = "update black_words set content='{$content}' where id={$row['id']}";
			mysql::i()->exe_sql($sql);
		} else {
			$sql = "insert into black_words(uid,content) values('{$uid}','{$content}')";
			mysql::i()->exe_sql($sql);
		}
	}
	
	private function save_white($params) {
		$uid = $params['uid'];
		$content = $params['content'];
		$sql = "select * from white_ids where uid={$uid}";
		if($row = mysql::i()->get_one($sql)) {
			$sql = "update white_ids set content='{$content}' where id={$row['id']}";
			mysql::i()->exe_sql($sql);
		} else {
			$sql = "insert into white_ids(uid,content) values('{$uid}','{$content}')";
			mysql::i()->exe_sql($sql);
		}
	}
	
	
	private function save_fans($params) {
		$uid = $params['uid'];
		$content = $params['content'];
		$fans_message = $params['fans_message'];
		$sql = "select * from listen_fans where uid={$uid}";
		if($row = mysql::i()->get_one($sql)) {
			$sql = "update listen_fans set content='{$content}',fans_message='{$fans_message}' where id={$row['id']}";
			mysql::i()->exe_sql($sql);
		} else {
			$sql = "insert into listen_fans(uid,content,fans_message) values('{$uid}','{$content}','{$fans_message}')";
			mysql::i()->exe_sql($sql);
		}
	}
	private function get_fans($params) {
		$uid = $params['uid'];
		$sql = "select * from listen_fans where uid={$uid}";
		$row = mysql::i()->get_one($sql);
		return array('text'=>$row['content'].'','fans_message'=>$row['fans_message']);
	}
	
	private function get_black($params) {
		$uid = $params['uid'];
		$sql = "select * from black_words where uid={$uid}";
		$row = mysql::i()->get_one($sql);
		return array('text'=>$row['content'].'');
	}
	private function get_white($params) {
		$uid = $params['uid'];
		$sql = "select * from white_ids where uid={$uid}";
		$row = mysql::i()->get_one($sql);
		return array('text'=>$row['content'].'');
	}
	private function check_message($params) {
		$uid = $params['uid'];
		
		$m_list = $params['forReply'];
		$re_list = array();
		foreach($m_list as $m){
			$key = md5($m['uid'].$m['time']);
			$sql = "select * from message where uid='{$uid}' and "
			."key='{$key}'";
			if(!mysql::i()->get_one($sql)) {
				$re_list[] = $m;
				$sql = "insert message(uid,`key`) values('{$uid}','{$key}')";
				mysql::i()->exe_sql($sql);
			} 
		}
		return $re_list;
	}
	private function add_log($params) {
		$log = $params['log'];
		$sql = "insert into error_log (message) values('{$log}')";
		mysql::i()->exe_sql($sql);
	}
	private function check_num($params) {
		$uid = $params['uid'];
		$big_uid = $params['big_uid'];
		$num = $params['num'];
		
		$sql  = "select * from big_v where uid='{$uid}' and big_uid='{$big_uid}'";
		if($row = mysql::i()->get_one($sql)) {
			if($num!=$row['num']) {
				$sql = "update big_v set num={$num} where id={$row['id']}";
				mysql::i()->exe_sql($sql);
			}
			return array('num'=>$row['num']);
		} else {
			$sql = "insert into big_v(uid,big_uid,num)"
			." values('{$uid}','{$big_uid}','{$num}')";
			mysql::i()->exe_sql($sql);
			return array('num'=>$num);
		}
		
		
	}
	private function pub_task($params) {
		$mid = $params['mid'];
		$content = $params['content'];
		$uid = $params['uid'];
		$frequency = $params['frequency'];
		$sql = "select * from task where uid={$uid}";
		
		
		if(mysql::i()->get_one($sql)) {
			$sql = "update task "
			."set mid='{$mid}',"
			."content='{$content}',"
			."frequency='{$frequency}'"
			." where uid={$uid}";
			mysql::i()->exe_sql($sql);
		} else {
			$sql = "insert into task (uid,mid,content,frequency) values("
			."'{$uid}'"
			.",'{$mid}','{$content}','{$frequency}')";
			mysql::i()->exe_sql($sql);
		}
		return array();
	}
	
	private function pub_forward_task($params) {
		$mid = $params['mid'];
		$content = $params['content'];
		$uid = $params['uid'];
		$frequency = $params['frequency'];
		$sql = "select * from forward_task where uid={$uid}";
	
	
		if(mysql::i()->get_one($sql)) {
			$sql = "update forward_task "
			."set mid='{$mid}',"
			."content='{$content}',"
			."frequency='{$frequency}'"
			." where uid={$uid}";
			mysql::i()->exe_sql($sql);
		} else {
			$sql = "insert into forward_task (uid,mid,content,frequency) values("
			."'{$uid}'"
			.",'{$mid}','{$content}','{$frequency}')";
			mysql::i()->exe_sql($sql);
		}
		return array();
	}
	
	
	private function get_task_detail($params) {
		$uid = $params['uid'];
		$sql = "select * from task where uid={$uid}";
		$task = mysql::i()->get_one($sql);
		return array(
			'mid'=>$task['mid'].'',
			'content'=>$task['content'].'',
			'frequency'=>$task['frequency'].''
		);
	}
	private function get_forward_task_detail($params) {
		$uid = $params['uid'];
		$sql = "select * from forward_task where uid={$uid}";
		$task = mysql::i()->get_one($sql);
		return array(
				'mid'=>$task['mid'].'',
				'content'=>$task['content'].'',
				'frequency'=>$task['frequency'].''
		);
	}
	private function check_task($params) {
		$uid = $params['uid'];
		
		$sql = "select * from little_account where uid={$uid}";
		$t = time();
		if($row = mysql::i()->get_one($sql)) {
			$sql = "update little_account set last_update={$t} where id={$row['id']}";
			mysql::i()->exe_sql($sql);
		} else {
			$sql = "insert into little_account(uid,last_update)values({$uid},{$t})";
			mysql::i()->exe_sql($sql);
		}
		$sql = "select * from task where uid={$uid}";
		$result = mysql::i()->get_one($sql);
		return array(
			'mid'=>$result['mid'].'',
			'content'=>$result['content'].'',
			'frequency'=>$result['frequency'].''
		);
	}
	
	private function check_forward_task($params) {
		$uid = $params['uid'];
	
		$sql = "select * from little_account where uid={$uid}";
		$t = time();
		if($row = mysql::i()->get_one($sql)) {
			$sql = "update little_account set last_update={$t} where id={$row['id']}";
			mysql::i()->exe_sql($sql);
		} else {
			$sql = "insert into little_account(uid,last_update)values({$uid},{$t})";
			mysql::i()->exe_sql($sql);
		}
		$sql = "select * from forward_task where uid={$uid}";
		$result = mysql::i()->get_one($sql);
		return array(
			'mid'=>$result['mid'].'',
			'content'=>$result['content'].'',
			'frequency'=>$result['frequency'].''
		);
	}
	private function commend_did($params) {
		$mid = $params['mid'];
		$cid = $params['cid'];
		$uid = $params['uid'];
		$sql = "insert into comment_did(mid,cid,uid) values('{$mid}','{$cid}','{$uid}')";
		mysql::i()->exe_sql($sql);
		return array();
	}
	private function check_mid($params) {
		$mid = $params['mid'];
		$uid = $params['uid'];
		$sql =  "select * from comment_did where mid={$mid} and uid={$uid} and flag=1";
		$result = mysql::i()->get_list($sql);
		if($result) {
			$sql = "update comment_did set flag=0 where mid={$mid} and uid={$uid}";
			mysql::i()->exe_sql($sql);			
			return $result;
		} else {
			return array();
		}
	}
	
	private function pub_fans_task($params) {
		$fuid = $params['fuid'];
		$content = $params['content'];
		
		$sql = "select * from fans_task_tmp";
		$tmp_list = mysql::i()->get_list($sql);
		
		
		
		
		
		
		foreach ($tmp_list as $task) { 
			$user = $this->get_one_user_for_task();
			if($user) {
				$sql = "insert into fans_task(fuid,ouid,content) "
				."values({$task['fuid']},{$user['uid']},'{$task['content']}')";
				mysql::i()->exe_sql($sql);
				$sql = "delete  from fans_task_tmp where id={$task['id']}";
				mysql::i()->exe_sql($sql);
			}
		}
		
		
		$task = array(
				'fuid'=>$fuid,
				'content'=>$content
		);
		
		$user = $this->get_one_user_for_task();
		
		if($user) {
			$sql = "insert into fans_task(fuid,ouid,content) "
			."values({$task['fuid']},{$user['uid']},'{$task['content']}')";
			mysql::i()->exe_sql($sql);
		} else {
			$sql = "insert into fans_task_tmp(fuid,content) values({$task['fuid']},'{$task['content']}')";
			
			mysql::i()->exe_sql($sql);
		}
		
		return array();
	}
	
	private function get_one_user_for_task(){
		
		$dateindex = date("Ymd");
		//小于
		$sql = "select * from little_account where dateindex<{$dateindex}";
		$list = mysql::i()->get_list($sql);
		$user = array();
		if($list) {
			$user = $list[0];
			$sql = "update little_account set num=29 , dateindex={$dateindex} where id={$user['id']}";
			mysql::i()->exe_sql($sql);
		} else {
			$sql = "select * from little_account where dateindex={$dateindex} and num>0";
			$list = mysql::i()->get_list($sql);
			if($list) {
				$user = $list[0];
				$num_remain = $user['num']-1;
				$sql = "update little_account set num = {$num_remain} where id={$user['id']}";
				mysql::i()->exe_sql($sql);
			}
		}
		return $user;
	}
	
	private function get_fans_task($params) {
		$uid = $params['uid'];
		$sql = "select * from fans_task where ouid={$uid}";
		$rows =  mysql::i()->get_list($sql);
		$sql = "delete from fans_task where ouid={$uid}";
		mysql::i()->exe_sql($sql);
		return $rows;
	}
	private function sync_comment_num($params){
	    $uid = $params['uid'];
	    $num = $params['num'];
	    $sql = "update little_account set comment_num={$num} where uid={$uid}";
	    mysql::i()->exe_sql($sql);   
	}
	
	private function get_one_comment_num($params) {
	    $uid = $params['$uid'];
        $sql = "select * from little_account where uid={$uid}";
        $row = mysql::i()->get_one($sql);
        
        $remain = $row['comment_num']-1;
        $remain = $remain>0?$remain:0;
        
        $sql = "update little_account set comment_num={$remain} where uid={$uid}";
        mysql::i()->exe_sql($sql);
        return  $row['comment_num'];
	}
}
session_start();
$assit = new WeiboAssist();
$assit->run();
?>
