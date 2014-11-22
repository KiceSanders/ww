var $ = rocket.extend(rocket.$, rocket);
var api = function(cls, fnct, args, callback) {
  $.post(
    'index.php',
    {
      'key': $.cookie('key'),
      'class': cls,
      'function': fnct,
      'arguments': $.JSON.stringify(args)
    },
    function(json_response) {
      try {
        var response = $.JSON.parse(json_response);
      } catch (e) {
        alert(json_response);
      }
      if (response.success) {
        callback(response.result);
      } else {
        alert(response.error);
      }
    }
  );
};
var hash = '';
var hash_change = function() {
  if (hash !== document.location.hash) {
    hash = document.location.hash;
    var parts = hash.substr(2).split('/').filter(function(i) {return i;});;
    $.construct(layer[parts[0]], parts.splice(1)).render();
  }
};
window.addEventListener('hashchange', hash_change);
var go = function(where, opt_why) {
  document.location.hash = '#/' + where + '/' + (opt_why || '');
};
rocket.ready(function() {

  if (!document.location.hash) {
   if ($.cookie('key')) {
     go('home');
   } else {
     go('login');
   }
  }

  hash_change();

});
var points = function(fat, carbohydrates, fiber, protein) {
  return Math.max(0, $.round(
    (16  * protein + 19 * carbohydrates + 45 * fat - 14 * fiber) / 175,
    0
  ));
};
var fractions = {
  '.0': '.0',
  '.1': '.1',
  '.25': ' 1/4',
  '.2': '.2',
  '.3': '.3',
  '.4': '.4',
  '.5': ' 1/2',
  '.6': '.6',
  '.7': '.7',
  '.75': ' 3/4',
  '.8': '.8',
  '.9': '.9'
};
var decimal_to_fraction = function(str) {
  str = '' + +str;
  str = str.replace('0.', '.');
  for (var i in fractions) {
    str = str.replace(i, fractions[i]);
  }
  return str;
};
var user_points = function(gender, height, weight, date_of_birth, date) {

  date_of_birth = $.strToDate(date_of_birth);
  date = $.strToDate(date);
  var age = date.getFullYear() - date_of_birth.getFullYear();
  if (
    (date.getMonth() < date_of_birth.getMonth()) ||
    ((date.getMonth() === date_of_birth.getMonth()) &&
    date.getDate() < date_of_birth.getDate())
  ) {
    --age;
  }

  if (gender === 'male') {
    var total_energy_expenditure_kcal =
      864 - 9.72 * age + 1.12 * (14.2 * weight / 2.20462 + 503.0 * height / 39.3701);
  } else {
    var total_energy_expenditure_kcal =
      387 - 7.31 * age + 1.14 * (10.9 * weight / 2.20462 + 660.7 * height / 39.3701);
  }

  var adjusted_tee = 0.9 * total_energy_expenditure_kcal + 200;

  var target = $.round(Math.min(Math.max(adjusted_tee - 1000, 1000), 2500) / 35, 0);

  var target_mod = Math.min(Math.max(target - 7 - 4, 26), 71);

  return target_mod;

}




var layer = function() {};
layer.prototype.render = function() {
  var container = $.createElement('div');
  $.EventTarget.removeAllEventListeners();
  this.render_contents(container);
  if (container.innerHTML().length) {
    $('body').innerHTML('').appendChild(container);
  }
  this.render_complete();
};
layer.prototype.render_complete = function() {};



