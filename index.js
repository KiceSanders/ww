var $ = rocket.extend(rocket.$, rocket);
var api = function(cls, fnct, args, callback) {
  $.post(
    'index.php',
    {
      'username': $.cookie('username'),
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
var go_home = function() {

  var date = new Date(
   (new Date()).getFullYear(),
   (new Date()).getMonth(),
   (new Date()).getDate()
  );

  document.location.hash = '#/home/' + $.dateISOString(date).substr(0, 10) + '/';

};
rocket.ready(function() {

  if (!document.location.hash) {
   if ($.cookie('username')) {
     go_home();
   } else {
     document.location.hash = '#/user_picker/';
   }
  }

  hash_change();

});
var points = function(fat, carbohydrates, fiber, protein, opt_decimals) {
  return Math.max(0, $.round(
    (16  * protein + 19 * carbohydrates + 45 * fat - 14 * fiber) / 175,
    opt_decimals || decimals
  ));

};
var decimal_to_fraction = function(str) {
  str = '' + str;
  str = str.replace('.125', ' 1/8');
  str = str.replace('.25', ' 1/4');
  str = str.replace('.5', ' 1/2');
  str = str.replace('.75', ' 3/4');
  return str;
};



var decimals = 0;




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




layer.user_picker = function() {};
rocket.inherits(layer.user_picker, layer);
layer.user_picker.prototype.render_contents = function(parent) {
  var container = $.createElement('div');
  this.render_username(container);
  this.render_submit(container);
  parent.appendChild(container);
};
layer.user_picker.prototype.render_username = function(parent) {
  parent.appendChild(this.username = $.createElement('input'));
  var self = this;
  this.username.addEventListener('keydown', function(e) {
    if (e.which === $.KEY.enter) {
      self.login.dispatchEvent('click');
    }
  });
};
layer.user_picker.prototype.render_submit = function(parent) {
  parent.appendChild(this.login = $.createElement('button').innerHTML('login'));
  var self = this;
  this.login.addEventListener('click', function() {
    if (self.username.value()) {
      api('user', 'get', {'username': self.username.value()}, function(data) {
        if (data) {
          $.cookie('username', self.username.value(), 90);
          go_home();
        } else {
          document.location.hash = '#/user_creator/' + self.username.value() + '/';
        }
      });
    }
  });
};
layer.user_picker.prototype.render_complete = function() {
  this.username.focus();
};




layer.user_creator = function(desired_username) {
  this.desired_username = desired_username;
  layer.constructor.apply(this, arguments);
};
rocket.inherits(layer.user_creator, layer);
layer.user_creator.prototype.render_contents = function(parent) {
  var container = $.createElement('div');
  var table = $.table(2, 5);
  this.render_username(table.trs[0]);
  this.render_gender(table.trs[1]);
  this.render_height(table.trs[2]);
  this.render_weight(table.trs[3]);
  this.render_date_of_birth(table.trs[4]);
  container.appendChild(table);
  this.render_create(container);
  parent.appendChild(container);
  this.username.focus();
};
layer.user_creator.prototype.render_username = function(tr) {
  tr.tds[0].appendChild($.createElement('div').innerHTML('username'));
  this.username = $.createElement('input').value(this.desired_username);
  tr.tds[1].appendChild(this.username);
};
layer.user_creator.prototype.render_gender = function(tr) {
  tr.tds[0].appendChild($.createElement('div').innerHTML('gender'));
  this.gender = $.createElement('select');
  this.gender.appendChild($.createElement('option').innerHTML('male'));
  this.gender.appendChild($.createElement('option').innerHTML('female'));
  tr.tds[1].appendChild(this.gender);
};
layer.user_creator.prototype.render_height = function(tr) {
  tr.tds[0].appendChild($.createElement('div').innerHTML('height (inches)'));
  this.height = $.createElement('select');
  var inches = $.range(48, 84);
  for (var i = 0; inches[i]; ++i) {
    this.height.appendChild($.createElement('option').innerHTML(inches[i]));
  }
  tr.tds[1].appendChild(this.height);
};
layer.user_creator.prototype.render_weight = function(tr) {
  tr.tds[0].appendChild($.createElement('div').innerHTML('weight (pounds)'));
  this.weight = $.createElement('select');
  var pounds = $.range(120, 250);
  for (var i = 0; pounds[i]; ++i) {
    this.weight.appendChild($.createElement('option').innerHTML(pounds[i]));
  }
  tr.tds[1].appendChild(this.weight);
};
layer.user_creator.prototype.render_date_of_birth = function(tr) {
  tr.tds[0].appendChild($.createElement('div').innerHTML('date of birth'));
  var self = this;
  this.date_of_birth = {
    'value': function() {
      return '' +
        self.year_of_birth.value() + '-' +
        $.padLeft(self.month_of_birth.value(), 2, '0') + '-' +
        $.padLeft(self.day_of_birth.value(), 2, '0');
    }
  };
  this.month_of_birth = $.createElement('select');
  var months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  for (var i = 0; months[i]; ++i) {
    this.month_of_birth.appendChild($.createElement('option').value(i + 1).innerHTML(months[i]));
  }
  tr.tds[1].appendChild(this.month_of_birth);
  this.day_of_birth = $.createElement('select');
  var days = $.range(1, 31);
  for (var i = 0; days[i]; ++i) {
    this.day_of_birth.appendChild($.createElement('option').value(days[i]).innerHTML(days[i]));
  }
  tr.tds[1].appendChild(this.day_of_birth);
  this.year_of_birth = $.createElement('select');
  var years = $.range(1900, 20000);
  for (var i = 0; years[i]; ++i) {
    this.year_of_birth.appendChild($.createElement('option').value(years[i]).innerHTML(years[i]));
  }
  tr.tds[1].appendChild(this.year_of_birth);
};
layer.user_creator.prototype.render_create = function(parent) {
  parent.appendChild(this.create = $.createElement('button').innerHTML('create'));
  var self = this;
  this.create.addEventListener('click', function() {
    api('user', 'insert', {
      'username': self.username.value(),
      'height': self.height.value(),
      'weight': self.weight.value(),
      'gender': self.gender.value(),
      'date_of_birth': self.date_of_birth.value()
    }, function() {
      $.cookie('username', self.username.value(), 90);
      go_home();
    });
  });
};




layer.home = function(date) {
  this.date = date;
};
rocket.inherits(layer.home, layer);
layer.home.prototype.render_contents = function(parent) {
  if (this.data) {
    this.render_loaded(parent);
  } else if (layer.home.data && this.date in layer.home.data.points) {
    this.data = layer.home.data;
    this.render_loaded(parent);
  } else {
    this.render_loading(parent);
  }
};
layer.home.prototype.render_loading = function(parent) {
  var self = this;
  api('user', 'points', {
    'username': $.cookie('username'),
    'date': this.date
  },
  function(result) {
    layer.home.data = self.data = result;
    self.render();
  });
};
layer.home.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.render_header(container);
  this.render_points(container);
  this.render_footer(container);
  this.render_tracks(container);
  parent.appendChild(container);
};
layer.home.prototype.render_header = function(parent) {
  var container = $.createElement('div').style({
    'position': 'fixed',
    'top': 0,
    'width': '100%'
  });
  this.header_container = container;
  var table = $.table(3);
  table.style({
    'background-color': '#005589',
    'color': 'white',
    'height': 50
  });
  table.tbody.style({
    'font-size': 14
  });
  table.tds[0].setAttribute({
    'width': '20%',
    'align': 'center'
  });
  table.tds[1].setAttribute({
    'align': 'center'
  });
  table.tds[2].setAttribute({
    'width': '20%',
    'align': 'center'
  });
  this.render_header_previous_next(table.tds[0], -1);
  this.render_header_title(table.tds[1]);
  this.render_header_previous_next(table.tds[2], +1);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.home.prototype.render_header_previous_next = function(parent, offset) {
  var container = $.createElement('div').style({
    'font-size': 28
  });
  if (offset < 0) {
    container.innerHTML('&lt;');
  } else {
    container.innerHTML('&gt;');
  }
  var self = this;
  container.addEventListener('click', function() {
    var date = $.strToDate(self.date);
    date = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + offset
    );
    document.location.hash = '#/home/' + $.dateISOString(date).substr(0, 10) + '/';
  });
  parent.appendChild(container);
};
layer.home.prototype.render_header_title = function(parent) {
  var container = $.createElement('div');
  var day_of_week = ([
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
  ])[$.strToDate(this.date).getDay()];
  container.innerHTML(
    this.data.user.username + ' ' +
    day_of_week + ' ' +
    this.date.split('-')[1] + '/' + this.date.split('-')[2] + '/' + this.date.split('-')[0]
  );
  parent.appendChild(container);
};
layer.home.prototype.render_points = function(parent) {
  var container = $.createElement('div').style({
    'position': 'fixed',
    'width': '100%',
    'top': 0,
    'border-bottom': '1px solid gray',
    'background-color': 'white',
    'opacity': 0.9
  });
  this.points_container = container;
  var table = $.table(5);
  table.style({
    'height': 60
  });
  table.tbody.style({
    'text-align': 'center'
  });
  this.render_points_daily_used(table.tds[0]);
  this.render_points_daily_remaining(table.tds[1]);
  this.render_points_weekly_remaining(table.tds[2]);
  this.render_points_activity_earned(table.tds[3]);
  this.render_points_activity_remaining(table.tds[4]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.home.prototype.points_label = {
  'font-size': 8,
  'color': 'gray'
};
layer.home.prototype.points_value = {
  'font-size': 28,
  'color': '#ef6103'
};
layer.home.prototype.points_right_border = {
  'border-right': '1px dotted gray'
};
layer.home.prototype.render_points_daily_used = function(parent) {
  var container = $.createElement('div').style(this.points_right_border);

  container.appendChild(
    $.createElement('div').style(
      this.points_label
    ).innerHTML('Daily<br/>Used')
  );
  container.appendChild(
    $.createElement('div').style(
      this.points_value
    ).innerHTML(this.data.points[this.date])
  );

  parent.appendChild(container);
};
layer.home.prototype.render_points_daily_remaining = function(parent) {
  var container = $.createElement('div').style(this.points_right_border);

  container.appendChild(
    $.createElement('div').style(
      this.points_label
    ).innerHTML('Daily<br/>Remaining')
  );
  container.appendChild(
    $.createElement('div').style(
      this.points_value
    ).innerHTML(
      $.round(this.data.user.points - this.data.points[this.date], decimals)
    )
  );

  parent.appendChild(container);
};
layer.home.prototype.render_points_weekly_remaining = function(parent) {
  var container = $.createElement('div').style(this.points_right_border);
  container.appendChild(
    $.createElement('div').style(
      this.points_label
    ).innerHTML('Weekly<br/>Remaining')
  );
  container.appendChild(
    $.createElement('div').style(
      this.points_value
    ).innerHTML($.round(this.data.weekly_points[this.date]), decimals)
  );
  parent.appendChild(container);
};
layer.home.prototype.render_points_activity_earned = function(parent) {
  var container = $.createElement('div').style(this.points_right_border);

  container.appendChild(
    $.createElement('div').style(
      this.points_label
    ).innerHTML('Activity<br/>Earned')
  );
  container.appendChild(
    $.createElement('div').style(
      this.points_value
    ).innerHTML(this.data.activity_points[this.date])
  );

  parent.appendChild(container);
};
layer.home.prototype.render_points_activity_remaining = function(parent) {
  var container = $.createElement('div');

  container.appendChild(
    $.createElement('div').style(
      this.points_label
    ).innerHTML('Activity<br/>Remaining')
  );
  container.appendChild(
    $.createElement('div').style(
      this.points_value
    ).innerHTML(this.data.activity_points_remaining[this.date])
  );

  parent.appendChild(container);
};
layer.home.prototype.render_tracks = function(parent) {
  var container = $.createElement('div');
  this.tracks_container = container;
  var sorted = [];
  for (var track_id in this.data.track) {
    if (this.data.track[track_id].date === this.date) {
      sorted.push(this.data.track[track_id]);
    }
  }
  var rendered = {};
  $.sort(sorted, 'time');
  for (var i = 0; sorted[i]; ++i) {
    this.render_track_header(container, sorted[i], rendered);
    this.render_track(container, sorted[i]);
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
  var container = $.createElement('div').style({
    'padding': '5px 10px',
    'border-bottom': '1px solid #eeeeee'
  }).addEventListener('click', function() {
    document.location.hash = '#/track_edit/' + track.track_id + '/';
  });
  var table = $.table(2).style({
    'height': 30
  });
  table.tds[0].appendChild(
    $.createElement('div').style({
      'font-size': 14
    }).innerHTML(this.data.food[track.food_id].name)
  );
  var time = track.time.substr(0, 5);
  time =
    ((time.split(':')[0] % 12) || 12) + ':' + time.split(':')[1] +
    ((time.split(':')[0] > 11) ? ' pm' : ' am');
  table.tds[0].appendChild(
    $.createElement('div').style({
      'font-size': 10,
      'color': 'gray'
    }).innerHTML(time + ' - ' + decimal_to_fraction(track.quantity) + ' ' + track.units)
  );
  table.tds[1].setAttribute({
    'width': 30,
    'align': 'center'
  });
  table.tds[1].innerHTML($.round(track.points, decimals));
  container.appendChild(table);
  parent.appendChild(container);
};
layer.home.prototype.render_footer = function(parent) {
  var container = $.createElement('div').style({
    'position': 'fixed',
    'bottom': 0,
    'width': '100%'
  });
  this.footer_container = container;
  this.render_footer_menu(container);
  container.addEventListener('click', function() {
    document.location.hash = '#/menu/';
  });
  parent.appendChild(container);
};
layer.home.prototype.render_footer_menu = function(parent) {
  var container = $.createElement('div').style({
    'border-top': '1px solid gray',
    'background-color': 'white',
    'opacity': 0.8
  });
  var table = $.table(1);
  table.style({
    'height': 50
  });
  table.tbody.style({
    'font-size': 14,
    'color': '#005589'
  });
  table.tds[0].setAttribute({
    'align': 'center'
  });
  table.tds[0].innerHTML('&#x2261; MENU');
  container.appendChild(table);
  parent.appendChild(container);
};
layer.home.prototype.render_complete = function() {
  if (this.header_container) {
    var header = this.header_container.getBoundingClientRect();
    var points = this.points_container.getBoundingClientRect();
    var tracks = this.tracks_container.getBoundingClientRect();
    var footer = this.footer_container.getBoundingClientRect();
    this.points_container.style({
      'margin-top': header.height
    });
    this.tracks_container.style({
      'margin-top': header.height + points.height,
      'margin-bottom': footer.height
    });
  }
};




layer.menu = function() {};
rocket.inherits(layer.menu, layer);
layer.menu.prototype.render_contents = function(parent) {
  var container = $.createElement('div');
  this.render_header(container);
  this.render_items(container);
  parent.appendChild(container);
};
layer.menu.prototype.render_header = function(parent) {
  var container = $.createElement('div').style({
    'position': 'fixed',
    'top': 0,
    'border-bottom': '1px solid gray',
    'background-color': 'white',
    'opacity': 0.9
  });
  this.header_container = container;
  var table = $.table(2);
  table.tbody.style({
    'text-align': 'center',
    'color': '#005589',
    'line-height': 50,
    'font-size': 14
  });
  this.render_header_back(table.tds[0]);
  this.render_header_home(table.tds[1]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.menu.prototype.render_header_back = function(parent) {
  var container = $.createElement('div');
  container.addEventListener('click', function() {
    history.go(-1);
  });
  container.innerHTML('< BACK');
  parent.appendChild(container);
};
layer.menu.prototype.render_header_home = function(parent) {
  var container = $.createElement('div');
  container.addEventListener('click', function() {
    go_home();
  });
  container.innerHTML('HOME');
  parent.appendChild(container);
};
layer.menu.prototype.render_items = function(parent) {
  var items = [
    {
      'code': 'create_food',
      'name': 'Create Food'
    },
    {
      'code': 'add_food',
      'name': 'Add Food'
    },
    {
      'code': 'create_recipe',
      'name': 'Create Recipe'
    },
    {
      'code': 'add_recipe',
      'name': 'Add Recipe'
    },
    {
      'code': 'create_activity',
      'name': 'Create Activity'
    },
    {
      'code': 'add_activity',
      'name': 'Add Activity'
    },
    {
      'code': 'quick_add',
      'name': 'Quick Add'
    },
    {
      'code': 'set_weight',
      'name': 'Set Weight'
    },
    {
      'code': 'log_out',
      'name': 'Log Out'
    },
  ];
  var container = $.createElement('div');
  this.contents = container;
  for (var i = 0; items[i]; ++i) {
    this.render_item(container, items[i]);
  }
  parent.appendChild(container);
};
layer.menu.prototype.render_item = function(parent, item) {
  var container = $.createElement('div').style({
    'padding': '5px 10px',
    'border-bottom': '1px solid #cccccc'
  });
  container.addEventListener('click', function() {
    document.location.hash = '#/' + item.code + '/';
  });
  var table = $.table(2);
  table.style({
    'height': 30
  });
  table.tds[0].innerHTML(item.name);
  table.tds[1].setAttribute({
    'width': 30,
    'align': 'center'
  }).style({
    'color': 'gray'
  });
  table.tds[1].innerHTML('&gt;');
  container.appendChild(table);
  parent.appendChild(container);
};
layer.menu.prototype.render_complete = function() {
  var header = this.header_container.getBoundingClientRect();
  this.contents.style({
    'margin-top': header.height
  });
};



layer.food = function() {};
rocket.inherits(layer.food, layer.menu);
layer.food.prototype.render_serving = function(parent) {
  var container = $.createElement('div');
  var table = $.table(3).style({
    'table-layout': '',
    'height': 30
  });
  table.tbody.style({
    'text-align': 'center'
  });
  this.render_quantity_whole(table.tds[0]);
  this.render_quantity_fraction(table.tds[1]);
  this.render_units(table.tds[2]);
  var self = this;
  this.quantity = {'value': function() {
    return +self.quantity_whole.value() + +self.quantity_fraction.value();
  }};
  container.appendChild(table);
  parent.appendChild(container);
};
layer.food.prototype.render_quantity_whole = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style({
    'font-size': 18
  });
  this.quantity_whole = select;
  var range = $.range(0, 100);
  for (var i = 0; i in range; ++i) {
    select.appendChild($.createElement('option').innerHTML(range[i]));
  }
  var self = this;
  select.addEventListener('click,keyup,change', function() {
    self.changed_serving();
  });
  container.appendChild(select);
  parent.appendChild(container);
};
layer.food.prototype.render_quantity_fraction = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style({
    'font-size': 18
  });
  this.quantity_fraction = select;
  var range = [
    '0',
    '1/8',
    '1/4',
    '1/2',
    '3/4',
  ];
  for (var i = 0; i in range; ++i) {
    select.appendChild($.createElement('option').value(
      eval(range[i])
    ).innerHTML(
      range[i]
    ));
  }
  var self = this;
  select.addEventListener('click,keyup,change', function() {
    self.changed_serving();
  });
  container.appendChild(select);
  parent.appendChild(container);
};
layer.food.prototype.render_units = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style({
    'font-size': 18
  });
  this.units = select;
  for (var i = 0; this.data.unit[i]; ++i) {
    select.appendChild($.createElement('option').innerHTML(
      this.data.unit[i].unit
    ));
  }
  var self = this;
  select.addEventListener('click,keyup,change', function() {
    self.changed_serving();
  });
  container.appendChild(select);
  parent.appendChild(container);
};
layer.food.prototype.render_points = function(parent) {
  var container = $.createElement('div').style({
    'text-align': 'center',
    'padding': 10
  });
  var label = $.createElement('div').style({
    'font-size': 20,
    'color': '#005589'
  });
  label.innerHTML('Points');
  container.appendChild(label);
  var points = $.createElement('div').style({
    'font-size': 42 ,
    'color': '#ef6103'
  });
  this.points = points;
  points.innerHTML('0');
  container.appendChild(points);
  parent.appendChild(container);
};
layer.food.prototype.render_complete = function() {
  if (this.data) {
    var header = this.header_container.getBoundingClientRect();
    this.contents.style({
      'margin-top': header.height
    });
  }
};
layer.food.prototype.changed_serving = function() {};
layer.food.prototype.render_name = function(parent) {
  var container = $.createElement('div').style({
    'padding': '0 10px 10px'
  });
  var table = $.table(2).style({
    'height': 30
  });
  table.tds[0].setAttribute({
    'width': 100
  }).innerHTML('Name');
  var input = $.createElement('input').style({
    'padding': 5,
    'width': '90%'
  });
  this.name = input;
  var self = this;
  input.setAttribute({
    'placeholder': 'name'
  });
  table.tds[1].appendChild(input);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.food.prototype.render_create_track = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10
  });
  var self = this;
  var loading = false;
  var handle = function(track) {
    if (+self.quantity.value()) {
      if (!loading) {
        loading = true;
        api('food', 'insert', {
          'type': 'food',
          'name': self.name.value(),
          'fat': self.fat.value(),
          'carbohydrates': self.carbohydrates.value(),
          'fiber': self.fiber.value(),
          'protein': self.protein.value(),
          'quantity': self.quantity.value(),
          'units': self.units.value(),
          'username': $.cookie('username')
        }, function(food_id) {
          if (track) {
            document.location.hash = '#/track_food/' + food_id + '/';
          } else {
            document.location.reload();
          }
        });
      }
    } else {
      alert('Please select a serving size');
    }
  };
  var create = $.createElement('button').style({
    'height': 40,
    'width': '100%'
  }).innerHTML('CREATE').addEventListener('click', function() {
    handle(false);
  });
  var track = $.createElement('button').style({
    'height': 40,
    'width': '100%'
  }).innerHTML('CREATE + TRACK').addEventListener('click', function() {
    handle(true);
  });
  var table = $.table(2);
  table.tds[0].appendChild(create);
  table.tds[1].appendChild(track);
  container.appendChild(table);
  parent.appendChild(container);
};




layer.create_food = function() {};
rocket.inherits(layer.create_food, layer.food);
layer.create_food.prototype.render_contents = function(parent) {
  if (this.data) {
    this.render_loaded(parent);
  } else {
    this.render_loading(parent);
  }
};
layer.create_food.prototype.render_loading = function(parent) {
  var self = this;
  api('unit', 'select', {}, function(units) {
    self.data = {};
    self.data.unit = units;
    $.sort(self.data.unit, 'unit');
    self.render();
  });
};
layer.create_food.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.contents = container;
  this.render_header(container);
  var table = $.table(2);
  table.tds[0].setAttribute({
    'width': '60%'
  });
  this.render_fat_carbohydrates_fiber_protein(table.tds[0]);
  this.render_points(table.tds[1]);
  container.appendChild(table);
  this.render_name(container);
  this.render_serving(container);
  this.quantity_whole.value(1);
  this.units.value('serving');
  this.render_create_track(container);
  parent.appendChild(container);
};
layer.create_food.prototype.render_fat_carbohydrates_fiber_protein = function(parent) {
  var container = $.createElement('div').style({
    'padding': 10
  });
  var fields = ['Fat', 'Carbohydrates', 'Fiber', 'Protein'];
  for (var i = 0; fields[i]; ++i) {
    this.render_parameter(container, fields[i]);
  }
  parent.appendChild(container);
};
layer.create_food.prototype.render_parameter = function(parent, field) {
  var container = $.createElement('div');
  var table = $.table(2).style({
    'height': 30
  });
  table.tds[0].setAttribute({
    'width': 100
  }).innerHTML(field);
  var input = $.createElement('input').setAttribute({
    'type': 'number'
  }).style({
    'padding': 5,
    'width': '90%'
  });
  this[field.toLowerCase()] = input;
  var self = this;
  input.addEventListener('afterkeydown,blur', function() {
    self.points.innerHTML(points(
      +self.fat.value() || 0,
      +self.carbohydrates.value() || 0,
      +self.fiber.value() || 0,
      +self.protein.value() || 0
    ));
  });
  input.setAttribute({
    'placeholder': 'grams'
  });
  table.tds[1].appendChild(input);
  container.appendChild(table);
  parent.appendChild(container);
};




layer.add_food = function() {};
rocket.inherits(layer.add_food, layer.food);
layer.add_food.prototype.render_contents = function(parent) {
  if (this.data) {
    this.render_loaded(parent);
  } else {
    this.render_loading(parent);
  }
};
layer.add_food.prototype.render_loading = function(parent) {
  var self = this;
  api('food', 'select', {'type': 'food'}, function(data) {
    self.data = {};
    self.data.food = data;
    $.sort(self.data.food, 'name');
    self.render();
  });
};
layer.add_food.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.render_header(container);
  this.render_foods(container);
  parent.appendChild(container);
};
layer.add_food.prototype.render_foods = function(parent) {
  var container = $.createElement('div');
  this.contents = container;
  for (var i = 0; this.data.food[i]; ++i) {
    this.render_food(container, this.data.food[i]);
  }
  container.live('div', 'click', function() {
    if ($(this).dataset('food_id')) {
      document.location.hash = '#/track_food/' + $(this).dataset('food_id') + '/';
    }
  });
  parent.appendChild(container);
};
layer.add_food.prototype.render_food = function(parent, food) {
  var container = $.createElement('div').dataset(
    'food_id', food.food_id
  ).style({
    'padding': '5px 10px',
    'border-bottom': '1px solid #cccccc'
  });
  var table = $.table(2);
  table.tds[0].appendChild($.createElement('div').style({
    'font-size': 14
  }).innerHTML(food.name));
  table.tds[0].appendChild($.createElement('div').style({
    'font-size': 10,
    'color': 'gray'
  }).innerHTML(decimal_to_fraction(food.quantity) + ' ' + food.units));
  table.tds[1].setAttribute({
    'width': 30
  }).innerHTML(food.points);
  container.appendChild(table);
  parent.appendChild(container);
};




