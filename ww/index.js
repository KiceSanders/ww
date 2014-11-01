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
  if (this.date) {
    if (this.data) {
      this.render_loaded(parent);
    } else {
      this.render_loading(parent);
    }
  }
};
layer.home.prototype.render_loading = function() {
  var self = this;
  api('user', 'load', this.date, function(data) {
    layer.prototype.data = self.data = data;
    self.render();
  });
};
layer.home.prototype.render_loaded = function(parent) {
  var container = $.createElement('div');
  this.render_header(container);
  this.render_points(container);
  this.render_tracks(container);
  parent.appendChild(container);
};
layer.home.prototype.render_header = function(parent) {
  var container = $.createElement('div');
  var table = $.table(5).style({
    // 'height': 60
  });
  table.tbody.style({
    'text-align': 'center',
    'font-size': 24,
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
  parent.appendChild(container);
};
layer.home.prototype.render_header_label = function(parent) {
  var container = $.createElement('div').style({
    'font-size': 12,
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
  parent.appendChild(container);
};
layer.home.prototype.render_points = function(parent) {
  var container = $.createElement('div');

  parent.appendChild(container);
};
layer.home.prototype.render_tracks = function(parent) {
  var container = $.createElement('div');

  parent.appendChild(container);
};





