<?php

ob_start('ob_gzhandler');

define('DECIMALS', 0);

date_default_timezone_set('America/Indiana/Indianapolis');

if ($_POST) {

  error_reporting(E_ALL);

  set_error_handler(function($errno, $errstr, $errfile, $errline) {
    die(json_encode(array(
      'success' => false,
      'error' => $errstr . ' in ' . $errfile . ' on line ' . $errline,
      'result' => null,
    )));
  });

  register_shutdown_function(function() {
    if ($error = error_get_last()) {
      http_response_code(200);
      die(json_encode(array(
        'success' => false,
        'error' =>
          $error['message'] . ' in ' . $error['file'] . ' on line ' . $error['line'],
        'result' => null,
      )));
    }
  });

  header('Content-Type: application/json');

  try {
    die(json_encode(array(
      'success' => true,
      'error' => null,
      'result' => api(
        $_POST['class'],
        $_POST['function'],
        json_decode($_POST['arguments'], true)
      ),
    )));
  } catch (Exception $e) {
    die(json_encode(array(
      'success' => false,
      'error' => $e->getMessage(),
      'results' => null,
    )));
  }

}

function api($class, $function/* , $var_args */) {
  return call_user_func_array(
    array(new $class(), $function),
    array_slice(func_get_args(), 2)
  );
}
function arr(){
  return func_get_args();
}

class my_mysqli extends mysqli{
  private static $instance;
  private function __construct($host, $username, $password, $database = '') {
    parent::__construct($host, $username, $password, $database);
  }
  public static function get_instance($host, $username, $password, $database = '') {
    if (!isset(self::$instance)) {
      self::$instance = new self($host, $username, $password, $database);
    }
    return self::$instance;
  }
  public function query($str) {
    $result = parent::query($str);
    if ($result) {
      return $result;
    } else {
      throw new Exception($this->error . ':' . $str);
    }
  }
  private function word($str) {
    if (preg_match('/^[\d\w]+$/', $str)) {
      return '`' . $str . '`';
    } else {
      throw new Exception('invalid word');
    }
  }
  private function escape($str) {
    if ($str === null) {
      return 'null';
    } else {
      return '"' . $this->real_escape_string($str) . '"';
    }
  }
  public function select_id($table, $attributes) {
    $clauses = array();
    foreach ($attributes as $key => $value) {
      $clause = $this->word($key);
      if (is_array($value)) {
        if ($value) {
          $clause .= ' in (' . implode(',',
              array_map(array($this, 'escape'), $value)
            ) . ')';
        } else {
          return array();
        }
      } else {
        $clause .= '=' . $this->escape($value);
      }
      $clauses[] = $clause;
    }
    $query =
      'select * from ' . $this->word($table) . ' ' .
      'where (' . implode(') and (', $clauses) . ')';
    $result = $this->query($query);
    $results = array();
    while ($row = $result->fetch_assoc()) {
      $results[$row[$table . '_id']] = $row;
    }
    return $results;
  }
  public function select($table, $attributes) {
    return array_values($this->select_id($table, $attributes));
  }
  public function get($table, $id_or_attributes) {
    if (is_numeric($id_or_attributes)) {
      $attributes = array($table . '_id' => $id_or_attributes);
    } else {
      $attributes = $id_or_attributes;
    }
    foreach ($this->select_id($table, $attributes) as $result) {
      return $result;
    }
    return null;
  }
  public function insert($table, $attributes) {
    $query = 'insert into ' . $this->word($table) . ' (' . implode(',', array_map(array($this, 'word'), array_keys($attributes))) . ') values (' . implode(',', array_map(array($this, 'escape'), $attributes)) . ')';
    $this->query($query);
    return $this->insert_id;
  }
  public function update($table, $id, $attributes) {
    if ($attributes) {
      $query = 'update ' . $this->word($table) . ' set ' . implode(',',
        array_map(
          'implode',
          array_fill(0, count($attributes), ''),
          array_map(
            'arr',
            array_map(array($this, 'word'), array_keys($attributes)),
            array_fill(0, count($attributes), '='),
            array_map(array($this, 'escape'), array_values($attributes))
          )
        )
      ) . ' where ' . $this->word($table . '_id') . ' = ' . intval($id) . '';
      $this->query($query);
      return $this->affected_rows;
    } else {
      return 0;
    }
  }
}

