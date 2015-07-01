
$(function(){

  var filter = '';
  filter = 'fromA=2015-05-25&toA=2015-05-31&fromB=2015-06-01&toB=2015-06-07';

  $.ajax({
    url: '/api/reports/weekly?' + filter,
    dataType: 'json',
  })
  .done(function(data) {
    showWeekly(data);
  })
  .error(function(err,a,b){
    console.log('ERROR on fetch > ' + err);
  });

});

function showWeekly(data){
  //data.articles.reverse();
  var template = Handlebars.compile($("#weekly-template").html());
  $('.tab-pane.weekly').html(template(data));

}

Handlebars.registerHelper('getGA', function(key, obj) {
  var val = obj['ga:' + key] || 0;

  if (!parseFloat(val) || key === 'bouncerate'){
    return (parseFloat(val) && parseFloat(val).toFixed(2)) || val;
  }

  return parseFloat(val);
});