layer.track_food = function(food_id) {
  this.food_id = food_id;
};
rocket.inherits(layer.track_food, layer.food);
layer.track_food.prototype.render_contents = function(parent) {
  if (this.data) {
    this.render_loaded(parent);
  } else {
    this.render_loading(parent);
  }
};
layer.track_food.prototype.render_loading = function(parent) {
  var self = this;
  api('multiple', 'curry', [
    {
      'class': 'food',
      'function': 'get',
      'arguments': this.food_id
    },
    {
      'class': 'unit',
      'function': 'select',
      'arguments': {}
    }
  ], function(data) {
    self.data = data;
    $.sort(self.data.unit, 'unit');
    self.render();
  });
};
layer.track_food.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.contents = container;
  this.render_header(container);
  var table = $.table(2);
  table.tds[0].setAttribute({
    'width': '60%'
  });
  this.render_name(table.tds[0]);
  this.render_points(table.tds[1]);
  this.points.innerHTML(this.data.food.points);
  container.appendChild(table);
  this.render_serving(container);
  this.quantity_whole.value(Math.floor(this.data.food.quantity));
  this.quantity_fraction.value(this.data.food.quantity % 1);
  this.units.value(this.data.food.units);
  this.render_date_time(container);
  this.render_track(container);
  this.render_nutritional_info(container);
  parent.appendChild(container);
};
layer.track_food.prototype.render_name = function(parent) {
  var container = $.createElement('div').style({
    'text-align': 'center',
    'line-height': 28
  });
  container.appendChild($.createElement('div').style({
    'font-size': 16
  }).innerHTML(
    this.data.food.name
  ));
  container.appendChild($.createElement('div').style({
    'font-size': 12,
    'color': 'gray'
  }).innerHTML(
    decimal_to_fraction(this.data.food.quantity) + ' ' + this.data.food.units
  ));
  parent.appendChild(container);
};
layer.track_food.prototype.render_date_time = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10
  });
  var table = $.table(2);
  table.tbody.style({
    'text-align': 'center'
  });
  this.render_date(table.tds[0]);
  this.render_time(table.tds[1]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.track_food.prototype.render_date = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style({
    'font-size': 18
  });
  this.date = select;
  var today = new Date();
  for (var i = 0; i < 31; ++i) {
    var day = $.dateISOString(new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - i
    )).substr(0, 10);
    select.appendChild($.createElement('option').value(day).innerHTML(
      day.split('-')[1] + '/' +
      day.split('-')[2] + '/' +
      day.split('-')[0]
    ));
  }
  container.appendChild(select);
  parent.appendChild(container);
};
layer.track_food.prototype.render_time = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style({
    'font-size': 18
  });
  this.time = select;
  for (var hour = 0; hour < 24; ++hour) {
    for (var minute = 0; minute < 60; ++minute) {
      select.appendChild($.createElement('option').value(
        ((hour < 10) ? '0' : '') + hour + ':' +
        ((minute < 10) ? '0' : '') + minute
      ).innerHTML(
        ((hour % 12) || 12) + ':' +
        ((minute < 10) ? '0' : '') + minute + ' ' +
        ((hour > 11) ? 'pm' : 'am')
      ));
    }
  }
  var today = new Date();
  var hours = today.getHours();
  var minutes = today.getMinutes();
  select.value(
    ((hours < 10) ? '0' : '') + hours + ':' +
    ((minutes < 10) ? '0' : '') + minutes
  );
  container.appendChild(select);
  parent.appendChild(container);
};
layer.track_food.prototype.handle_insert_update = function() {
  api('track', 'insert', {
    'food_id': this.food_id,
    'quantity': this.quantity.value(),
    'units': this.units.value(),
    'date': this.date.value(),
    'time': this.time.value(),
    'username': $.cookie('username')
  }, function() {
    delete layer.home.data;
    go_home();
  });
};
layer.track_food.prototype.insert_update_button_text = 'TRACK';
layer.track_food.prototype.render_track = function(parent) {
  var container = $.createElement('div');
  var button = $.createElement('button').style({
    'height': 40,
    'margin-top': 10,
    'width': '100%'
  }).innerHTML(this.insert_update_button_text);
  var self = this;
  var loading = false;
  button.addEventListener('click', function() {
    if (!loading) {
      loading = true;
      self.handle_insert_update();
    }
  });
  container.appendChild(button);
  parent.appendChild(container);
};
layer.track_food.prototype.render_nutritional_info = function(parent) {
  var container = $.createElement('div');
  var fieldset = $.createElement('fieldset').style({
    'margin': 10,
    'border': '1px solid #cccccc'
  });
  fieldset.appendChild($.createElement('legend').innerHTML(
    'Nutrients - ' +
    decimal_to_fraction(this.data.food.quantity) + ' ' + this.data.food.units
  ));
  var fields = ['Fat', 'Carbohydrates', 'Fiber', 'Protein'];
  for (var i = 0; fields[i]; ++i) {
    var table = $.table(2);
    table.tds[1].setAttribute({
      'align': 'right'
    });
    table.tds[0].innerHTML(fields[i]);
    table.tds[1].innerHTML(this.data.food[fields[i].toLowerCase()] + ' g');
    fieldset.appendChild(table);
  }
  container.appendChild(fieldset);
  parent.appendChild(container);
};
layer.track_food.prototype.changed_serving = function() {
  var food_multiplier = 1;
  var selected_multiplier = 1;
  for (var i = 0; this.data.unit[i]; ++i) {
    if (this.data.unit[i].unit === this.data.food.units) {
      food_multiplier = this.data.unit[i].multiplier;
    }
    if (this.data.unit[i].unit === this.units.value()) {
      selected_multiplier = this.data.unit[i].multiplier;
    }
  }
  this.points.innerHTML($.round(
    this.quantity.value() / this.data.food.quantity *
    selected_multiplier / food_multiplier *
    points(
      this.data.food.fat,
      this.data.food.carbohydrates,
      this.data.food.fiber,
      this.data.food.protein,
      4
    ),
    decimals
  ));
};