function array_pluck($key, $rows) {
  $values = array();
  foreach ($rows as $row) {
    $values[] = $row[$key];
  }
  return $values;
}

class api {
  protected $class;
  private static $static_mysqli;
  private static $static_user;
  protected $user;
  protected $user_id;
  public function __construct() {
    $this->class = get_class($this);
    if (!isset(self::$static_mysqli)) {
      require_once '../db.php';
      self::$static_mysqli = my_mysqli::get_instance(
        DB_HOST,
        DB_USER,
        DB_PASS,
        DB_NAME
      );
    }
    $this->mysqli = self::$static_mysqli;
  }

}

class user extends api {
  public function login($arguments) {
    $query = '
      select
        *
      from
        user
      where
        username = "' . $this->mysqli->real_escape_string($arguments['username']) . '" and
        password = sha1(concat(uuid, "' . $this->mysqli->real_escape_string($arguments['password']) . '"))';
    $result = $this->mysqli->query($query);
    if ($row = $result->fetch_assoc()) {
      $query = 'insert into session (user_id,`key`) values (' . $row['user_id'] . ', sha1(concat(uuid(), now())))';
      $result = $this->mysqli->query($query);
      $query = 'select * from session where session_id = ' . $this->mysqli->insert_id . '';
      $result = $this->mysqli->query($query);
      $row = $result->fetch_assoc();
      return $row['key'];
    } else {
      return null;
    }
  }
  public function load($date) {
    $query = 'select * from session where `key` = "' . $this->mysqli->real_escape_string($_REQUEST['key']) . '"';
    $result = $this->mysqli->query($query);
    if ($row = $result->fetch_assoc()) {
      $query = 'select * from user where user_id = ' . $row['user_id'] . '';
      $result = $this->mysqli->query($query);
      $row = $result->fetch_assoc();
      return array(
        'user' => $row,
        'unit' => api('unit', 'select_id', array()),
        'food' => api('food', 'select_id', array()),
        'track' => api('track', 'select_id', array(
          'user_id' => $row['user_id'],
        )),
        'ingredient' => api('track', 'select_id', array()),
        'weight' => api('weight', 'select_id', array(
          'user_id' => $row['user_id'],
        )),
      );
    } else {
      return null;
    }
  }
  public function update_weight($arguments) {
    $weight_id = api('weight', 'insert', $arguments);
    $query = '
      update
        user
      set
        weight = ' . floatval($arguments['weight']) . '
      where
        user_id = ' . intval($arguments['user_id']) . '
    ';
    $this->mysqli->query($query);
    return $weight_id;
  }
}

class crud extends api {
  public function select_id($attributes) {
    return $this->mysqli->select_id(
      $this->class,
      array('deleted' => 0) + $attributes
    );
  }
  public function select($attributes) {
    return $this->mysqli->select(
      $this->class,
      array('deleted' => 0) + $attributes
    );
  }
  public function get($id_or_attributes) {
    if (is_numeric($id_or_attributes)) {
      return $this->mysqli->get(
        $this->class,
        $id_or_attributes
      );
    } else {
      return $this->mysqli->get(
        $this->class,
        array('deleted' => 0) + $id_or_attributes
      );
    }
  }
  public function insert($attributes) {
    return $this->mysqli->insert(
      $this->class,
      $attributes
    );
  }
  public function update($arguments) {
    return $this->mysqli->update(
      $this->class,
      $arguments['' . $this->class . '_id'],
      $arguments['attributes']
    );
  }
  public function delete($id) {
    $this->update(array(
      $this->class . '_id' => $id,
      'attributes' => array(
        'deleted' => 1,
      ),
    ));
  }
}

class food extends crud {}
class ingredient extends crud {}
class track extends crud {}
class unit extends crud {}
class weight extends crud {}
class img {
  public function upload($data) {
    if (strlen($data) > (100 * 1000)) {
      throw new Exception('filesize exceded');
    }
    $file_name = md5(mt_rand() . time()) . '.jpg';
    file_put_contents('img/' . $file_name, base64_decode($data));
    return $file_name;
  }
}
