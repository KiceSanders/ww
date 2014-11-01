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

function user_points($gender, $height, $weight, $date_of_birth) {

  $age = (new DateTime())->diff(new DateTime($date_of_birth))->y;

  if ($gender === 'male') {
    $total_energy_expenditure_kcal =
      864 - 9.72 * $age + 1.12 * (14.2 * $weight / 2.2 + 503.0 * $height / 39.3701);
  } else {
    $total_energy_expenditure_kcal =
      387 - 7.31 * $age + 1.14 * (10.9 * $weight / 2.2 + 660.7 * $height / 39.3701);
  }

  $adjusted_tee = 0.9 * $total_energy_expenditure_kcal + 200;

  $target = round(min(max($adjusted_tee - 1000, 1000), 2500) / 35, DECIMALS);

  $target_mod = min(max($target - 7 - 4, 26), 71);

  return $target_mod;

}

function points($type, $fat, $carbohydrates, $fiber, $protein, $decimals = null) {

  $points =
    round(
      (16  * $protein + 19 * $carbohydrates + 45 * $fat - 14 * $fiber) / 175,
      (($decimals === null) ? DECIMALS : $decimals)
    );

  if ($type !== 'activity') {
    $points = max($points, 0);
  }

  return $points;

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

class crud extends api {
  private function result($result) {
    if ($result) {
      foreach ($result as $key => $value) {
        if (in_array($key, array(
          'quantity',
          'fat',
          'carbohydrates',
          'fiber',
          'protein',
          'height',
          'weight',
          'multiplier',
        ))) {
          $result[$key] = round(floatval($value), 4);
        }
      }
      if (
        isset($result['type']) and
        isset($result['fat']) and
        isset($result['carbohydrates']) and
        isset($result['fiber']) and
        isset($result['protein'])
      ) {
        $result['points'] = round(points(
          $result['type'],
          $result['fat'],
          $result['carbohydrates'],
          $result['fiber'],
          $result['protein']
        ), 0);
      }
      if (
        isset($result['gender']) and
        isset($result['height']) and
        isset($result['weight']) and
        isset($result['date_of_birth'])
      ) {
        $result['points'] = round(user_points(
          $result['gender'],
          $result['height'],
          $result['weight'],
          $result['date_of_birth']
         ), 0);
      }
    }
    return $result;
  }
  private function results($results) {
    foreach ($results as $i => $result) {
      $results[$i] = $this->result($result);
    }
    return $results;
  }
  public function select_id($attributes) {
    return $this->results($this->mysqli->select_id(
      $this->class,
      array('deleted' => 0) + $attributes
    ));
  }
  public function select($attributes) {
    return $this->results($this->mysqli->select(
      $this->class,
      array('deleted' => 0) + $attributes
    ));
  }
  public function get($id_or_attributes) {
    if (is_numeric($id_or_attributes)) {
      $result = $this->mysqli->get(
        $this->class,
        $id_or_attributes
      );
    } else {
      $result = $this->mysqli->get(
        $this->class,
        array('deleted' => 0) + $id_or_attributes
      );
    }
    return $this->result($result);
  }
  public function insert($attributes) {
    if ($this->class !== 'user') {
      if (isset($attributes['username'])) {
        $user = api('user', 'get', array('username' => $attributes['username']));
        unset($attributes['username']);
        $attributes['user_id'] = $user['user_id'];
      }
    }
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
}

class food extends crud {}
class ingredient extends crud {}
class track extends crud {}
class unit extends crud {}
class weight extends crud {}
class user extends crud {
  public function points($arguments) {
    $dates = array();
    $date = $arguments['date'];
    do {
      $dates[] = $date;
      $date = date('Y-m-d', strtotime($date) - 86400);
    } while (date('w', strtotime($date)) !=  6);
    $date = $arguments['date'];
    do {
      $dates[] = $date;
      $date = date('Y-m-d', strtotime($date) + 86400);
    } while (date('w', strtotime($date)) != 0);
    $dates = array_values(array_unique($dates));
    $results = api('multiple', 'curry', array(
      array(
        'class' => 'user',
        'function' => 'get',
        'arguments' => array(
          'username' => $arguments['username'],
        ),
      ),
      array(
        'class' => 'track',
        'function' => 'select_id',
        'arguments' => array(
          'date' => $dates,
          'user_id' => '=user.user_id',
        ),
      ),
      array(
        'class' => 'food',
        'function' => 'select_id',
        'arguments' => array(
          'food_id' => '=track[].food_id',
        ),
      ),
    ));
    sort($dates);
    $weekly_points = 49;
    $activity_points = 0;
    $activity_points_remaining = 0;
    foreach ($dates as $date) {
      $results['points'][$date] = 0;
      foreach ($results['track'] as $track_id => $track) {
        if ($track['date'] === $date) {
          if ($track['points'] < 0) {
            $activity_points += -1 * $track['points'];
            $activity_points_remaining += -1 * $track['points'];
          } else {
            $results['points'][$date] += $track['points'];
          }
        }
      }
      $results['activity_points'][$date] = $activity_points;
      $over = $results['points'][$date] - $results['user']['points'];
      if ($over > 0) {
        if ($activity_points_remaining > 0) {
          if ($over < $activity_points_remaining) {
            $activity_points_remaining -= $over;
            $over = 0;
          } else {
            $over -= $activity_points_remaining;
            $activity_points_remaining = 0;
          }
        }
        $weekly_points -= $over;
      }
      $results['activity_points_remaining'][$date] = $activity_points_remaining;
      $results['weekly_points'][$date] = $weekly_points;
    }
    return $results;
  }
}

class multiple {
  public function synchronous($calls) {
    $results = array();
    foreach ($calls as $call) {
      $results[] = api(
        $call['class'],
        $call['function'],
        $call['arguments']
      );
    }
    return $results;
  }
  private function curry_replace($results, $argument) {
    if ($argument) {
      $key = array_shift($argument);
      if ($key) {
        return $this->curry_replace($results[$key], $argument);
      } else {
        return $this->curry_replace(
          array_pluck(array_shift($argument), $results),
          $argument
        );
      }
    } else {
      return $results;
    }
  }
  private function curry_find($results, $arguments) {
    if (is_array($arguments)) {
     foreach ($arguments as $key => $value) {
       if (
         is_string($value) and
         (substr($value, 0, 1) === '=')
       ) {
         $arguments[$key] = $this->curry_replace(
           $results,
           explode('.', str_replace(
             array('[',']','"','\''),
             array('.','','',''),
             substr($value, 1)
           ))
         );
       }
     }
    }
    return $arguments;
  }
  private function results($results) {
    if (
      isset($results['food']) and
      !isset($results['food']['food_id']) and
      isset($results['track'])
    ) {
      $units = array();
      foreach (api('unit', 'select', array()) as $unit) {
        $units[$unit['unit']] = floatval($unit['multiplier']);
      }
      foreach ($results['track'] as $track_id => $track) {
        $food = $results['food'][$track['food_id']];
        $results['track'][$track_id]['points'] = round(
          $track['quantity'] / $food['quantity'] *
          $units[$track['units']] / $units[$food['units']] *
          points(
            $food['type'],
            $food['fat'],
            $food['carbohydrates'],
            $food['fiber'],
            $food['protein'],
            4
          ),
          0
        );
      }
    }
    return $results;
  }
  public function curry($calls) {
    $results = array();
    foreach ($calls as $call) {
      $results[
        isset($calls['name']) ? $calls['name'] : $call['class']
      ] = api(
        $call['class'],
        $call['function'],
        $this->curry_find($results, $call['arguments'])
      );
    }
    return $this->results($results);
  }
}