layer.track_edit = function(track_id) {
  this.track_id = track_id;
};
rocket.inherits(layer.track_edit, layer.track_food);
layer.track_edit.prototype.render_contents = function(parent) {
  if (this.data) {
    this.render_loaded(parent);
  } else {
    this.render_loading(parent);
  }
};
layer.track_edit.prototype.render_loading = function(parent) {
  var self = this;
  api('multiple', 'curry', [
    {
      'class': 'track',
      'function': 'get',
      'arguments': this.track_id
    },
    {
      'class': 'food',
      'function': 'get',
      'arguments': {
        'food_id': '=track.food_id'
      }
    },
    {
      'class': 'unit',
      'function': 'select',
      'arguments': {}
    }
  ], function(data) {
    self.data = data;
    self.food_id = data.food.food_id;
    $.sort(self.data.unit, 'unit');
    self.render();
  });
};
layer.track_edit.prototype.render_loaded = function(parent) {
  layer.track_food.prototype.render_loaded.apply(this, arguments);
  this.quantity_whole.value(Math.floor(this.data.track.quantity));
  this.quantity_fraction.value(this.data.track.quantity % 1);
  this.units.value(this.data.track.units);
  this.date.value(this.data.track.date);
  this.time.value(this.data.track.time.substr(0, 5));
  this.changed_serving();
  this.render_delete(parent);
};
layer.track_edit.prototype.insert_update_button_text = 'UPDATE';
layer.track_edit.prototype.handle_insert_update = function() {
  api('track', 'update', {
    'track_id': this.track_id,
    'attributes': {
      'food_id': this.food_id,
      'quantity': this.quantity.value(),
      'units': this.units.value(),
      'date': this.date.value(),
      'time': this.time.value()
    }
  }, function() {
    delete layer.home.data;
    go_home();
  });
};
layer.track_edit.prototype.render_delete = function(parent) {
  var container = $.createElement('div');
  var button = $.createElement('button').style({
    'height': 40,
    'margin-top': 10,
    'width': '25%'
  }).innerHTML('DELETE');
  var self = this;
  var loading = false;
  button.addEventListener('click', function() {
    if (!loading) {
      loading = true;
      api('track', 'update', {
        'track_id': self.track_id,
        'attributes': {
          'deleted': 1
        }
      }, function() {
        delete layer.home.data;
        go_home();
      });

    }
  });
  container.appendChild(button);
  parent.appendChild(container);
};