layer.login = function(opt_username) {
  this.opt_username = opt_username;
};
rocket.inherits(layer.login, layer);
layer.login.prototype.render_contents = function(parent) {
  var container = $.createElement('div').style({
    'margin': 10
  });
  var table = $.table(1, 3);
  table.tbody.style({
    'text-align': 'center'
  });
  this.render_username(table.trs[0].tds[0]);
  this.render_password(table.trs[1].tds[0]);
  this.render_login_button(table.trs[2].tds[0]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.login.prototype.input_style = {
  'margin-top': 5,
  'width': '95%',
  'font-size': 18
};
layer.login.prototype.render_username = function(parent) {
  var container = $.createElement('div');
  var input = $.createElement('input').style(this.input_style).setAttribute({
    'placeholder': 'username'
  });
  var self = this;
  input.addEventListener('keydown', function(e) {
    if (e.which === $.KEY.enter) {
      self.login.dispatchEvent('click');
    }
  });
  input.value(this.opt_username || '');
  this.username = input;
  container.appendChild(input);
  parent.appendChild(container);
};
layer.login.prototype.render_password = function(parent) {
  var container = $.createElement('div');
  var input = $.createElement('input').style(this.input_style).setAttribute({
    'placeholder': 'password',
    'type': 'password'
  });
  var self = this;
  input.addEventListener('keydown', function(e) {
    if (e.which === $.KEY.enter) {
      self.login.dispatchEvent('click');
    }
  });
  this.password = input;
  container.appendChild(input);
  parent.appendChild(container);
};
layer.login.prototype.render_login_button = function(parent) {
  var container = $.createElement('div');
  var button = $.createElement('button').style(this.input_style).innerHTML('login');
  this.login = button;
  var loading = false;
  var self = this;
  button.addEventListener('click', function() {
    if (!loading) {
      loading = true;
      api('user', 'login', {
        'username': self.username.value(),
        'password': self.password.value()
      }, function(key) {
        if (key) {
          $.cookie('key', key, 90);
          go('home');
        } else {
          go('login', self.username.value());
        }
      });
    }
  });
  container.appendChild(button);
  parent.appendChild(container);
};
layer.login.prototype.render_complete = function() {
  this.login.style({
    'width': this.username.getBoundingClientRect().width
  });
  if (this.opt_username) {
    this.password.focus();
  } else {
    this.username.focus();
  }
};



layer.home = function() {
  var today = new Date();
  this.date =
    today.getFullYear() + '-' +
    $.padLeft(today.getMonth() + 1, 2, '0') + '-' +
    $.padLeft(today.getDate(), 2, '0');
};
rocket.inherits(layer.home, layer);
layer.home.prototype.render_contents = function(parent) {
  if (this.data && !$.isEmpty(this.data)) {
    this.render_loaded(parent);
  } else {
    this.render_loading(parent);
  }
};
layer.home.prototype.render_loading = function() {
  var self = this;
  api('user', 'load', this.date, function(data) {
    layer.prototype.data = self.data = data;
    self.update_data();
    self.render();
  });
};
layer.home.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.render_header(container);
  this.render_tracks(container);
  parent.appendChild(container);
};
layer.home.prototype.update_data = function() {
  var units = {};
  for (var i in this.data.unit) {
    units[this.data.unit[i].unit] = this.data.unit[i].multiplier;
  }
  var track_date = {};
  for (var track_id in this.data.track) {
    var track = this.data.track[track_id];
    if (!track_date[track.date]) {
      track_date[track.date] = [];
    }
    track_date[track.date].push(track);
    var food = this.data.food[track.food_id];
    var multiplier =
      (track.quantity * units[track.units]) /
      (food.quantity * units[food.units]);
    if (food.points === null) {
      track.points = points(
        multiplier * food.fat,
        multiplier * food.carbohydrates,
        multiplier * food.fiber,
        multiplier * food.protein
      );
    } else {
      track.points = $.round(multiplier * food.points, 0);
    }
  }
  for (var date in track_date) {
    $.sort(track_date[date], 'time');
    for (var i = 0; track_date[date][i]; ++i) {
      this.data.food[track_date[date][i].food_id].date_time =
        date + ' ' + track_date[date][i].time;
    }
  }
  this.data.track_date = track_date;
};

layer.home.prototype.render_header = function(parent) {
  var container = $.createElement('div').style({
    'position': 'fixed',
    'top': 0
  });
  this.header_container = container;
  this.render_header_top(container);
  this.render_header_bottom(container);
  parent.appendChild(container);
};
layer.home.prototype.render_header_top = function(parent) {
  var container = $.createElement('div');
  var table = $.table(5);
  table.tbody.style({
    'text-align': 'center',
    'font-size': 32,
    'background-color': '#005589',
    'color': 'white',
    'line-height': 60
  });
  table.tds[0].setAttribute({'width': '20%'});
  table.tds[1].setAttribute({'width': '20%'});
  table.tds[3].setAttribute({'width': '20%'});
  table.tds[4].setAttribute({'width': '20%'});
  this.render_header_yesterday_tomorrow(table.tds[0], -1);
  this.render_header_menu(table.tds[1]);
  this.render_header_label(table.tds[2]);
  this.render_header_track(table.tds[3]);
  this.render_header_yesterday_tomorrow(table.tds[4], 1);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.home.prototype.render_header_yesterday_tomorrow = function(parent, offset) {
  var container = $.createElement('div');
  container.innerHTML((offset < 0) ? '<' : '>');
  var self = this;
  container.addEventListener('click', function() {
    var date = $.strToDate(self.date);
    date = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + offset
    );
    self.date =
      date.getFullYear() + '-' +
      $.padLeft(date.getMonth() + 1, 2, '0') + '-' +
      $.padLeft(date.getDate(), 2, '0');
    self.render();
  });
  parent.appendChild(container);
};
layer.home.prototype.render_header_menu = function(parent) {
  var container = $.createElement('div');
  container.innerHTML('&#x2261;');
  container.addEventListener('click', function() {
    go('menu');
  });
  parent.appendChild(container);
};
layer.home.prototype.render_header_label = function(parent) {
  var container = $.createElement('div').style({
    'font-size': 14,
    'line-height': 16
  });
  container.addEventListener('click', function() {
    (new layer.home()).render();
  });
  container.appendChild($.createElement('div').innerHTML(
    this.data.user.username
  ));
  container.appendChild($.createElement('div').innerHTML(
    ('' + $.strToDate(this.date)).substr(0, 3)
  ));
  container.appendChild($.createElement('div').innerHTML(
    this.date.split('-')[1] + '/' +
    this.date.split('-')[2]
  ));
  parent.appendChild(container);
};
layer.home.prototype.render_header_track = function(parent) {
  var container = $.createElement('div');
  container.innerHTML('+');
  container.addEventListener('click', function() {
    go('track_food');
  });
  parent.appendChild(container);
};
layer.home.prototype.render_header_bottom = function(parent) {
  var container = $.createElement('div').style({
    'border-bottom': '1px solid gray',
    'background-color': 'white',
    'opacity': 0.9
  });
  var table = $.table(5).style({
    'height': 60
  });
  table.tbody.style({
    'text-align': 'center'
  });
  this.render_points_remaining(table.tds[0]);
  this.render_points_used(table.tds[1]);
  this.render_points_daily(table.tds[2]);
  this.render_points_weekly(table.tds[3]);
  this.render_points_activity(table.tds[4]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.home.prototype.points_label = {
  'color': 'gray',
  'font-size': 8
};
layer.home.prototype.points_value = {
  'color': '#ef6103',
  'font-size': 28
};
layer.home.prototype.right_border = {
  'border-right': '1px dotted gray'
};
layer.home.prototype.get_daily_points = function(date) {
  var weight = 0;
  for (var i in this.data.weight) {
    if (this.data.weight[i].timestamp.substr(0, 10) <= date) {
      weight = this.data.weight[i].weight;
    }
  }
  return user_points(
    this.data.user.gender,
    this.data.user.height,
    weight,
    this.data.user.date_of_birth,
    date
  );
};
layer.home.prototype.render_points_daily = function(parent) {
  var container = $.createElement('div').style(this.right_border);
  container.appendChild($.createElement('div').style(
    this.points_label
  ).innerHTML(
    'Daily<br/>Points'
  ));
  container.appendChild($.createElement('div').style(
    this.points_value
  ).innerHTML(
    this.get_daily_points(this.date)
  ));
  parent.appendChild(container);
};
layer.home.prototype.get_points_used = function(date) {
  if (this.data.track_date[date]) {
    return this.data.track_date[date].map(function(row) {
      return +row.points;
    }).reduce(function(a, b) {
      return a + b;
    });
  } else {
    return 0;
  }
};
layer.home.prototype.render_points_used = function(parent) {
  var container = $.createElement('div').style(this.right_border);
  container.appendChild($.createElement('div').style(
    this.points_label
  ).innerHTML(
    'Daily<br/>Used'
  ));
  container.appendChild($.createElement('div').style(
    this.points_value
  ).innerHTML(
    this.get_points_used(this.date)
  ));
  parent.appendChild(container);
};
layer.home.prototype.get_points_remaining = function(date) {
  return this.get_daily_points(date) - this.get_points_used(date);
};
layer.home.prototype.render_points_remaining = function(parent) {
  var container = $.createElement('div').style(this.right_border);
  container.appendChild($.createElement('div').style(
    this.points_label
  ).innerHTML(
    'Daily<br/>Remaining'
  ));
  container.appendChild($.createElement('div').style(
    this.points_value
  ).innerHTML(
    this.get_points_remaining(this.date)
  ));
  parent.appendChild(container);
};
layer.home.prototype.render_points_weekly = function(parent) {
  var container = $.createElement('div').style(this.right_border);
  container.appendChild($.createElement('div').style(
    this.points_label
  ).innerHTML(
    'Weekly<br/>Remaining'
  ));
  var date = $.strToDate(this.date);
  var weekly_points = 49;
  do {
    var daily_points_remaining = this.get_points_remaining(
      date.getFullYear() + '-' +
      $.padLeft(date.getMonth() + 1, 2, '0') + '-' +
      $.padLeft(date.getDate(), 2, '0')
    );
    if (daily_points_remaining < 0) {
      weekly_points += daily_points_remaining;
    }
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  } while (('' + date).substr(0, 3) !== 'Sat');
  container.appendChild($.createElement('div').style(
    this.points_value
  ).innerHTML(
    weekly_points
  ));
  parent.appendChild(container);
};
layer.home.prototype.render_points_activity = function(parent) {
  var container = $.createElement('div');
  container.appendChild($.createElement('div').style(
    this.points_label
  ).innerHTML(
    'Activity<br/>Earned'
  ));
  var date = $.strToDate(this.date);
  var activity_earned = 0;
  do {
    var date_string = date.getFullYear() + '-' +
      $.padLeft(date.getMonth() + 1, 2, '0') + '-' +
      $.padLeft(date.getDate(), 2, '0');
    if (this.data.track_date[date_string]) {
      for (var i = 0; this.data.track_date[date_string][i]; ++i) {
        var track = this.data.track_date[date_string][i];
        var food = this.data.food[track.food_id];
        if (food.type === 'activity') {
          activity_earned += -1 * track.points;
        }
      }
    }
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  } while (('' + date).substr(0, 3) !== 'Sat');
  container.appendChild($.createElement('div').style(
    this.points_value
  ).innerHTML(
    activity_earned
  ));
  parent.appendChild(container);
};
layer.home.prototype.render_tracks = function(parent) {
  var container = $.createElement('div');
  this.contents_container = container;
  var tracks = this.data.track_date[this.date] || [];
  var rendered = {};
  for (var i = 0; tracks[i]; ++i) {
    this.render_track_header(container, tracks[i], rendered);
    this.render_track(container, tracks[i]);
  }
  parent.appendChild(container);
};
layer.home.prototype.render_track_header = function(parent, track, rendered) {
  var container = $.createElement('div').style({
    'background-color': '#eeeeee',
    'padding': '5px 10px',
    'color': 'gray',
    'font-size': 10
  });
  var headers = {
    '11': 'Breakfast',
    '16': 'Lunch',
    '22': 'Dinner',
    '24': 'Dessert'
  };
  for (var hour in headers) {
    if (track.time < hour) {
      if (!rendered[headers[hour]]) {
        rendered[headers[hour]] = true;
        parent.appendChild(container.innerHTML(headers[hour]));
      }
      break;
    }
  }
};
layer.home.prototype.render_track = function(parent, track) {
  var container = $.createElement('div');
  container.addEventListener('click', function() {
    go('edit_track', track.track_id);
  });
  var food = this.data.food[track.food_id];
  var time = ((track.time.split(':')[0] % 12) || 12) + ':' +
    track.time.split(':')[1] + ' ' +
    ((track.time.split(':')[0] < 12) ? 'am' : 'pm');
  this.render_track_food(
    container,
    food.name,
    track.quantity,
    track.units,
    track.points,
    time,
    food.img,
    food.img_rotation
  );
  parent.appendChild(container);
};
layer.home.prototype.render_track_food =
    function(parent, name, quantity, units, points, time, img, img_rotation) {
  var container = $.createElement('div').style({
    'border-bottom': '1px solid #eeeeee'
  });
  var table = $.table(img ? 3 : 2).style({
    'height': 40
  });
  if (img) {
    table.tds[0].setAttribute({
      'width': 45
    }).appendChild($.createElement('img').style({
      'width': 40
    }).setAttribute({
      'src': 'img/' + img
    }));
  }
  table.tds[0].style({
    'padding-left': 5
  });
  table.tds[img ? 1 : 0].appendChild($.createElement('div').innerHTML(
    name
  ));
  table.tds[img ? 1 : 0].appendChild($.createElement('div').style({
    'color': 'gray',
    'font-size': 10
  }).innerHTML(
    (time ? (time + ' - ') : '') +
    decimal_to_fraction(quantity) + ' ' + units
  ));
  table.tds[img ? 2 : 1].style({
    'width': 60,
    'text-align': 'center'
  });
  table.tds[img ? 2 : 1].innerHTML(+points);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.home.prototype.render_complete = function() {
  if (this.contents_container) {
    this.contents_container.style({
      'margin-top': this.header_container.getBoundingClientRect().height
    });
    window.scrollTo(0, 0);
  }
};





layer.menu = function() {};
rocket.inherits(layer.menu, layer.home);
layer.menu.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.render_header(container);
  this.render_items(container);
  parent.appendChild(container);
};
layer.menu.prototype.render_header = function(parent) {
  var container = $.createElement('div').style({
    'position': 'fixed',
    'top': 0
  });
  this.header_container = container;
  this.render_header_menu_home(container);
  parent.appendChild(container);
};
layer.menu.prototype.render_header_menu_home = function(parent) {
  var container = $.createElement('div');
  var table = $.table(2);
  table.tbody.style({
    'text-align': 'center',
    'font-size': 18,
    'color': 'white',
    'background-color': '#005589',
    'line-height': 60
  });
  this.render_header_menu(table.tds[0]);
  this.render_header_home(table.tds[1]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.menu.prototype.render_header_menu = function(parent) {
  var container = $.createElement('div');
  container.innerHTML('&#8801; MENU');
  container.addEventListener('click', function() {
    go('menu');
  });
  parent.appendChild(container);
};
layer.menu.prototype.render_header_home = function(parent) {
  var container = $.createElement('div');
  container.innerHTML('&#8962; HOME');
  container.addEventListener('click', function() {
    go('home');
  });
  parent.appendChild(container);
};
layer.menu.prototype.render_items = function(parent) {
  var container = $.createElement('div');
  this.contents_container = container;
  var items = [
    {
      'name': 'Track Food',
      'go': 'track_food'
    },
    {
      'name': 'Create Food',
      'go': 'create_food'
    },
    {
      'name': 'Edit Food',
      'go': 'edit_food'
    },
    {
      'name': 'Quick Create Food',
      'go': 'quick_create'
    },
    {
      'name': 'Create Activity',
      'go': 'create_activity'
    },
    {
      'name': 'Update Weight',
      'go': 'update_weight'
    },
    {
      'name': 'Logout',
      'go': 'logout'
    }
  ];
  for (var i = 0; items[i]; ++i) {
    this.render_item(container, items[i]);
  }
  parent.appendChild(container);
};
layer.menu.prototype.render_item = function(parent, item) {
  var container = $.createElement('div').style({
    'border-bottom': '1px solid #eeeeee'
  });
  container.addEventListener('click', function() {
    go(item.go);
  });
  var table = $.table(1).style({
    'height': 50
  });
  table.tds[0].style({
    'padding-left': 5
  }).innerHTML(item.name);
  container.appendChild(table);
  parent.appendChild(container);
};





layer.food = function() {};
rocket.inherits(layer.food, layer.menu);
layer.food.prototype.render_points = function(parent) {
  var container = $.createElement('div').style({
    'text-align': 'center'
  });
  container.appendChild($.createElement('div').style({
    'font-size': 20,
    'color': '#005589'
  }).innerHTML('Points'));
  this.points = container.appendChild($.createElement('div').style({
    'font-size': 42,
    'color': '#ef6103'
  }).innerHTML('0'));
  parent.appendChild(container);
};
layer.food.prototype.select_style = {
  'width': '100%',
  'height': 40
};
layer.food.prototype.button_style = {
  'width': '100%',
  'height': 40
};
layer.food.prototype.render_quantity_units = function(parent) {
  var container = $.createElement('div');
  var table = $.table(3);
  this.render_quantity(table);
  this.render_units(table.tds[2]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.food.prototype.render_quantity = function(table) {
  this.render_quantity_whole(table.tds[0]);
  this.render_quantity_fraction(table.tds[1]);
  var self = this;
  this.quantity = {
    'value': function(opt_val) {
      if (arguments.length) {
        self.quantity_whole.value(Math.floor(opt_val));
        self.quantity_fraction.value(('' + (opt_val % 1)).replace('0.', '.'));
      } else {
        return +self.quantity_whole.value() + +self.quantity_fraction.value();
      }
    }
  };
  this.render_quantity_value();
};
layer.food.prototype.render_quantity_whole = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style(this.select_style);
  this.quantity_whole = select;
  for (var i = 0; i < 300; ++i) {
    select.appendChild($.createElement('option').value(i).innerHTML(i));
  }
  var self = this;
  select.addEventListener('keyup,change,blur', function() {
    self.points_select_handler();
  });
  container.appendChild(select);
  parent.appendChild(container);
};
layer.food.prototype.render_quantity_fraction = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style(this.select_style);
  this.quantity_fraction = select;
  for (var i in fractions) {
    select.appendChild($.createElement('option').value(i).innerHTML(
      fractions[i]
    ));
  }
  var self = this;
  select.addEventListener('keyup,change,blur', function() {
    self.points_select_handler();
  });
  container.appendChild(select);
  parent.appendChild(container);
};
layer.food.prototype.render_quantity_value = function() {
  this.quantity.value(1);
};
layer.food.prototype.render_units = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style(this.select_style);
  this.units = select;
  var self = this;
  var units = [];
  for (var i in this.data.unit) {
    units.push(this.data.unit[i].unit);
  }
  units.sort();
  for (var i = 0; units[i]; ++i) {
    select.appendChild($.createElement('option').innerHTML(units[i]));
  }
  this.render_units_value();
  select.addEventListener('keyup,change,blur', function() {
    self.points_select_handler();
  });
  select.dispatchEvent('change');
  container.appendChild(select);
  parent.appendChild(container);
};
layer.food.prototype.render_units_value = function() {
  this.units.value('serving');
};
layer.food.prototype.render_name = function(parent) {
  var container = $.createElement('div').style({
    'margin': '0 5px 0'
  });
  var table = $.table(2);
  table.tds[0].setAttribute({
    'width': 50
  }).innerHTML('Name');
  var input = $.createElement('input').style({
    'width': '100%'
  }).setAttribute({
    'placeholder': 'name'
  });
  this.name = input;
  table.tds[1].appendChild(input);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.food.prototype.render_food_fields = function(parent) {
  var container = $.createElement('div');
  this.contents_container = container;
  var table = $.table(2);
  table.tds[0].setAttribute({
    'width': 180
  });
  this.render_fat_carbohydrates_fiber_protein(table.tds[0]);
  this.render_points(table.tds[1]);
  container.appendChild(table);
  this.render_name(container);
  this.render_quantity_units(container);
  this.render_save_buttons(container);
  this.render_image(container);
  parent.appendChild(container);
};
layer.food.prototype.render_fat_carbohydrates_fiber_protein = function(parent) {
  var container = $.createElement('div').style({
    'margin': '5px 5px 0'
  });
  var items = ['Fat', 'Carbohydrates', 'Fiber', 'Protein'];
  for (var i = 0; items[i]; ++i) {
    this.render_food_parameter(container, items[i]);
  }
  parent.appendChild(container);
};
layer.food.prototype.render_food_parameter = function(parent, item) {
  var container = $.createElement('div');
  var table = $.table(2);
  table.tds[0].setAttribute({
    'width': 100
  });
  table.tds[0].innerHTML(item);
  var self = this;
  var input = $.createElement('input').style({
    'width': 80
  }).setAttribute({
    'type': 'tel',
    'placeholder': 'grams'
  }).addEventListener('afterkeydown,blur', function() {
    this.value = this.value.replace(/[^\d\.]+/g, '.');
    self.points.innerHTML(points(
      self.fat.value() || 0,
      self.carbohydrates.value() || 0,
      self.fiber.value() || 0,
      self.protein.value() || 0
    ));
  });
  this[item.toLowerCase()] = input;
  table.tds[1].appendChild(input);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.food.prototype.get_args = function() {
  return {
    'name': this.name.value(),
    'points': null,
    'type': 'food',
    'fat': this.fat.value(),
    'carbohydrates': this.carbohydrates.value(),
    'fiber': this.fiber.value(),
    'protein': this.protein.value(),
    'quantity': this.quantity.value(),
    'units': this.units.value(),
    'user_id': this.data.user.user_id,
    'img': this.img || null,
    'img_rotation': this.img_rotation || null
  };
};
layer.food.prototype.render_save_buttons = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 5
  });
  var table = $.table(2);
  var self = this;
  var loading = false;
  var create = function(callback) {
    if (!loading) {
      loading = true;
      var args = self.get_args();;
      api('food', 'insert', args, function(food_id) {
        args.food_id = food_id;
        args.timestamp = $.dateISOString();
        self.data.food[food_id] = args;
        self.update_data();
        callback(food_id);
      });
    }
  };
  var button = $.createElement('button').style(this.button_style).innerHTML(
    'CREATE'
  ).addEventListener('click', function() {
    create(function() {
      delete self.img;
      self.render();
    });
  });
  table.tds[0].appendChild(button);
  var button = $.createElement('button').style(this.button_style).innerHTML(
    'CREATE & TRACK'
  ).addEventListener('click', function(food_id) {
    create(function(food_id) {
      go('track_food', food_id);
    });
  });
  table.tds[1].appendChild(button);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.food.prototype.points_select_handler = function() {
  this.points.innerHTML(points(
    this.fat.value() || 0,
    this.carbohydrates.value() || 0,
    this.fiber.value() || 0,
    this.protein.value() || 0
  ));
};
layer.food.prototype.render_complete = function() {
  layer.food.prototype.superClass_.render_complete.apply(this, arguments);
  if (this.fat) {
    this.fat.focus();
  }
};
layer.food.prototype.render_image  = function(parent, opt_view_only) {
  var container = $.createElement('div').style({
    'text-align': 'center',
    'margin-top': 5
  });
  var self = this;
  if (this.img) {
    var image = $.createElement('img');
    var rotate = function(degrees) {
      image.style({
        'transform': 'rotate(' + degrees + 'deg)'
      });
    };
    container.appendChild(image).setAttribute({
      'src': 'img/' + this.img
    });
    if (this.this_class_name !== 'track_food') {
      image.addEventListener('click', function() {
        self.img_rotation = (self.img_rotation + 90) % 360;
        rotate(self.img_rotation);
      });
    }
    rotate(this.img_rotation);
  } else if (!opt_view_only) {
    var file = $.createElement('input').style({
      'width': '100%'
    }).setAttribute({
      'type': 'file',
      'aceept': 'image/*',
      'capture': 'camera'
    }).addEventListener('change', function() {
      var reader = new FileReader();
      if (file[0].files[0]) {
        reader.readAsDataURL(file[0].files[0]);
        reader.addEventListener('load', function(e) {
          var image = $.createElement('img').setAttribute({
            'src': reader.result
          }).addEventListener('load', function() {
            var multiplier =
              image.getAttribute('width') /
              image.getAttribute('height');
            var width = 300;
            var height = 300;
            if (multiplier < 1) {
              width *= multiplier;
            } else {
              height /= multiplier;
            }
            var canvas = $.createElement('canvas').setAttribute({
              'width': width,
              'height': height
            });
            var context = canvas[0].getContext('2d');
            context.drawImage(image[0], 0, 0, width, height);
            var shrinked = canvas[0].toDataURL('image/jpeg');
            container.appendChild($.createElement('img').setAttribute({
              'src': shrinked
            }));
            api('img', 'upload', shrinked.substr(23), function(filename) {
              self.img = filename;
              self.img_rotation = 0;
            });
          });
        });
      }
    });
    container.appendChild(file);
  }
  parent.appendChild(container);
};





layer.food_search = function() {};
rocket.inherits(layer.food_search, layer.food);
layer.food_search.prototype.render_header = function(parent) {
  var container = $.createElement('div').style({
    'position': 'fixed',
    'top': 0
  });
  this.header_container = container;
  this.render_header_menu_home(container);
  if (!this.food_id) {
    this.render_header_search(container);
    this.render_header_switch(container);
  }
  parent.appendChild(container);
};
layer.food_search.prototype.search_string = '';
layer.food_search.prototype.render_header_search = function(parent) {
  var container = $.createElement('div').style({
    'padding': 5
  });
  var input = $.createElement('input').setAttribute({
    'placeholder': 'Search Food'
  }).style({
    'width': '100%'
  });
  this.search = input;
  var self = this;
  input.addEventListener('afterkeydown', function(e) {
    if (self.search_string !== this.value) {
      self.search_string = this.value;
      self.render_foods();
    }
    if (
      (e.type === 'keyup') &&
      (e.which === $.KEY.enter) &&
      (self.foods_container.children().length === 1)
    ) {
      self.foods_container.firstElementChild().dispatchEvent('click');
    }
  });
  container.appendChild(input);
  parent.appendChild(container);
};
layer.food_search.prototype.switched = 'All';
layer.food_search.prototype.render_header_switch = function(parent) {
  var container = $.createElement('div').style({
    'padding': '0 5px 5px'
  });
  var table = $.table(4).style({
    'background-color': 'white',
    'border': '1px solid #cccccc',
    'opacity': 0.9,
    'border-radius': 10
  });
  table.tbody.style({
    'line-height': 40,
    'text-align': 'center'
  });
  var switches = [
    {'name': 'All'},
    {'name': 'Mine'},
    {'name': 'Tracked'},
    {'name': 'Created'}
  ];
  var self = this;
  var switch_handler = function() {
    for (var i = 0; switches[i] && switches[i].element; ++i) {
      switches[i].element.style({
        'background-color': '',
        'color': ''
      });
    }
    this.style.backgroundColor = '#005589';
    this.style.color = 'white';
    if (self.switched !== this.innerHTML) {
      self.switched = this.innerHTML;
      self.render_foods();
      window.scrollTo(0, 0);
    }
  };
  for (var i = 0; switches[i]; ++i) {
    switches[i].element = table.tds[i].appendChild(
      $.createElement('div').style({
        'border-radius': 10
      }).addEventListener(
        'click',
        switch_handler
      ).innerHTML(
        switches[i].name
      )
    );
    if (switches[i].name === this.switched) {
      switches[i].element.dispatchEvent('click');
    }
  }
  container.appendChild(table);
  parent.appendChild(container);
};
layer.food_search.prototype.render_foods = function(parent) {
  var container = $.createElement('div');
  var self = this;
  container.live('div', 'click', function() {
    var element = this;
    while (container[0] !== element.parentNode) {
      element = element.parentNode;
    }
    go(self.this_class_name, foods[container.children().indexOf(element)].food_id);
  });
  this.foods_container = container;
  var foods = [];
  var search_string = this.search_string.toLowerCase();
  for (var food_id in this.data.food) {
    var food = this.data.food[food_id];
    if (
      !search_string ||
      (food.name.toLowerCase().indexOf(search_string) !== -1)
    ) {
      if (
        (this.switched === 'All') ||
        (this.switched === 'Created') ||
        (this.switched === 'Mine' && food.user_id == this.data.user.user_id) ||
        (this.switched === 'Tracked' && food.date_time)
      ) {
        foods.push(food);
      }
    }
  }
  if (this.switched === 'Tracked') {
    $.sort(foods, {'key': 'date_time', 'desc': true});
  } else if (this.switched === 'Created') {
    $.sort(foods, {'key': 'timestamp', 'desc': true});
  } else {
    $.sort(foods, 'name');
  }
  for (var i = 0; foods[i]; ++i) {
    this.render_food(container, foods[i]);
  }
  if (parent) {
    parent.appendChild(container);
    this.render_foods_container = container;
  } else {
    this.render_foods_container.parentNode().replaceChild(
      container,
      this.render_foods_container
    );
    this.render_foods_container = container;
  }
};
layer.food_search.prototype.render_food = function(parent, food) {
  var container = $.createElement('div');
  this.render_track_food(
    container,
    food.name,
    food.quantity,
    food.units,
    (food.points === null) ?
      points(
        food.fat,
        food.carbohydrates,
        food.fiber,
        food.protein
      ) :
      food.points,
    null,
    food.img,
    food.img_rotation
  );
  parent.appendChild(container);
};
layer.food_search.prototype.render_complete = function() {
  layer.food_search.prototype.superClass_.render_complete.apply(this, arguments);
  if (this.data && this.search) {
    this.search.focus();
  }
};





layer.logout = function() {};
rocket.inherits(layer.logout, layer);
layer.logout.prototype.render_contents = function() {};
layer.logout.prototype.render_complete = function() {
  $.cookie('key', '');
  for (var i in this.data) {
    delete this.data[i];
  }
  go('login');
};





layer.track_food = function(opt_food_id) {
  this.food_id = opt_food_id
};
rocket.inherits(layer.track_food, layer.food_search);
layer.track_food.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.contents_container = container;
  this.render_header(container);
  if (this.food_id) {
    this.render_track(container);
  } else {
    this.render_foods(container);
  }
  parent.appendChild(container);
};
layer.track_food.prototype.this_class_name = 'track_food';
layer.track_food.prototype.render_track = function(parent) {
  var container = $.createElement('div');
  var table = $.table(2).style({
    'height': 100
  });
  this.render_name_serving(table.tds[0]);
  this.render_points(table.tds[1]);
  container.appendChild(table);
  this.render_quantity_units(container);
  var table = $.table(2);
  this.render_date(table.tds[0]);
  this.render_time(table.tds[1]);
  container.appendChild(table);
  this.render_track_button(container);
  var food = this.data.food[this.food_id];
  this.img = food.img;
  this.img_rotation = food.img_rotation;
  this.render_image(container, true);
  parent.appendChild(container);
};
layer.track_food.prototype.render_name_serving = function(parent) {
  var container = $.createElement('div').style({
    'text-align': 'center'
  });
  var food = this.data.food[this.food_id];
  container.appendChild($.createElement('div').style({
    'font-size': 12,
    'color': '#005589'
  }).innerHTML(
    'TRACK FOOD'
  ));
  container.appendChild($.createElement('div').style({
    'font-size': 14
  }).innerHTML(
    food.name
  ));
  container.appendChild($.createElement('div').style({
    'font-size': 12,
    'color': 'gray'
  }).innerHTML(
    decimal_to_fraction(food.quantity) + ' ' + food.units
  ));
  parent.appendChild(container);
};
layer.track_food.prototype.points_select_handler = function() {
  var units = {};
  for (var i in this.data.unit) {
    units[this.data.unit[i].unit] = this.data.unit[i].multiplier;
  }
  var food = this.data.food[this.food_id];
  var multiplier =
    (this.quantity.value() * units[this.units.value()]) /
    (food.quantity * units[food.units]);
  if (food.points === null) {
    this.points.innerHTML(points(
      multiplier * food.fat,
      multiplier * food.carbohydrates,
      multiplier * food.fiber,
      multiplier * food.protein
    ));
  } else {
    this.points.innerHTML($.round(multiplier * food.points, 0));
  }
};
layer.track_food.prototype.render_date = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style(this.select_style);
  this.date = select;
  var date = new Date();
  for (var i = 0; i < 30; ++i) {
    select.appendChild($.createElement('option').value(
      date.getFullYear() + '-' +
      $.padLeft(date.getMonth() + 1, 2, '0') + '-' +
      $.padLeft(date.getDate(), 2, '0')
    ).innerHTML(
      (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear()
    ));
    date = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() - 1
    );
  }
  this.render_date_value();
  container.appendChild(select);
  parent.appendChild(container);
};
layer.track_food.prototype.render_date_value = function() {};
layer.track_food.prototype.render_time = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style(this.select_style);
  this.time = select;
  for (var hour = 0; hour < 24; ++hour) {
    for (var minute = 0; minute < 60; minute += 5) {
      select.appendChild($.createElement('option').value(
        $.padLeft(hour, 2, '0') + ':' +
        $.padLeft(minute, 2, '0')
      ).innerHTML(
        ((hour % 12) || 12) + ':' +
        $.padLeft(minute, 2, '0') + ' ' +
        ((hour < 12) ? 'am' : 'pm')
      ));
    }
  }
  this.render_time_value();
  container.appendChild(select);
  parent.appendChild(container);
};
layer.track_food.prototype.render_time_value = function() {
  var now = new Date();
  this.time.value(
    $.padLeft(now.getHours(), 2, '0') + ':' +
    $.padLeft(Math.floor(now.getMinutes() / 5) * 5, 2, '0')
  );
};
layer.track_food.prototype.render_track_button = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 5
  });
  var loading = false;
  var self = this;
  var button = $.createElement('button').style(
    this.select_style
  ).innerHTML(
    'TRACK'
  ).addEventListener('click', function() {
    if (!loading) {
      loading = true;
      var args = {
        'food_id': self.food_id,
        'user_id': self.data.user.user_id,
        'date': self.date.value(),
        'time': self.time.value(),
        'quantity': self.quantity.value(),
        'units': self.units.value()
      };
      api('track', 'insert', args, function(track_id) {
        args.track_id = track_id;
        args.timestamp = $.dateISOString();
        self.data.track[track_id] = args;
        self.update_data();
        go('home');
      });
    }
  });
  container.appendChild(button);
  parent.appendChild(container);
};
layer.track_food.prototype.render_quantity_value = function() {
  this.quantity.value(+this.data.food[this.food_id].quantity);
};
layer.track_food.prototype.render_units_value = function() {
  this.units.value(this.data.food[this.food_id].units);
};





