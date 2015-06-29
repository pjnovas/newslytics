
var maxValue = 100;
var all = [];

var template;

var sort = {
  p: 'title',
  dir: 1
};

$(function(){
  $('#send-url').on('click', function(){
    fetchAndRefresh();
  });

  $('#top-ten').on('click', function(){
    getTopTen();
  });

  $('#quick-search')
    .on('click', function(e){
      e.stopPropagation();
    })
    .on('keyup', function(){
      filterTable();
    });

  $('#url').on('keypress', function(e){
    if(e.which === 13) {
      fetchAndRefresh();
      e.preventDefault();
    }
  });

  function execSearch(){
    var keywords = $('#search-keywords').val().trim();
    searchRSS(keywords);
  }

  $('#search').on('click', execSearch);
  $('#search-keywords').on('keypress', function(e){
    if(e.which === 13) {
      execSearch();
      e.preventDefault();
    }
  });

  $('.navbar-nav a').click(function (e) {
    e.preventDefault();
    var ele = $(this);
    var target = $('.tab-pane.' + ele.attr('data-target'));
    ele.tab('show');
    $('.tab-pane').removeClass('active');
    target.addClass('active');
  });

  template = Handlebars.compile($("#tr-metric-template").html());

  $('.data-posts').on('click', '.collapser', function(){
    $('.details', $(this).parents('td')).collapse('toggle');
  });

  $('#url').typeahead({
    minLength: 1,
    highlight: true,
  }, {
    name: 'articles',
    displayKey: 'title',
    source: function(query, syncResults, asyncResults){
      $.ajax({
        url: '/api/posts?q=' + query,
        dataType: 'json'
      }).done(function(articles){
        asyncResults(articles);
      });
    }
  })
  .on("typeahead:selected", function(jqEle, article){
    fetchAndRefresh(article.url);
  });

  $('.data-posts').on('click', 'th', function(e){
    var th = $(this);
    var p = th.attr('data-sort') || 'title';
    sort.dir = (p === sort.p && sort.dir > 0 ? -1 : 1);
    sort.p = p;

    $('.data-posts th.sorting')
      .removeClass('sorting')
      .children('div').remove();

    th.addClass('sorting')
      .append(
        $('<div class="' + (sort.dir > 0 ? 'asc' : 'desc') + '"></div>')
      );

    sortAll();
    drawAll();
  });

  $('.data-posts th[data-sort=' + sort.p + ']').addClass('sorting')
    .append($('<div class="' + (sort.dir > 0 ? 'asc' : 'desc') + '"></div>'));

  $('.data-posts').on('click', 'td a.close', function(e){
    removeById(this.id);
  });

  $('#clear-posts').on('click', function(e){
    maxValue = 100;
    all = [];
    drawAll();
    $('.post-count > span').text(0);
  });

});

function blockState(){
  $('#url, #search-keywords').attr('disabled', true);
  $('#send-url, #search, #top-ten').button('loading');
}

function resetState(){
  $('#send-url, #search, #top-ten').button('reset');
  $('#url, #search-keywords').val("").attr('disabled', false);
}

function fetchAndRefresh(url){
  url = url || $('#url').val();

  if (url.length === 0){
    searchRSS();
    return;
  }

  blockState();

  $.ajax({
    url: '/api/articles/' + url,
    dataType: 'json',
  })
  .done(function(article) {
    setSums(article);
    createCounter(url, article);
    resetState();
  })
  .error(function(err,a,b){
    console.log('ERROR on fetch > ' + err);
    resetState();
  });

}

function getTopTen(){
  blockState();

  $.ajax({
    url: '/api/articles/top',
    dataType: 'json',
  })
  .done(function(articles) {

    articles.forEach(function(article){
      setSums(article);
      createCounter(article.url, article);
    });

    resetState();
  })
  .error(function(err,a,b){
    console.log('ERROR on fetch > ' + err);
    resetState();
  });
}

function searchRSS(search){
  blockState();

/*
  var search = $('#rss-query').val().trim();
  var year = $('#rss-date-year').val().trim();
  var month = $('#rss-date-month').val().trim();
  var day = $('#rss-date-day').val().trim();
*/
  var query = '';
  if (search && search.trim().length){
    query = '?s=' + search;
  }
/*
  if (year){
    query += (query ? '&' : '?') + 'y=' + year;
  }
  if (month){
    query += (query ? '&' : '?') + 'm=' + month;
  }
  if (day){
    query += (query ? '&' : '?') + 'd=' + day;
  }
*/

  //var query = '';
  $.ajax({
    url: '/api/articles' + query,
    dataType: 'json',
  })
  .done(function(articles) {

    articles.forEach(function(article){
      setSums(article);
      createCounter(article.url, article);
    });

    resetState();
  })
  .error(function(err,a,b){
    console.log('ERROR on fetch > ' + err);
    resetState();
  });
}

function setSums(article){
  setScore(article);
  setComments(article);
}