layer.set_weight = function() {};
rocket.inherits(layer.set_weight, layer.food);
layer.set_weight.prototype.render_contents = function(parent) {
  if (this.data) {
    this.render_loaded(parent);
  } else {
    this.render_loading(parent);
  }
};
layer.set_weight.prototype.render_loading = function(parent) {
  var self = this;
  api('user', 'get', {'username': $.cookie('username')}, function(data) {
    self.data = {};
    self.data.user = data;
    self.render();
  });
};
layer.set_weight.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.render_weight(container);
  this.render_set_weight(container);
  parent.appendChild(container);
};
layer.set_weight.prototype.render_weight = function(parent) {
  var container = $.createElement('div');
  this.render_header(container);
  this.contents = container;
  var table = $.table(3).style({
    'padding-top': 10
  });
  table.tds[0].setAttribute({
    'align': 'right'
  });
  this.render_weight_pounds(table.tds[0]);
  table.tds[1].setAttribute({
    'width': 10,
    'align': 'center'
  }).style({
    'font-size': 24
  }).innerHTML('.');
  this.render_weight_tenths(table.tds[2]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.set_weight.prototype.render_weight_pounds = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style({
    'font-size': 24
  });
  this.weight_pounds = select;
  for (var pounds = 100; pounds < 300; ++pounds) {
    select.appendChild($.createElement('option').innerHTML(pounds));
  }
  select.value(Math.floor(this.data.user.weight));
  container.appendChild(select);
  parent.appendChild(container);
};
layer.set_weight.prototype.render_weight_tenths = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style({
    'font-size': 24
  });
  this.weight_tenths = select;
  for (var pounds = 0; pounds < 10; ++pounds) {
    select.appendChild($.createElement('option').innerHTML(pounds));
  }
  select.value(this.data.user.weight % 1 * 10);
  container.appendChild(select);
  parent.appendChild(container);
};
layer.set_weight.prototype.render_set_weight = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10
  });
  var loading = false;
  var self = this;
  var button = $.createElement('button').style({
    'width': '100%',
    'height': 40
  }).innerHTML('SET WEIGHT').addEventListener('click', function() {
    if (!loading) {
      loading = true;
      var weight = +self.weight_pounds.value() + (+self.weight_tenths.value() / 10);
      api('multiple', 'synchronous', [
        {
          'class': 'user',
          'function': 'update',
          'arguments': {
            'user_id': self.data.user.user_id,
            'attributes': {
              'weight': weight
            }
          }
        },
        {
          'class': 'weight',
          'function': 'insert',
          'arguments': {
            'user_id': self.data.user.user_id,
            'weight': weight
          }
        }
      ], function() {
        delete layer.home.data;
        go_home();
      });
    }
  });
  container.appendChild(button);
  parent.appendChild(container);
};




