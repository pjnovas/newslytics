
var maxValue = 100;
var all = [];

$(function(){
  $('#send-url').on('click', fetchAndRefresh);
});

function fetchAndRefresh(){
  var url = $('#url').val();

  if (url.length === 0){
    window.alert('paste a url!');
  }

  $('#url').val("")

  $.ajax({
    url: '/counts?url=' + url,
    dataType: 'json',
  })
  .done(function(counters) {
    createCounter(url, counters);
  })
  .error(function(err){
    console.log('ERROR on fetch > ' + err);
  });

}

function createCounter(url, counters){
  var parsed = url.split('/'),
    tail = parsed[parsed.length-1] || parsed[parsed.length-2];

  all.push({
    url: url,
    tail: tail,
    counters: counters,
    svg: null
  });

  if (updateMax(counters)){
    $('.metric').remove();
    all.forEach(draw);
    return;
  }

  draw(all[all.length-1]);
}

function updateMax(counter){
  var updated = false;

  function checkCounter(c){
    for (var p in c){
      if (c[p].total > maxValue){
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

function removeItem(item){
  all.forEach(function(_item, i){
    if (item.url === _item.url){
      all.splice(i, 1);
    }
  });

  maxValue = 100;
  updateMax();
  
  $('.metric').remove();
  all.forEach(draw);
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

function draw(item){
  // taken from http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

  var width = 300,
    height = 300,
    radius = Math.min(width, height) / 2,
    innerRadius = 0.3 * radius;

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

  var $metric = $('<div class="metric"></div>').appendTo("body");
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

  var score = 0;
  data.forEach(function(item) { return score += item.score; });

  svg.append("svg:text")
    .attr("class", "aster-score")
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text(Math.round(score));

  var close = $('<a class="btn btn-default close">x</a>').on('click', function(){
    return (function(_item){
      console.log(_item.url);
      removeItem(_item);
    })(item);
  });

  $metric
    .append(close)
    .append('<a class="item" href="' + item.url + '" target="_blank">' + item.tail + '</a>');
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

function getColor(network){
  switch (network){
    case 'facebook': return '#3b5998';
    case 'twitter': return '#00aced';
    case 'linkedin': return '#007bb6';
    case 'googleplus': return '#dd4b39';
  }
}
