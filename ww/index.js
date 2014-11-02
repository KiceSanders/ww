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
var decimal_to_fraction = function(str) {
  str = '' + +str;
  str = str.replace('.125', ' 1/8');
  str = str.replace('.25', ' 1/4');
  str = str.replace('.5', ' 1/2');
  str = str.replace('.75', ' 3/4');
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
  if (this.data) {
    this.render_loaded(parent);
  } else {
    this.render_loading(parent);
  }
};
layer.home.prototype.render_loading = function() {
  var self = this;
  api('user', 'load', this.date, function(data) {
    layer.prototype.data = self.data = data;
    self.handle_data();
    self.render();
  });
};
layer.home.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.render_header(container);
  this.render_tracks(container);
  parent.appendChild(container);
};
layer.home.prototype.handle_data = function() {
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
  this.render_points_daily(table.tds[0]);
  this.render_points_used(table.tds[1]);
  this.render_points_remaining(table.tds[2]);
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
    if (this.data.weight[i].timestamp.substr(0, 10) < date) {
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
  var time = ((track.time.split(':')[0] % 12) || 0) + ':' +
    track.time.split(':')[1] + ' ' +
    ((track.time.split(':')[0] < 13) ? 'am' : 'pm');
  this.render_track_food(
    container,
    food.name,
    track.quantity,
    track.units,
    track.points,
    time
  );
  parent.appendChild(container);
};
layer.home.prototype.render_track_food =
    function(parent, name, quantity, units, points, time) {

  var container = $.createElement('div').style({
    'border-bottom': '1px solid #eeeeee'
  });
  var table = $.table(2).style({
    'height': 40
  });
  table.tds[0].style({
    'padding-left': 5
  });
  table.tds[0].appendChild($.createElement('div').innerHTML(
    name
  ));
  table.tds[0].appendChild($.createElement('div').style({
    'color': 'gray',
    'font-size': 10
  }).innerHTML(
    (time ? (time + ' - ') : '') +
    decimal_to_fraction(quantity) + ' ' + units
  ));
  table.tds[1].style({
    'width': 60,
    'text-align': 'center'
  });
  table.tds[1].innerHTML(points);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.home.prototype.render_complete = function() {
  if (this.data) {
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
      'name': 'Track Activity',
      'go': 'track'
    },
    {
      'name': 'Create Activity',
      'go': 'track'
    },
    {
      'name': 'Edit Activity',
      'go': 'track'
    },
    {
      'name': 'Track Recipe',
      'go': 'track'
    },
    {
      'name': 'Create Recipe',
      'go': 'track'
    },
    {
      'name': 'Edit Recipe',
      'go': 'track'
    },
    {
      'name': 'Set Weight',
      'go': 'track'
    },
    {
      'name': 'Change Password',
      'go': 'track'
    },
    {
      'name': 'Change Username',
      'go': 'track'
    },
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
    go(item.go, item.arguments);
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

layer.track_food = function(opt_food_id) {
  this.food_id = opt_food_id
};
rocket.inherits(layer.track_food, layer.food);
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
layer.track_food.prototype.render_header = function(parent) {
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
layer.track_food.prototype.search_string = '';
layer.track_food.prototype.render_header_search = function(parent) {
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
  input.addEventListener('afterkeydown', function() {
    if (self.search_string !== this.value) {
      self.search_string = this.value;
      self.render_foods();
    }
  });
  container.appendChild(input);
  parent.appendChild(container);
};
layer.track_food.prototype.switched = 'All';
layer.track_food.prototype.render_header_switch = function(parent) {
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
layer.track_food.prototype.render_foods = function(parent) {
  var container = $.createElement('div');
  container.live('div', 'click', function() {
    var element = this;
    while (container[0] !== element.parentNode) {
      element = element.parentNode;
    }
    go('track_food', foods[container.children().indexOf(element)].food_id);
  });
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
        (this.switched === 'Recipe' && food.type === 'recipe') ||
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
    if (foods[i].type !== 'activity') {
      this.render_food(container, foods[i]);
    }
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
layer.track_food.prototype.render_food = function(parent, food) {
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
      food.points
  );
  parent.appendChild(container);
};
layer.track_food.prototype.render_complete = function() {
  layer.track_food.prototype.superClass_.render_complete.apply(this, arguments);
  if (this.data && this.search) {
    this.search.focus();
  }
};
layer.track_food.prototype.render_track = function(parent) {
  var container = $.createElement('div');
  var table = $.table(2).style({
    'height': 100
  });
  this.render_name_serving(table.tds[0]);
  this.render_points(table.tds[1]);
  container.appendChild(table);
  var table = $.table(2);
  this.render_quantity(table.tds[0]);
  this.render_units(table.tds[1]);
  container.appendChild(table);
  var table = $.table(2);
  this.render_date(table.tds[0]);
  this.render_time(table.tds[1]);
  container.appendChild(table);
  this.render_track_button(container);
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
layer.track_food.prototype.select_style = {
  'width': '100%',
  'height': 40
};
layer.track_food.prototype.select_handler = function() {
  var units = {};
  for (var i in this.data.unit) {
    units[this.data.unit[i].unit] = this.data.unit[i].multiplier;
  }
  var food = this.data.food[this.food_id];
  var multiplier =
    (this.quantity.value() * units[this.units.value()]) /
    (food.quantity * units[food.units]);
  this.points.innerHTML(points(
    multiplier * food.fat,
    multiplier * food.carbohydrates,
    multiplier * food.fiber,
    multiplier * food.protein
  ));
};
layer.track_food.prototype.render_quantity = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style(this.select_style);
  this.quantity = select;
  var fractions = ['0','1/8','1/4','1/2','3/4'];
  for (var i = 0; i < 100; ++i) {
    for (var j = 0; fractions[j]; ++j) {
      select.appendChild($.createElement('option').value(
        i + eval(fractions[j])
      ).innerHTML(
        i + ' ' + (eval(fractions[j]) ? fractions[j] : '')
      ));
    }
  }
  this.render_quantity_value();
  var self = this;
  select.addEventListener('keyup,change,blur', function() {
    self.select_handler();
  });
  container.appendChild(select);
  parent.appendChild(container);
};
layer.track_food.prototype.render_quantity_value = function() {
  this.quantity.value(+this.data.food[this.food_id].quantity);
};
layer.track_food.prototype.render_units = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style(this.select_style);
  this.units = select;
  var self = this;
  for (var i in this.data.unit) {
    select.appendChild($.createElement('option').innerHTML(this.data.unit[i].unit));
  }
  this.render_units_value();
  select.addEventListener('keyup,change,blur', function() {
    self.select_handler();
  });
  select.dispatchEvent('change');
  container.appendChild(select);
  parent.appendChild(container);
};
layer.track_food.prototype.render_units_value = function() {
  this.units.value(this.data.food[this.food_id].units);
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
        ((hour < 13) ? 'am' : 'pm')
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
        self.data.track[track_id] = args;
        self.handle_data();
        go('home');
      });
    }
  });
  container.appendChild(button);
  parent.appendChild(container);
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
        self.handle_data();
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
        self.data.track[self.track_id] = args;
        self.handle_data();
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
  this.render_fields(container);
  parent.appendChild(container);
};
layer.create_food.prototype.render_header = function(parent) {
   var container = $.createElement('div').style({
    'position': 'fixed',
    'top': 0
  });
  this.header_container = container;
  this.render_header_menu_home(container);
  parent.appendChild(container);
};
layer.create_food.prototype.render_fields = function(parent) {
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
  this.render_create_track(container);
  parent.appendChild(container);
};
layer.create_food.prototype.render_fat_carbohydrates_fiber_protein = function(parent) {
  var container = $.createElement('div').style({
    'margin': 5
  });
  var items = ['Fat', 'Carbohydrates', 'Fiber', 'Protein'];
  for (var i = 0; items[i]; ++i) {
    this.render_item(container, items[i]);
  }
  parent.appendChild(container);
};
layer.create_food.prototype.render_item = function(parent, item) {
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
    'type': 'number',
    'placeholder': 'grams'
  }).addEventListener('afterkeydown', function() {
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
layer.create_food.prototype.render_name = function(parent) {
  var container = $.createElement('div').style({
    'margin': '-5px 5px 5px'
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
layer.create_food.prototype.render_create_track = function(parent) {
  var container = $.createElement('div');
  var table = $.table(2);
  var button_style = {
    'width': '100%',
    'height': 40
  };
  var self = this;
  var loading = false;
  var create = function(callback) {
    if (!loading) {
      loading = true;
      var args = {
        'name': self.name.value(),
        'type': 'food',
        'fat': self.fat.value(),
        'carbohydrates': self.carbohydrates.value(),
        'fiber': self.fiber.value(),
        'protein': self.protein.value(),
        'quantity': self.quantity.value(),
        'units': self.unts.value(),
        'user_id': self.data.user.user_id
      };
      api('food', 'insert', args, function(food_id) {
        args.food_id = food_id;
        self.data.food[food_id] = args;
        self.handle_data();
        callback(food_id);
      });
    }

  };
  var button = $.createElement('button').style(button_style).innerHTML(
    'CREATE'
  ).addEventListener('click', function() {
    create(function() {
      go('home');
    });
  });
  table.tds[0].appendChild(button);
  var button = $.createElement('button').style(button_style).innerHTML(
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


