layer.quick_add = function() {};
rocket.inherits(layer.quick_add, layer.food);
layer.quick_add.prototype.render_contents = function(parent) {
  if (this.data) {
    this.render_loaded(parent);
  } else {
    this.render_loading(parent);
  }
};
layer.quick_add.prototype.render_loading = function(parent) {
  var self = this;
  api('unit', 'select', {}, function(units) {
    self.data = {};
    self.data.unit = units;
    $.sort(self.data.unit, 'unit');
    self.render();
  });
};
layer.quick_add.prototype.render_loaded = function(parent) {
  var container = $.createElement('div').style({
    'padding-top': 10
  });
  this.contents = container;
  this.render_header(container);
  this.render_name(container);
  this.render_points(container);
  this.render_serving(container);
  this.render_create_track(container);
  this.quantity_whole.value(1);
  this.units.value('serving');
  this.fat = {'value': function() {return 0;}};
  this.carbohydrates = {'value': function() {return 0;}};
  this.fiber = {'value': function() {return 0;}};
  parent.appendChild(container);
};
layer.quick_add.prototype.render_points = function(parent) {
  var container = $.createElement('div');
  var table = $.table(2).style({
    'padding': 10
  });
  table.tds[0].innerHTML('Points');
  var select = $.createElement('select').style({
    'font-size': 24
  });
  this.protein = {
    'value': function() {
      return select.value() * 10.9375
    }
  };
  for (var i = 0; i < 100; ++i) {
    select.appendChild($.createElement('option').innerHTML(i));
  }
  table.tds[1].appendChild(select);
  container.appendChild(table);
  parent.appendChild(container);
};



layer.create_recipe = function() {};
rocket.inherits(layer.create_recipe, layer.food);




layer.log_out = function() {};
rocket.inherits(layer.log_out, layer.menu);
layer.log_out.prototype.render_complete = function() {
  $.cookie('username', '');
  document.location.hash = '#/user_picker/';
  document.location.reload();
};