function setScore(article){
  var sum = 0;
  var counters = article.counters;
  counters.socialScore = 0;

  for (var p in counters){
    if (p !== "googleanalytics" && counters[p].total > 0){
      sum += counters[p].total;
    }
  }

  var tGA = (counters.googleanalytics && counters.googleanalytics.total) || 0;
  if (tGA > 0){
    counters.socialScore = (sum * 100) / tGA;
  }
}

function setComments(article){
  var counters = article.counters;

  article.totalComments = article.comments || 0;

  article.totalComments +=
    (counters.facebook &&
     counters.facebook.details &&
     counters.facebook.details.comments) || 0;
}

function createCounter(url, article){
  if (all.some(function(item){ return (item.url === url); })) return; // already added

  var counters = article.counters;
  var parsed = url.split('/'),
    tail = parsed[parsed.length-1] || parsed[parsed.length-2];

  article.url = article.url || url;
  article.tail = article.tail || tail;

  var html = template(article);

  all.push({
    url: url,
    tail: tail,
    counters: counters,
    article: article,
    svg: null,
    html: html
  });

  updateMax(counters);
  sortAll();
  drawAll();

}

function updateMax(counter){
  var updated = false;

  function checkCounter(c){
    for (var p in c){
      if (p !== "googleanalytics" && c[p].total > maxValue){
        maxValue = c[p].total;
        updated = true;
      }
    }
  }

  if (counter)
    checkCounter(counter);
  else
    all.forEach(function(item){
      checkCounter(item.counters);
    });

  return updated;
}

function sortAll(){
  var p = sort.p.split('.');
  var dir = sort.dir;

  function val(obj){
    var val = obj.article;

    p.forEach(function(prop){
      val = (val && val[prop]) || 0;
    });

    return val;
  }

  var asc = function(a, b){ return val(a) - val(b); };
  var desc = function(a, b){ return val(b) - val(a); };

  switch(p[p.length-1]){
    case 'published_at':
      asc = function(a, b){ return moment(val(a)) >= moment(val(b)); };
      desc = function(a, b){ return moment(val(a)) < moment(val(b)); };
      break;
    case 'title':
      asc = function(a, b){ return val(a) >= val(b); };
      desc = function(a, b){ return val(a) < val(b); };
      break;
  }

  if (dir > 0) all.sort(asc);
  else all.sort(desc);
}

function removeById(id){

  all.forEach(function(_item, i){
    if (_item.article._id === id){
      all.splice(i, 1);
    }
  });

  updateMax();
  sortAll();
  drawAll();
}

var social_textures_in = {};
var social_textures_out = {};

var networks = [
    'twitter'
  , 'googleplus'
  , 'linkedin'
  , 'facebook'
];

function getTexture(nt, _in){

  function getBy(){
    var args = arguments;

    var txt = textures.lines()
      .orientation(args[0])
      .size(args[1]);

    if (_in){
      return txt
        .strokeWidth(args[2])
        .background(args[3])
        .stroke(args[4]);
    }

    return txt
      .stroke('#F0F3F0')
      .background(args[3]);
  }

  switch (nt){
    case 'facebook': return getBy('diagonal', 10, 5, '#ffffff','#3b5998');
    case 'twitter': return getBy('3/8', 12, 5, '#ffffff','#00aced');
    case 'linkedin': return getBy('vertical', 6, 5, '#ffffff','#007bb6');
    case 'googleplus': return getBy('7/8', 15, 6, '#ffffff','#dd4b39');
  }
}

function createTextures(svg){

  networks.forEach(function(network){
    social_textures_in[network] = getTexture(network, true);
    social_textures_out[network] = getTexture(network);

    svg.call(social_textures_in[network])
    svg.call(social_textures_out[network])
  });

}

function sortMetrics($metricParent){
  var $list = $('.data > .list-group', $metricParent);

  var ntwksSort = [
      'socialScore'
    , 'googleanalytics'
    , 'facebook'
    , 'twitter'
    , 'linkedin'
    , 'googleplus'
  ];

  ntwksSort.forEach(function(name){
    $('>.item-' + name, $list).appendTo($list);
  });
}

function drawAll(){
  $('.metric').remove();
  $('.data-posts > tbody > tr').remove();
  all.forEach(draw);
}

function draw(item){
  $(item.html).appendTo(".data-posts > tbody");
  $('.post-count > span').text(all.length);
  drawVisual(item);
}

function filterTable(){
  var keywords = $('#quick-search').val();

  $('tr', '.data-posts tbody')
    .show()
    .not(':icontains(' + keywords + ')')
    .hide();
}

