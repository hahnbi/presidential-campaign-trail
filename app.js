// visualization parameters
var width = 960,
    height = 500;
var projection = d3.geo.albersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);
var path = d3.geo.path()
    .projection(projection);
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
var weekLabel = d3.select('body').append('h2').attr('class','weekLabel');
var labels = d3.select('body').append('div').attr('class','labels');

// setting up topojson for d3 map of US
var usJSON;
d3.json("us.json", function(error, us) {
  if (error) throw error;
  usJSON = us;
  svg.insert("path", ".graticule")
      .datum(topojson.feature(us, us.objects.land))
      .attr("class", "land")
      .attr("d", path)
  svg.insert("path", ".graticule")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "state-boundary")
      .attr("d", path)
});

// transform dates into week numbers
function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(d);
    d.setHours(0,0,0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    // Get first day of year
    var yearStart = new Date(d.getFullYear(),0,1);
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    // Return array of year and week number
    return [weekNo];
}

// update the visualizations with each week's data
function updateWeek(weekNum, weekArray) {
  var colors = [
    "#aec7e8",
    "#ff7f0e",
    "#ffbb78",
    "#2ca02c",
    "#98df8a",
    "#d62728",
    "#ff9896",
    "#9467bd",
    "#c5b0d5",
    "#8c564b",
    "#c49c94",
    "#e377c2",
    "#f7b6d2",
    "#7f7f7f",
    "#c7c7c7",
    "#bcbd22",
    "#dbdb8d",
    "#17becf",
    "#9edae5",
    "#393b79",
    "#ffff00"
  ];

  var candidates = [
    "Rubio, Marco", 
    "Carson, Benjamin S.", 
    "Cruz, Rafael Edward 'Ted'", 
    "Paul, Rand", 
    "Bush, Jeb", 
    "Kasich, John R.", 
    "Clinton, Hillary Rodham", 
    "Sanders, Bernard", 
    "Walker, Scott", 
    "Lessig, Lawrence", 
    "Huckabee, Mike", 
    "Santorum, Richard J.", 
    "O'Malley, Martin Joseph", 
    "Trump, Donald J.", 
    "Graham, Lindsey O.", 
    "Jindal, Bobby", 
    "Fiorina, Carly", 
    "Perry, James R. (Rick)", 
    "Christie, Christopher J.", 
    "Webb, James Henry Jr.", 
    "Pataki, George E."
  ]

	var week = weekArray[weekNum] || [];

  // update week label
  weekLabel.text('Week #' + weekNum);

  // bind data
	var spending = d3.select('svg')
    .selectAll('.spending')
    .data(week, function(d) {
      return JSON.stringify([d.name,weekNum,d.loc]); 
    });

	// enter selection
	spending.enter().append('circle');

  spending.attr('class', 'spending')
  	.attr("transform", function(d) { 
  		return "translate(" + projection([Number(d.loc.split(',')[1]), Number(d.loc.split(',')[0])]) + ")";
  	})
  	.attr("r", 0)
  	.attr('fill', function(d) {
      return colors[candidates.indexOf(d.name)];
    })
    .style('opacity', 0.8)
    .style('stroke', 'black')
    .style('stroke-width', 1)
  	.transition()
  	.attr("r", function(d) {
      if (d.val <= 10) {
        return 2;
      } else {
        return 2 * Math.log(Number(d.val));
      }
    });
	// exit selection
	spending.exit()
    .transition()
    .attr("r",0)
    .remove();
}

function startVisualization(weekArray) {
  var week = 0;
  var weekInterval = window.setInterval(function() {
    week++;
    updateWeek(week, weekArray);
    if (week === 52) {
      window.clearInterval(weekInterval);
    }
  }, 750)
}

function renderLabels() {
    var colors = [
    "#aec7e8",
    "#ff7f0e",
    "#ffbb78",
    "#2ca02c",
    "#98df8a",
    "#d62728",
    "#ff9896",
    "#9467bd",
    "#c5b0d5",
    "#8c564b",
    "#c49c94",
    "#e377c2",
    "#f7b6d2",
    "#7f7f7f",
    "#c7c7c7",
    "#bcbd22",
    "#dbdb8d",
    "#17becf",
    "#9edae5",
    "#393b79",
    "#ffff00"
  ];

  var candidates = [
    "Rubio, Marco", 
    "Carson, Benjamin S.", 
    "Cruz, Rafael Edward 'Ted'", 
    "Paul, Rand", 
    "Bush, Jeb", 
    "Kasich, John R.", 
    "Clinton, Hillary Rodham", 
    "Sanders, Bernard", 
    "Walker, Scott", 
    "Lessig, Lawrence", 
    "Huckabee, Mike", 
    "Santorum, Richard J.", 
    "O'Malley, Martin Joseph", 
    "Trump, Donald J.", 
    "Graham, Lindsey O.", 
    "Jindal, Bobby", 
    "Fiorina, Carly", 
    "Perry, James R. (Rick)", 
    "Christie, Christopher J.", 
    "Webb, James Henry Jr.", 
    "Pataki, George E."
  ]
  _.each(candidates, function(candidate, i) {
    labels.append('div')
      .html('<div style="width: 20px; height: 20px; float: left; margin-right: 5px; background-color:'+colors[i]+'"></div>' + candidate)
      .style('width', '30%')
      .style('float', 'left')
  })
}

function initializeApp() {
  // data variables
  var preformattedData = {};
  var weekArray = [];

  d3.csv("presdata.csv", function(error, data) {
    if (error) throw error;

    // serializing data by candidate, week number, and location
    var presData = _.each(data, function(d) { 
      d.weekNum = getWeekNumber(new Date(d.disb_dt))
      d.concat = d.cand_nm + ';' + d.weekNum + ';'+[d.latitude, d.longitude];
      if(!(d.concat in preformattedData))  {
        preformattedData[d.concat] = Number(d.disb_amt);
      }
      else {
        preformattedData[d.concat] = Number(preformattedData[d.concat]) + Number(d.disb_amt);
      }
    });

    // push data into weekArray format
    for (var key in preformattedData) {
      var unpackedKey = key.split(';');
      if (unpackedKey[2] !== "#N/A,#N/A") {
        weekArray[unpackedKey[1]] = weekArray[unpackedKey[1]] || [];
        weekArray[unpackedKey[1]].push({name: unpackedKey[0], loc: unpackedKey[2], val: preformattedData[key]});
      }
    }

    startVisualization(weekArray);
    renderLabels();

  });
}

initializeApp()