layer.edit_track = function(track_id) {
  this.track_id = track_id;
  this.food_id = -1;
};
rocket.inherits(layer.edit_track, layer.track_food);
layer.edit_track.prototype.render_loaded = function(parent) {
  this.food_id = this.data.track[this.track_id].food_id;
  layer.edit_track.prototype.superClass_.render_loaded.apply(this, arguments);
};
layer.edit_track.prototype.render_quantity_value = function() {
  this.quantity.value(+this.data.track[this.track_id].quantity);
};
layer.edit_track.prototype.render_units_value = function() {
  this.units.value(this.data.track[this.track_id].units);
};
layer.edit_track.prototype.render_date_value = function() {
  this.date.value(this.data.track[this.track_id].date);
};
layer.edit_track.prototype.render_time_value = function() {
  this.time.value(this.data.track[this.track_id].time.substr(0, 5));
};
layer.edit_track.prototype.render_track_button = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 5
  });
  var loading = false;
  var self = this;
  var table = $.table(2);
  var button = $.createElement('button').style(
    this.select_style
  ).innerHTML(
    'DELETE'
  ).addEventListener('click', function() {
    if (!loading) {
      api('track', 'delete', self.track_id, function() {
        delete self.data.track[self.track_id];
        self.update_data();
        go('home');
      });
    }
  });
  table.tds[0].appendChild(button);
  var button = $.createElement('button').style(
    this.select_style
  ).innerHTML(
    'UPDATE'
  ).addEventListener('click', function() {
    if (!loading) {
      loading = true;
      var args = {
        'food_id': self.food_id,
        'user_id': self.data.user.user_id,
        'date': self.date.value(),
        'time': self.time.value(),
        'quantity': self.quantity.value(),
        'units': self.units.value()
      };
      api('track', 'update', {'track_id': self.track_id, 'attributes': args}, function(track_id) {
        args.track_id = self.track_id;
        self.data.track[self.track_id] = args;
        self.update_data();
        go('home');
      });
    }
  });
  table.tds[1].appendChild(button);
  container.appendChild(table);
  parent.appendChild(container);
};





