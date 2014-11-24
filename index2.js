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
var white = '#f7f7f7';
var dark_gray = '#a7a7aa';
var gray = '#c8c7cc';
var light_gray = '#efeff4';
var blue = '#007aff';
var orange = '#ef6103';





var layer = function() {};
layer.prototype.render = function() {
  $('body').style({
    'background-color': white
  });
  var container = $.createElement('div');
  $.EventTarget.removeAllEventListeners();
  this.render_page(container);
  if (container.innerHTML().length) {
    $('body').innerHTML('').appendChild(container);
  }
  this.render_complete();
};
layer.prototype.render_page = function(parent) {
  if (
    (this.data && !$.isEmpty(this.data)) ||
    (this.constructor === layer.login)
  ) {

    var container = $.createElement('div').style({
      'position': 'fixed',
      'top': 0
    });
    this.header_container = container;
    this.render_header(container);
    parent.appendChild(container);

    var container = $.createElement('div');
    var spacer = $.createElement('div').style({
      'height': 1
    });
    container.appendChild(spacer);
    this.contents_container = container;
    this.render_contents(container);
    parent.appendChild(container);

  } else {
    this.render_loading(parent);
  }
};
layer.prototype.render_loading = function() {
  var self = this;
  api('user', 'load', this.date, function(data) {
    layer.prototype.data = self.data = data;
    self.update_data();
    self.render();
  });
};
layer.prototype.update_data = function() {
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
layer.prototype.render_food =
  function(parent, food_id, opt_quantity, opt_units, opt_time, opt_points) {

  var food = this.data.food[food_id];
  var container = $.createElement('div').style({
    'background-color': white,
    'border-bottom': '1px solid ' + light_gray
  });
  var table = $.table(3).style({
    'height': 40
  });
  if (food.img) {
    table.tds[0].setAttribute({
      'width': 45
    }).appendChild($.createElement('img').style({
      'width': 40,
      'transform': 'rotate(' + (food.img_rotation || 0) + 'deg)'
    }).setAttribute({
      'src': 'img/' + food.img
    }));
  } else {
    table.tds[0].hide();
  }
  table.tds[1].style({
    'padding-left': 5
  });
  table.tds[1].appendChild($.createElement('div').innerHTML(
    food.name
  ));
  table.tds[1].appendChild($.createElement('div').style({
    'color': 'gray',
    'font-size': 10
  }).innerHTML(
    (opt_time ? (opt_time + ' - ') : '') +
    decimal_to_fraction(opt_quantity || food.quantity) + ' ' +
    (opt_units || food.units)
  ));
  table.tds[2].style({
    'width': 60,
    'text-align': 'center'
  });
  var pts;
  if (opt_points !== undefined) {
    pts = opt_points;
  } else if (food.points !== null) {
    pts = food.points;
  } else {
    pts = points(
      food.fat,
      food.carbohydrates,
      food.fiber,
      food.protein
    );
  }
  table.tds[2].innerHTML(+pts);
  container.appendChild(table);
  parent.appendChild(container);

};
layer.prototype.render_header = function(parent) {
  var container = $.createElement('div');
  var table = $.table(2).style({
    'border-bottom': '1px solid ' + dark_gray
  });
  table.tbody.style({
    'line-height': 50,
    'text-align': 'center',
    'font-size': 18,
    'color': blue,
    'background-color': white
  });
  this.render_header_home(table.tds[0]);
  this.render_header_menu(table.tds[1]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.prototype.render_header_home = function(parent) {
  var container = $.createElement('div');
  container.innerHTML('Home');
  container.addEventListener('click', function() {
    go('home');
  });
  parent.appendChild(container);
};
layer.prototype.render_header_menu = function(parent) {
  var container = $.createElement('div');
  container.innerHTML('&#8801; Menu');
  container.addEventListener('click', function() {
    go('menu');
  });
  parent.appendChild(container);
};
layer.prototype.render_complete = function() {
  if (this.contents_container && this.header_container) {
    this.contents_container.style({
      'margin-top': this.header_container.getBoundingClientRect().height
    });
    window.scrollTo(0, 0);
  }
  if (this.fat) {
    this.fat.focus();
  }
  if (this.search) {
    this.search.focus();
  }
  if (this.username) {
    this.username.focus();
  }
};
layer.prototype.search_string = '';
layer.prototype.food_click_handler = function(food_id) {};
layer.prototype.render_foods = function(parent) {
  this.render_header_search(this.header_container);
  this.render_header_switch(this.header_container);
  var container = $.createElement('div');
  this.render_foods_list(container);
  parent.appendChild(container);
};
layer.prototype.render_foods_list = function(parent) {
  var container = $.createElement('div');
  var self = this;
  container.live('div', 'click', function() {
    var element = this;
    while (container[0] !== element.parentNode) {
      element = element.parentNode;
    }
    self.food_click_handler(foods[container.children().indexOf(element)].food_id);
  });
  this.foods_list_container = container;
  var foods = [];
  var search_string = this.search_string ?
    this.search_string.toLowerCase().split(/\s+/g) :
    null;
  for (var food_id in this.data.food) {
    var food = this.data.food[food_id];
    var food_name_lowercase = food.name.toLowerCase();
    if (
      !search_string ||
      search_string.map(function(str) {
        return food_name_lowercase.indexOf(str);
      }).filter(function(pos) {
        return (pos === -1);
      }).length === 0
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
    this.render_food(container, foods[i].food_id);
  }
  if (parent) {
    parent.appendChild(container);
    this.food_container = container;
  } else {
    this.food_container.parentNode().replaceChild(
      container,
      this.food_container
    );
    this.food_container = container;
  }
};
layer.prototype.render_header_search = function(parent) {
  var container = $.createElement('div').style({
    'padding': 5
  });
  var input = $.createElement('input').setAttribute({
    'placeholder': 'Search'
  }).style({
    'border': '1px solid ' + gray
  });
  this.search = input;
  var self = this;
  input.addEventListener('afterkeydown', function(e) {
    if (self.search_string !== this.value) {
      self.search_string = this.value;
      self.render_foods_list();
    }
    if (
      (e.type === 'keyup') &&
      (e.which === $.KEY.enter) &&
      (self.foods_list_container.children().length === 1)
    ) {
      self.foods_list_container.firstElementChild().dispatchEvent('click');
    }
  });
  container.appendChild(input);
  parent.appendChild(container);
};
layer.prototype.switched = 'All';
layer.prototype.render_header_switch = function(parent) {
  var container = $.createElement('div').style({
    'padding': '0 5px 5px'
  });
  var table = $.table(4).style({
    'background-color': 'white',
    'color': blue,
    'border': '1px solid ' + blue,
    'opacity': 0.9,
    'border-radius': 5
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
    this.style.backgroundColor = blue;
    this.style.color = 'white';
    if (self.switched !== this.innerHTML) {
      self.switched = this.innerHTML;
      self.render_foods_list();
      window.scrollTo(0, 0);
    }
  };
  for (var i = 0; switches[i]; ++i) {
    switches[i].element = table.tds[i].appendChild(
      $.createElement('div').style({
        'border-radius': 3
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
layer.prototype.render_name_serving = function(parent, food_id) {
  var container = $.createElement('div').style({
    'text-align': 'center'
  });
  var food = this.data.food[food_id];
  container.appendChild($.createElement('div').innerHTML(
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
layer.prototype.render_quantity_units = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10,
    'border-top': '1px solid ' + gray,
    'border-bottom': '1px solid ' + gray
  });
  var table = $.table(3);
  this.render_quantity(table);
  this.render_units(table.tds[2]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.prototype.quantity_units_handler = function() {
  if (this.food_id && !this.fat) {
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
  }
};
layer.prototype.render_quantity = function(table) {
  this.render_quantity_whole(table.tds[0]);
  this.render_quantity_fraction(table.tds[1]);
  var self = this;
  this.quantity = {
    'value': function(opt_val) {
      if (arguments.length) {
        self.quantity_whole.value(Math.floor(opt_val));
        self.quantity_fraction.value('.' + ('' + +opt_val).split('.')[1]);
      } else {
        return +self.quantity_whole.value() + +self.quantity_fraction.value();
      }
    }
  };
  this.render_quantity_value();
};
layer.prototype.render_quantity_whole = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style({
    'direction': 'rtl'
  });
  this.quantity_whole = select;
  for (var i = 0; i < 300; ++i) {
    select.appendChild($.createElement('option').value(i).innerHTML(i));
  }
  var self = this;
  select.addEventListener('keyup,change,blur', function() {
    self.quantity_units_handler();
  });
  container.appendChild(select);
  parent.appendChild(container);
};
layer.prototype.render_quantity_fraction = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select');
  this.quantity_fraction = select;
  for (var i in fractions) {
    select.appendChild($.createElement('option').value(i).innerHTML(
      fractions[i]
    ));
  }
  var self = this;
  select.addEventListener('keyup,change,blur', function() {
    self.quantity_units_handler();
  });
  container.appendChild(select);
  parent.appendChild(container);
};
layer.prototype.render_quantity_value = function() {
  this.quantity.value(1);
};
layer.prototype.render_units = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select');
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
  select.addEventListener('keyup,change,blur', function() {
    self.quantity_units_handler();
  });
  select.value('serving');
  select.dispatchEvent('change');
  container.appendChild(select);
  parent.appendChild(container);
};
layer.prototype.render_date_time = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10,
    'border-top': '1px solid ' + gray,
    'border-bottom': '1px solid ' + gray
  });
  var table = $.table(2);
  this.render_date(table.tds[0]);
  this.render_time(table.tds[1]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.prototype.render_date = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select').style({
    'direction': 'rtl'
  });
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
  container.appendChild(select);
  parent.appendChild(container);
};
layer.prototype.render_time = function(parent) {
  var container = $.createElement('div');
  var select = $.createElement('select');
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
  var now = new Date();
  select.value(
    $.padLeft(now.getHours(), 2, '0') + ':' +
    $.padLeft(Math.floor(now.getMinutes() / 5) * 5, 2, '0')
  );
  container.appendChild(select);
  parent.appendChild(container);
};
layer.prototype.render_points = function(parent) {
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
layer.prototype.render_image = function(parent, opt_view_only) {
  var container = $.createElement('div').style({
    'text-align': 'center',
    'margin-top': 10
  });
  var self = this;
  var food = this.data.food[this.food_id];
  if (food && food.img) {
    self.img = food.img;
    self.img_rotation = food.img_rotation || 0;
    var image = $.createElement('img').setAttribute({
      'src': 'img/' + food.img
    });
    container.appendChild(image);
    var rotate = function(degrees) {
      image.style({
        'transform': 'rotate(' + degrees + 'deg)'
      });
    };
    rotate(self.img_rotation);
    if (!opt_view_only) {
      image.addEventListener('click', function() {
        rotate(self.img_rotation = (self.img_rotation + 90) % 360);
      });
    }
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
            var shrinked_image = $.createElement('img').addEventListener('click', function() {
              shrinked_image.style({
                'transform': 'rotate(' + (self.img_rotation = (self.img_rotation + 90) % 360) + 'deg)'
              });
            });
            shrinked_image.addEventListener('click', rotate_handler);
            container.appendChild(shrinked_image.setAttribute({
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
layer.prototype.render_fat_carbohydrates_fiber_protein = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10,
    'border-top': '1px solid ' + gray,
    'border-right': '1px solid ' + gray
  });
  var items = ['Fat', 'Carbohydrates', 'Fiber', 'Protein'];
  for (var i = 0; items[i]; ++i) {
    this.render_food_parameter(container, items[i]);
  }
  parent.appendChild(container);
};
layer.prototype.render_food_parameter = function(parent, item) {
  var container = $.createElement('div').style({
    'background-color': 'white',
    'border-bottom': '1px solid ' + gray,
    'padding-left': 10
  });
  var table = $.table(2);
  table.tds[0].innerHTML(item.replace('Carbohydrates', 'Carbs'));
  var self = this;
  var input = $.createElement('input').setAttribute({
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
layer.prototype.render_name = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10,
    'background-color': 'white',
    'border-top': '1px solid ' + gray,
    'border-bottom': '1px solid ' + gray
  });
  var table = $.table(2);
  table.tds[0].style({
    'padding-left': 10
  }).setAttribute({
    'width': 50
  }).innerHTML('Name');
  var input = $.createElement('input').setAttribute({
    'placeholder': 'name'
  });
  this.name = input;
  table.tds[1].appendChild(input);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.prototype.get_food_arguments = function() {
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
    'img': this.img,
    'img_rotation': this.img_rotation
  };
};




layer.login = function(opt_username) {
  this.opt_username = opt_username;
};
rocket.inherits(layer.login, layer);
layer.login.prototype.render_header = function(parent) {
  var container = $.createElement('div');
  var table = $.table(2).style({
    'height': 50,
    'background-color': white,
    'border-bottom': '1px solid ' + dark_gray
  });
  table.tds[0].style({
    'font-weight': 'bold',
    'text-align': 'center'
  }).innerHTML('Weight Watchers');
  table.tds[1].setAttribute({
    'width': '35%'
  });
  this.render_login_button(table.tds[1]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.login.prototype.render_contents = function(parent) {
  $('body').style({
    'background-color': light_gray
  });
  var container = $.createElement('div');
  var table = $.table(2, 2).style({
    'border-top': '1px solid ' + gray,
    'border-bottom': '1px solid ' + gray,
    'margin-top': 30,
    'background-color': 'white'
  });
  table.trs[0].tds[0].setAttribute({
    'width': '35%'
  });
  table.trs[0].tds[0].style({'padding': 10}).innerHTML('User Name');
  table.trs[1].tds[0].style({'padding': 10}).innerHTML('Password');
  this.render_username(table.trs[0].tds[1]);
  this.render_password(table.trs[1].tds[1]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.login.prototype.render_username = function(parent) {
  var container = $.createElement('div');
  var input = $.createElement('input').setAttribute({
    'placeholder': 'User Name'
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
  var input = $.createElement('input').setAttribute({
    'placeholder': 'Password',
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
  var button = $.createElement('button').innerHTML('Login').style({
    'background-color': white
  });
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





layer.home = function() {
  var today = new Date();
  this.date =
    today.getFullYear() + '-' +
    $.padLeft(today.getMonth() + 1, 2, '0') + '-' +
    $.padLeft(today.getDate(), 2, '0');
};
rocket.inherits(layer.home, layer);
layer.home.prototype.render_contents = function(parent) {
  var container = $.createElement('div');
  this.render_tracks(container);
  parent.appendChild(container);
};
layer.home.prototype.render_header = function(parent) {
  var container = $.createElement('div');
  this.render_header_navigation(container);
  this.render_header_points(container);
  parent.appendChild(container);
};
layer.home.prototype.render_header_navigation = function(parent) {
  var container = $.createElement('div').style({
    'border-bottom': '1px solid ' + dark_gray
  });
  var table = $.table(5).style({
    'height': 50
  });
  table.tbody.style({
    'text-align': 'center',
    'color': blue,
    'background-color': white
  });
  this.render_header_yesterday_tomorrow(table.tds[0], -1);
  this.render_header_menu_button(table.tds[1]);
  this.render_header_date(table.tds[2]);
  this.render_header_track_button(table.tds[3]);
  this.render_header_yesterday_tomorrow(table.tds[4], 1);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.home.prototype.render_header_yesterday_tomorrow = function(parent, offset) {
  var container = $.createElement('div');
  container.appendChild($.createElement('img').setAttribute({
    'src': 'img/arrow_' + ((offset < 0) ? 'back' : 'forward') + '.png'
  }));
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
layer.home.prototype.render_header_menu_button = function(parent) {
  var container = $.createElement('div').style({
    'font-size': 32,
    'line-height': 50
  });
  container.innerHTML('&#x2261;');
  container.addEventListener('click', function() {
    go('menu');
  });
  parent.appendChild(container);
};
layer.home.prototype.render_header_date = function(parent) {
  var container = $.createElement('div').style({
    'color': 'black'
  });
  container.addEventListener('click', function() {
    (new layer.home()).render();
  });
  container.appendChild($.createElement('div').innerHTML(
    ('' + $.strToDate(this.date)).substr(0, 3)
  ));
  container.appendChild($.createElement('div').innerHTML(
    this.date.split('-')[1] + '/' +
    this.date.split('-')[2]
  ));
  parent.appendChild(container);
};
layer.home.prototype.render_header_track_button = function(parent) {
  var container = $.createElement('div').style({
    'font-size': 42,
    'line-height': 50
  });
  container.innerHTML('+');
  container.addEventListener('click', function() {
    go('track');
  });
  parent.appendChild(container);
};
layer.home.prototype.render_header_points = function(parent) {
  var container = $.createElement('div').style({
    'border-bottom': '1px solid ' + dark_gray,
    'opacity': 0.9
  });
  var table = $.table(5).style({
    'background-color': white,
    'height': 60
  });
  table.tbody.style({
    'text-align': 'center'
  });
  this.render_header_points_remaining(table.tds[0]);
  this.render_header_points_used(table.tds[1]);
  this.render_header_points_daily(table.tds[2]);
  this.render_header_points_weekly(table.tds[3]);
  this.render_header_points_activity(table.tds[4]);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.home.prototype.points_label = {
  'color': 'gray',
  'font-size': 8
};
layer.home.prototype.points_value = {
  'color': orange,
  'font-size': 28
};
layer.home.prototype.right_border = {
  'border-right': '1px dotted ' + dark_gray
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
layer.home.prototype.get_points_remaining = function(date) {
  return this.get_daily_points(date) - this.get_points_used(date);
};
layer.home.prototype.render_header_points_remaining = function(parent) {
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
layer.home.prototype.render_header_points_used = function(parent) {
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
layer.home.prototype.render_header_points_daily = function(parent) {
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
layer.home.prototype.render_header_points_weekly = function(parent) {
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
layer.home.prototype.render_header_points_activity = function(parent) {
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
    'background-color': light_gray,
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
  this.render_food(
    container,
    track.food_id,
    track.quantity,
    track.units,
    ((track.time.split(':')[0] % 12) || 12) + ':' +
      track.time.split(':')[1] + ' ' +
      ((track.time.split(':')[0] < 12) ? 'am' : 'pm'),
    track.points
  );
  parent.appendChild(container);
};





layer.menu = function() {};
rocket.inherits(layer.menu, layer);
layer.menu.prototype.render_contents = function(parent) {
  $('body').style({
    'background-color': light_gray
  });
  var container = $.createElement('div');
  this.render_menu_items(container);
  parent.appendChild(container);
};
layer.menu.prototype.render_menu_items = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 30,
    'border-top': '1px solid ' + gray
  });
  var items = [
    {
      'name': 'Track',
      'go': 'track'
    },
    'spacer',
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
    'spacer',
    {
      'name': 'Create Activity',
      'go': 'create_activity'
    },
    {
      'name': 'Create Recipe',
      'go': 'create_recipe'
    },
    'spacer',
    {
      'name': 'Update Weight',
      'go': 'update_weight'
    },
    'spacer',
    {
      'name': 'Logout',
      'go': 'logout'
    }
  ];
  for (var i = 0; items[i]; ++i) {
    if (items[i] === 'spacer') {
      this.render_menu_spacer(container);
    } else {
      this.render_menu_item(container, items[i]);
    }
  }
  parent.appendChild(container);
};
layer.menu.prototype.render_menu_item = function(parent, item) {
  var container = $.createElement('div').style({
    'border-bottom': '1px solid ' + gray,
    'background-color': 'white'
  });
  container.addEventListener('click', function() {
    go(item.go);
  });
  var table = $.table(2).style({
    'height': 42
  });
  table.tds[0].style({
    'padding-left': 10
  }).innerHTML(item.name);
  table.tds[1].setAttribute({
    'width': 30
  }).appendChild($.createElement('img').setAttribute({
    'src': 'img/arrow_right.png'
  }));
  container.appendChild(table);
  parent.appendChild(container);
};
layer.menu.prototype.render_menu_spacer = function(parent) {
  var container = $.createElement('div').style({
    'height': 35,
    'border-bottom': '1px solid ' + gray
  });
  parent.appendChild(container);
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





layer.track = function(opt_food_id) {
  this.food_id = opt_food_id
};
rocket.inherits(layer.track, layer);
layer.track.prototype.render_contents = function(parent) {
  var container = $.createElement('div');
  if (this.food_id) {
    this.render_track(container);
  } else {
    this.render_foods(container);
  }
  parent.appendChild(container);
};
layer.track.prototype.food_click_handler = function(food_id) {
  go('track', food_id);
};
layer.track.prototype.render_track = function(parent) {
  var container = $.createElement('div');
  this.render_track_name_points(container);
  this.render_track_inputs(container);
  this.render_image(container, true);
  parent.appendChild(container);
};
layer.track.prototype.render_track_name_points = function(parent) {
  var container = $.createElement('div');
  var table = $.table(2).style({
    'height': 100
  });
  this.render_name_serving(table.tds[0], this.food_id);
  container.appendChild(table);
  this.render_points(table.tds[1]);
  parent.appendChild(container);
};
layer.track.prototype.render_track_inputs = function(parent) {
  var container = $.createElement('div');
  this.render_quantity_units(container);
  var food = this.data.food[this.food_id];
  this.quantity.value(food.quantity);
  this.units.value(food.units);
  this.quantity_units_handler();
  this.render_date_time(container);
  this.render_track_button(container);
  parent.appendChild(container);
};
layer.track.prototype.render_track_button = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10,
    'border-top': '1px solid ' + gray,
    'border-bottom': '1px solid ' + gray
  });
  var loading = false;
  var self = this;
  var button = $.createElement('button').style(
    this.select_style
  ).innerHTML(
    'Track'
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



layer.edit_track = function(track_id) {
  this.track_id = track_id;
};
rocket.inherits(layer.edit_track, layer.track);
layer.edit_track.prototype.render_contents = function(parent) {
  this.food_id = this.data.track[this.track_id].food_id;
  layer.track.prototype.render_contents.apply(this, arguments);
  this.quantity.value(this.data.track[this.track_id].quantity);
  this.units.value(this.data.track[this.track_id].units);
  this.date.value(this.data.track[this.track_id].date);
  this.quantity_units_handler();
  this.time.value(this.data.track[this.track_id].time.substr(0, 5));
};
layer.edit_track.prototype.render_track_button = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10,
    'border-top': '1px solid ' + gray,
    'border-bottom': '1px solid ' + gray
  });
  var loading = false;
  var self = this;
  var table = $.table(2);
  var button = $.createElement('button').style(
    this.select_style
  ).innerHTML(
    'Delete'
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
    'Update'
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
rocket.inherits(layer.create_food, layer);
layer.create_food.prototype.render_contents = function(parent) {
  var container = $.createElement('div');
  var table = $.table(2);
  this.render_fat_carbohydrates_fiber_protein(table.tds[0]);
  this.render_points(table.tds[1]);
  container.appendChild(table);
  this.render_name(container);
  this.render_quantity_units(container);
  this.render_create_create_track(container);
  this.render_image(container);
  parent.appendChild(container);
};
layer.create_food.prototype.render_create_create_track = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10,
    'border-top': '1px solid ' + gray,
    'border-bottom': '1px solid ' + gray
  });
  var table = $.table(2);
  var self = this;
  var loading = false;
  var create = function(callback) {
    if (!loading) {
      loading = true;
      var args = self.get_food_arguments();;
      api('food', 'insert', args, function(food_id) {
        args.food_id = food_id;
        args.timestamp = $.dateISOString();
        self.data.food[food_id] = args;
        self.update_data();
        callback(food_id);
      });
    }
  };
  var button = $.createElement('button').innerHTML(
    'Create'
  ).addEventListener('click', function() {
    create(function() {
      delete self.img;
      self.render();
    });
  });
  table.tds[0].appendChild(button);
  var button = $.createElement('button').innerHTML(
    'Create & Track'
  ).addEventListener('click', function(food_id) {
    create(function(food_id) {
      go('track', food_id);
    });
  });
  table.tds[1].appendChild(button);
  container.appendChild(table);
  parent.appendChild(container);
}



layer.edit_food = function(opt_food_id) {
  this.food_id = opt_food_id;
};
rocket.inherits(layer.edit_food, layer);
layer.edit_food.prototype.render_contents = function(parent) {
  var container = $.createElement('div');
  if (this.food_id) {
    this.render_edit(container);
  } else {
    this.render_foods(container);
  }
  parent.appendChild(container);
};
layer.edit_food.prototype.food_click_handler = function(food_id) {
  go('edit_' + this.data.food[food_id].type, food_id);
};
layer.edit_food.prototype.render_edit = function(parent) {
  var container = $.createElement('div');
  var table = $.table(2);
  this.render_fat_carbohydrates_fiber_protein(table.tds[0]);
  this.render_points(table.tds[1]);
  container.appendChild(table);
  this.render_name(container);
  this.render_quantity_units(container);
  this.render_delete_update(container);
  this.render_image(container);
  parent.appendChild(container);

  var food = this.data.food[this.food_id];
  this.fat.value(+food.fat);
  this.carbohydrates.value(+food.carbohydrates);
  this.fiber.value(+food.fiber);
  this.protein.value(+food.protein);
  this.name.value(food.name);
  this.quantity.value(+food.quantity);
  this.units.value(food.units);

  this.fat.dispatchEvent('blur');
};
layer.edit_food.prototype.render_complete = function() {
  layer.prototype.render_complete.apply(this, arguments);
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
layer.edit_food.prototype.render_delete_update = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10,
    'border-top': '1px solid ' + gray,
    'border-bottom': '1px solid ' + gray
  });
  var table = $.table(2);
  var self = this;
  var loading = false;
  var button = $.createElement('button').innerHTML(
    'Delete'
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
  var button = $.createElement('button').innerHTML(
    'Update'
  ).addEventListener('click', function(food_id) {
    if (!loading) {
      loading = true;
      var args = self.get_food_arguments();
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










layer.update_weight = function() {};
rocket.inherits(layer.update_weight, layer);
layer.update_weight.prototype.render_contents = function(parent) {
  $('body').style({
    'background-color': light_gray
  });
  var container = $.createElement('div');
  this.render_update_weight(container);
  parent.appendChild(container);
};
layer.update_weight.prototype.render_update_weight = function(parent) {
  var container = $.createElement('div');
  this.render_weight(container);
  this.render_update_weight_button(container);
  parent.appendChild(container);
};
layer.update_weight.prototype.render_weight = function(parent) {
  parent.appendChild($.createElement('div').style({
    'height': 30
  }));
  var container = $.createElement('div').style({
    'border-top': '1px solid ' + gray,
    'border-bottom': '1px solid ' + gray
  });
  var table = $.table(2);
  var select = $.createElement('select').style({
    'direction': 'rtl'
  });
  this.weight_pounds = select;
  for (var i = 120; i < 300; ++i) {
    select.appendChild($.createElement('option').innerHTML(i));
  }
  select.value(Math.floor(this.data.user.weight));
  table.tds[0].appendChild(select);
  var select = $.createElement('select');
  this.weight_tenths = select;
  for (var i = 0; i < 10; ++i) {
    select.appendChild($.createElement('option').value(i / 10).innerHTML('.' + i));
  }
  select.value($.round(this.data.user.weight - Math.floor(this.data.user.weight), 1));
  table.tds[1].appendChild(select);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.update_weight.prototype.render_update_weight_button = function(parent) {
  var container = $.createElement('div').style({
    'margin-top': 10,
    'border-top': '1px solid ' + gray,
    'border-bottom': '1px solid ' + gray
  });
  var self = this;
  var loading = false;
  var button = $.createElement('button').style(this.button_style).innerHTML(
    'Update Weight'
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







layer.quick_create = function() {};
rocket.inherits(layer.quick_create, layer.create_food);
layer.quick_create.prototype.render_contents = function(parent) {
  var container = $.createElement('div');
  this.render_points(container);
  this.render_name(container);
  this.render_quantity_units(container);
  this.render_create_create_track(container);
  this.render_image(container);
  parent.appendChild(container);
};
layer.quick_create.prototype.render_points = function(parent) {
  var container = $.createElement('div').style({
    'padding-top': 10
  });
  var table = $.table(2).style({
    'border-top': '1px solid ' + gray,
    'border-bottom': '1px solid ' + gray,
    'background-color': 'white'
  });
  table.tds[0].style({
    'padding-left': 10
  }).setAttribute({
    'width': 50
  }).innerHTML('Points');
  var select = $.createElement('select');
  this.points = select;
  for (var i = 0; i < 100; ++i) {
    select.appendChild($.createElement('option').innerHTML(i));
  }
  table.tds[1].appendChild(select);
  container.appendChild(table);
  parent.appendChild(container);
};
layer.quick_create.prototype.get_food_arguments = function() {
  return {
    'name': this.name.value(),
    'type': 'food',
    'points': this.points.value(),
    'quantity': this.quantity.value(),
    'units': this.units.value(),
    'user_id': this.data.user.user_id,
    'img': this.img,
    'img_rotation': this.img_rotation
  };
};








layer.create_activity = function() {};
rocket.inherits(layer.create_activity, layer.quick_create);
layer.create_activity.prototype.render_contents = function(parent) {
  var container = $.createElement('div');
  this.render_points(container);
  this.render_name(container);
  this.render_quantity_units(container);
  this.units.value('hour');
  this.render_create_create_track(container);
  parent.appendChild(container);
};
layer.create_activity.prototype.get_food_arguments = function() {
  return {
    'name': this.name.value(),
    'type': 'activity',
    'points': -1 * this.points.value(),
    'quantity': this.quantity.value(),
    'units': this.units.value(),
    'user_id': this.data.user.user_id
  };
};