function drawVisual(item){
  // taken from http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

  var width = 300,
    height = 300,
    radius = Math.min(width, height) / 2,
    innerRadius = 0.3 * radius;

  $('.d3-tip').remove();
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0, 0])
    .html(function(d) {
      return d.data.label + ": <span style='color:orangered'>" + d.data.score + "</span>";
    });

  var pie = d3.layout.pie().sort(null).value(function(d) { return d.width; });

  var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(function (d) {
      return (radius - innerRadius) * (d.data.per / 100.0) + innerRadius;
    });

  var outlineArc = d3.svg.arc()
          .innerRadius(innerRadius)
          .outerRadius(radius);

  var $metric = $('<div class="score"></div>');
  var title = (item.article && item.article.title) || item.tail;
  $metric.append('<a class="item" href="' + item.url + '" target="_blank">' + title + '</a>');
  $('<div class="metric"></div>').append($metric).appendTo('.visual');

  var svg = d3.select($metric[0]).append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  svg.call(tip);
  createTextures(svg);

  item.svg = svg;

  var data = convertData(item);

  var outerPath = svg.selectAll(".outlineArc")
      .data(pie(data))
      .enter().append("path")
      .attr("fill", function(d) { return social_textures_out[d.data.id].url(); })
      .attr("stroke", "#E6EBE6")
      .attr("class", "outlineArc")
      .attr("d", outlineArc);

  var path = svg.selectAll(".solidArc")
      .data(pie(data))
      .enter().append("path")
      .attr("fill", function(d) { return social_textures_in[d.data.id].url(); })
      .attr("class", "solidArc")
      .attr("d", arc)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

  var sc = item.counters.socialScore;

  svg.append("svg:text")
    .attr("class", "aster-score")
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text(sc ? sc.toFixed(1) + "%" : "-");
}

function convertData(item){
  var counters = item.counters,
    svg = item.svg,
    data = [];

  for (var p in counters){
    var network = counters[p];

    var per = (network.total*100 / maxValue);

    data[networks.indexOf(p)] = {
      id: p,
      order: 1,
      color: getColor(p),
      weight: 1,
      width: 1,
      score: network.total,
      per: (per > 0 && per < 5 ? 5 : per), // calculated per over a global maxValue
      label: p
    };
  }

  return data;
}

function parseTime(value){
  value = Number(value);
  var h = Math.floor(value / 3600);
  var m = Math.floor(value % 3600 / 60);
  var s = Math.floor(value % 3600 % 60);
  return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}

function getColor(network){
  switch (network){
    case 'facebook': return '#3b5998';
    case 'twitter': return '#00aced';
    case 'linkedin': return '#007bb6';
    case 'googleplus': return '#dd4b39';
  }
}

Handlebars.registerHelper('fancyName', function(name) {

  if (name.indexOf('ga:') > -1){
    name = name.replace('ga:', '');
  }

  switch(name){
    case 'googleplus':
      return 'Google Plus';

    case 'googleanalytics':
      return 'Google Analytics';

    case 'sessions':
      return 'Sessions (visits)';
    case 'avgSessionDuration':
      return 'Session Duration (average)';
    case 'sessionDuration':
      return 'Session Duration (total)';
    case 'sessionsPerUser':
      return 'Session Per User';
    case 'bouncerate':
      return 'Bounce Rate';

    case 'socialScore':
      return 'Social Score';
  }

  return name.charAt(0).toUpperCase() + name.slice(1);
});

Handlebars.registerHelper('parseValue', function(key, value) {

  if (value.total >= 0){
    value = value.total;
  }

  switch(key){
    case 'ga:avgSessionDuration':
    case 'ga:sessionDuration':
    case 'ga:sessionsPerUser':
      return parseFloat(value).toFixed(1) + " s";
    case 'ga:bouncerate':
    case 'socialScore':
      return parseFloat(value).toFixed(1) + " %";
  }

  return value;
});

Handlebars.registerHelper('getGA', function(key, counter) {
  var gad = (counter && counter.googleanalytics && counter.googleanalytics.details) || {};
  var val = gad['ga:' + key] || 0;

  if (!parseFloat(val) || key === 'bouncerate'){
    return (parseFloat(val) && parseFloat(val).toFixed(1)) || val;
  }

  return parseTime(parseFloat(val) || 0);
});

Handlebars.registerHelper('parseTime', function(value) {
  return parseTime(value);
});

Handlebars.registerHelper('sum', function(value1, value2) {
  return value1 + value2;
});

Handlebars.registerHelper('trimText', function(value) {
  return value ? value.trim() : '';
});

Handlebars.registerHelper('countWords', function(value) {
  return value ? value.trim().split(/\s+/g).length : 0;
});

Handlebars.registerHelper('parseFloat', function(val) {
  return (parseFloat(val) && parseFloat(val).toFixed(1)) || val;
});

Handlebars.registerHelper('parseDate', function(value) {
  return value ? moment(value).format("DD/MM/YYYY HH:mm") : '';
});

jQuery.expr[":"].icontains = jQuery.expr.createPseudo(function (arg) {
  return function (elem) {
    var query = (arg && arg.toUpperCase()) || "";
    return jQuery(elem).text().toUpperCase().indexOf(query) >= 0;
  };
});