layer.create_food = function() {};
rocket.inherits(layer.create_food, layer.food);
layer.create_food.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.render_header(container);
  this.render_food_fields(container);
  parent.appendChild(container);
};






layer.quick_create = function() {};
rocket.inherits(layer.quick_create, layer.create_food);
layer.quick_create.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.render_header(container);
  this.render_fields(container);
  parent.appendChild(container);
};
layer.quick_create.prototype.render_fields = function(parent) {
  var container = $.createElement('div');
  this.contents_container = container;
  this.render_points(container);
  this.render_name(container);
  this.render_quantity_units(container);
  this.render_save_buttons(container);
  parent.appendChild(container);
};
layer.quick_create.prototype.render_points = function(parent) {
  var container = $.createElement('div').style({
    'padding-top': 5,
    'margin': '0 5px'
  });
  var table = $.table(2);
  table.tds[0].setAttribute({
    'width': 50
  }).innerHTML('Points');
  var select = $.createElement('select').style(this.select_style);
  this.points = select;
  for (var i = 0; i < 100; ++i) {
    select.appendChild($.createElement('option').innerHTML(i));
  }
  table.tds[1].appendChild(select);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.quick_create.prototype.get_args = function() {
  return {
    'name': this.name.value(),
    'points': this.points.value(),
    'type': 'food',
    'fat': 0,
    'carbohydrates': 0,
    'fiber': 0,
    'protein': 0,
    'quantity': this.quantity.value(),
    'units': this.units.value(),
    'user_id': this.data.user.user_id
  };
};
layer.quick_create.prototype.points_select_handler = function() {};





layer.update_weight = function() {};
rocket.inherits(layer.update_weight, layer.food);
layer.update_weight.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.contents_container = container;
  this.render_header(container);
  this.render_weight(container);
  this.render_update_weight(container);
  parent.appendChild(container);
};
layer.update_weight.prototype.render_weight = function(parent) {
  var container = $.createElement('div').style({
    'padding-top': 5
  });
  var table = $.table(3);
  var select = $.createElement('select').style(this.select_style);
  this.weight_pounds = select;
  for (var i = 120; i < 300; ++i) {
    select.appendChild($.createElement('option').innerHTML(i));
  }
  select.value(Math.floor(this.data.user.weight));
  table.tds[0].appendChild(select);
  table.tds[1].style({
    'width': 10,
    'text-align': 'center',
    'font-size': 24
  }).innerHTML('.');
  var select = $.createElement('select').style(this.select_style);
  this.weight_tenths = select;
  for (var i = 0; i < 10; ++i) {
    select.appendChild($.createElement('option').value(i / 10).innerHTML(i));
  }
  select.value($.round(this.data.user.weight - Math.floor(this.data.user.weight), 1));
  table.tds[2].appendChild(select);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.update_weight.prototype.render_update_weight = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 5
  });
  var self = this;
  var loading = false;
  var button = $.createElement('button').style(this.button_style).innerHTML(
    'UPDATE WEIGHT'
  ).addEventListener('click', function() {
    if (!loading) {
      loading = true;
      var weight = +self.weight_pounds.value() + +self.weight_tenths.value();
      api('user', 'update_weight', {
        'user_id': self.data.user.user_id,
        'weight': weight
      }, function(weight_id) {
        self.data.weight[weight_id] = {
          'weight': weight,
          'timestamp': $.dateISOString()
        };
        self.data.user.weight = weight;
        self.update_data();
        go('home');
      });
    }
  });
  container.appendChild(button);
  parent.appendChild(container);
};




layer.edit_food = function(opt_food_id) {
  this.food_id = opt_food_id;
};
rocket.inherits(layer.edit_food, layer.food_search);
layer.edit_food.prototype.this_class_name = 'edit_food';
layer.edit_food.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.contents_container = container;
  this.render_header(container);
  if (this.food_id) {
    this.render_edit(container);
  } else {
    this.render_foods(container);
  }
  parent.appendChild(container);
};
layer.edit_food.prototype.render_edit = function(parent) {
  var container = $.createElement('div');
  var food = this.data.food[this.food_id];
  this.img = food.img;
  this.img_rotation = food.img_rotation;
  this.render_food_fields(container);
  this.fat.value(+food.fat);
  this.carbohydrates.value(+food.carbohydrates);
  this.fiber.value(+food.fiber);
  this.protein.value(+food.protein);
  this.name.value(food.name);
  this.quantity.value(+food.quantity);
  this.units.value(food.units);
  this.points_select_handler();
  parent.appendChild(container);
};
layer.edit_food.prototype.render_save_buttons = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 5
  });
  var table = $.table(2);
  var self = this;
  var loading = false;
  var button = $.createElement('button').style(this.button_style).innerHTML(
    'DELETE'
  ).addEventListener('click', function() {
    if (!loading) {
      for (var track_id in self.data.track) {
        var track = self.data.track[track_id];
        if (track.food_id == self.food_id) {
          alert(
            'You can not delete a food you have tracked (on ' +
              track.date.split('-')[1] + '/' +
              track.date.split('-')[2] + '/' +
              track.date.split('-')[0] +
            ')'
          );
          return;
        }
      }
      loading = true;
      api('food', 'delete', self.food_id, function() {
        delete self.data.food[self.food_id];
        go('edit_food');
      });
    }
  });
  table.tds[0].appendChild(button);
  var button = $.createElement('button').style(this.button_style).innerHTML(
    'UPDATE'
  ).addEventListener('click', function(food_id) {
    if (!loading) {
      loading = true;
      var args = self.get_args();
      api('food', 'update', {'food_id': self.food_id, 'attributes': args}, function() {
        $.extend(self.data.food[self.food_id], args);
        go('edit_food');
      });
    }
  });
  table.tds[1].appendChild(button);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.edit_food.prototype.render_complete = function() {
  layer.edit_food.prototype.superClass_.render_complete.apply(this, arguments);
  if (
    (this.data) &&
    (this.food_id) &&
    (this.data.food[this.food_id].user_id != this.data.user.user_id) &&
    (this.data.user.user_id != 1)
  ) {
    alert('You can only edit food you have created');
    go('edit_food');
  }
};




layer.create_activity = function() {};
rocket.inherits(layer.create_activity, layer.quick_create);
layer.create_activity.prototype.get_args = function() {
  return {
    'name': this.name.value(),
    'points': -1 * this.points.value(),
    'type': 'activity',
    'fat': 0,
    'carbohydrates': 0,
    'fiber': 0,
    'protein': 0,
    'quantity': this.quantity.value(),
    'units': this.units.value(),
    'user_id': this.data.user.user_id
  };
};
layer.create_activity.prototype.render_units_value = function() {
  this.units.value('hour');
};










