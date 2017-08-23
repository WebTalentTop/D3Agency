(function() {
'use strict';
  angular.module('orzaApp.directives')
      .directive('d3Lines',['d3', '$rootScope', function(d3, $rootScope) {
          return {
            restrict : 'EA',
            scope: {
              data: "=",
              datadate: "=",
              sdate: "="
            },
            link : function(scope, element) {
                // initialize current slider value
                $rootScope.curSlider = 0;
                $rootScope.curDateIndex = 0;

                $rootScope.$watch('strDrawStart', function(newVals, oldVals) {                  
                  if (newVals == "draw"){
                    scope.render();
                    scope.renderScatter();
                    scope.renderTree();
                    $rootScope.strDrawStart = "none";
                  }
                }, true);

                scope.$watch('sdate', function(value) {
                  if (value != undefined){
                    scope.renderScatter();
                    scope.renderTree();
                  }                        
                });

                window.addEventListener('resize', function() {                
                  scope.render();
                  scope.renderScatter();
                  scope.renderTree();
                });
            // define render function
                scope.renderScatter = function(data){

                  var elements = document.querySelectorAll('.data-scattergraph');
                  elements.forEach(function (element) {
                    element.parentNode.removeChild(element);
                  });

                  var secondchart = new drawScatterchart(data, scope, "#scatter_chart");

                  // units graph of existing portfolio and comparison portfolio
                  function drawScatterchart(data, datadate, id){
                    var y_Day91Return = [];
                    var x_Day7LossMin = [];

                    // calculate for funds
                    for (var i = 0; i < $rootScope.dayRetData.day91_return.length; i ++){
                      y_Day91Return[i] = $rootScope.dayRetData.day91_return[i][$rootScope.sliderIndex];

                      var min = 99999;
                      for (var j = 0; j <= $rootScope.sliderIndex; j ++){
                        if (min > $rootScope.dayRetData.day7_loss[i][j]) min = $rootScope.dayRetData.day7_loss[i][j];
                      }
                      x_Day7LossMin[i] = 0-min;
                    }
                    // calculate for portfolio
                    for (var i = 0; i < $rootScope.listofOtherPortfolio.length; i ++){
                      if ($rootScope.listofOtherPortfolio[i] == undefined) continue;
                      y_Day91Return.push($rootScope.listofOtherPortfolio[i].day91Array[$rootScope.sliderIndex]);
                      var min = 99999;
                      for (var j = 0; j <= $rootScope.sliderIndex; j ++){
                        if (min > $rootScope.listofOtherPortfolio[i].day7Array[j]) min = $rootScope.listofOtherPortfolio[i].day7Array[j];
                      }
                      x_Day7LossMin.push(0-min);
                    }

                    //  variables for SVG size
                    var width = window.innerWidth;
                    var height = width;
                    var margin = {top: 20, right: 10, bottom: 40, left: 40};

                    width = width - margin.right - margin.left;
                    if (width > 650) height = width / 4;
                    else height = width / 2;
                    // creating a div to contain line charts.
                    var div = d3.select(id);
                    var svg = div.append('svg:svg')
                    .attr('width', width)
                    .attr('height',	height)
                    .attr('class', 'data-scattergraph')
                    .on("mousedown", onMouseStart)
                    .on("mousemove", onMouseMove)
                    .on("mouseup", onMouseEnd);
                    
                    // setup variables
                    var y = d3.scale.linear()
                      .domain([-0.15, 0.3])
                      .range([height - margin.top,  0 + margin.bottom]);
                    var x = d3.scale.linear()
                      .domain([0, 0.25])
                      .range([ 0 + margin.left, width - margin.right ]);

                    var xAxis = d3.svg.axis()
                      .scale(x)
                      .orient("bottom");

                    var yAxis = d3.svg.axis()
                      .scale(y)
                      .orient("left");
                      
                    // line for units of actual portfolio
                    var g = svg.append("svg:g")
                      .style('stroke', '#F44336')
                      .style('fill', 'none');

                    g.append("g")
                        .attr("class", "x_axis")
                        .attr("transform", "translate(0 , " + (height - margin.top) + ")")
                        .call(xAxis);

                    g.append("g")
                        .attr("class", "y_axis")
                        .attr("transform", "translate(" + (margin.left) + ", 0)")
                        .call(yAxis);

                    var clip = svg.append("defs").append("svg:clipPath")
                        .attr("id", "clip")
                        .append("svg:rect")
                        .attr("id", "clip-rect")
                        .attr("x", margin.left - 8)
                        .attr("y", margin.bottom - 8)
                        .attr("width", width - margin.left - margin.right + 16)
                        .attr("height", height - margin.top - margin.bottom + 16);

                    d3.selectAll(".tick > text")
                        .style("font-size", "12px");

                    d3.selectAll(".x_axis > path")
                        .style("stroke-dasharray", ("3, 3"))
                        .attr("transform", "translate(0 , " + (-height+y(0)+margin.top) + ")")

                    svg.append("rect")
                        .attr("class", "rect_circle")
                        .attr("id", "rect_circle")
                        .attr("x", 100)
                        .attr("y", 100)
                        .attr("width", 74)
                        .attr("height", 60)
                        .attr("clip-path", "url(#clip)")
                        .style('fill', 'grey')
                        .style('stroke-width', 1)
                        .style('stroke', 'grey')
                        .style("opacity", 0);


                    // svg.selectAll(".dot")
                    //   .data(y_Day91Return)
                    // .enter().append("rect")
                    //   .attr("class", "start_year_line")
                    //   .attr("id", "start_year_line")
                    //   .attr("x", function(d,i) { return x(x_Day7LossMin[i])-8})
                    //   .attr("y", function(d,i) { 
                    //     var yValue = 0;                      
                    //     if (i >= $rootScope.listOfPriceFund.length){
                    //       yValue = $rootScope.listofOtherPortfolio[i-$rootScope.listOfPriceFund.length].yearRateArray[$rootScope.sliderIndex];
                    //     }else{
                    //       yValue = $rootScope.arrStartReturn[i][$rootScope.sliderIndex];
                    //     }
                    //     yValue = yValue / 100;
                    //     return y(yValue)}
                    //   )
                    //   .attr("width", 16)
                    //   .attr("height", 4)
                    //   .attr("clip-path", "url(#clip)")
                    //   .style("fill", function(d, i){
                    //     var cntFund = $rootScope.listOfPriceFund.length;
                    //     var isPort = (i < cntFund) ? 0 : 1;
                    //     var color = d3.rgb(isPort * (100 + 150/(i-cntFund+1)), (100 + 100/(i+1)) * (1-isPort), 0);
                    //     return color;
                    //   })
                    //   .style('stroke-width', 1)
                    //   .style("opacity", function(d, i){
                    //     var cntFund = $rootScope.listOfPriceFund.length;
                    //     if (i >= cntFund){
                    //       if ($rootScope.listofOtherPortfolio[i - cntFund].showhide == 0) return 0;
                    //     }
                    //     return 0.7;
                    //   })
                    //   .style("display", function(d, i){
                    //     var cntFund = $rootScope.listOfPriceFund.length;
                    //     if (i >= cntFund){
                    //       if ($rootScope.listofOtherPortfolio[i - cntFund].showhide == 0) return "none";
                    //     }
                    //     return "block";
                    //   })
                    //   .on("mouseover",  function(d,i) { return onMouseOver(i) })
                    //   .on("mouseout",  onMouseOut);
                    

                    // Add title
                    svg.selectAll(".dot")
                      .data(y_Day91Return)
                    .enter().append("text")
                      .attr("x", function(d, i) { 
                        var xValue = x_Day7LossMin[i];
                        if (xValue > 0.25) xValue = 0.25;
                        if (xValue < 0) xValue = 0;
                        return x(xValue) - 6;
                      })
                      .attr("y", function(d, i) { 
                        var yValue = d;
                        if (yValue > 0.3) yValue = 0.3;
                        if (yValue < -0.15) yValue = -0.15;
                        return y(yValue) - 10; 
                      })
                      .text( function (d, i) {
                        if (i >= $rootScope.listOfPriceFund.length) return $rootScope.listofOtherPortfolio[i-$rootScope.listOfPriceFund.length].portname;
                        else return "";
                      })
                      .attr("font-family", "sans-serif")
                      .attr("font-size", "12px")
                      .style("fill", function(d, i){
                        var cntFund = $rootScope.listOfPriceFund.length;
                        var isPort = (i < cntFund) ? 0 : 1;
                        var color = d3.rgb(isPort * (100 + 150/(i-cntFund+1)), (100 + 100/(i+1)) * (1-isPort), 0);
                        return color;
                      })
                      .style("opacity", function(d, i){
                        var cntFund = $rootScope.listOfPriceFund.length;
                        if (i >= cntFund){
                          if ($rootScope.listofOtherPortfolio[i - cntFund].showhide == 0) return 0;
                        }
                        return 0.7;
                      });

                    svg.selectAll(".dot")
                      .data(y_Day91Return)
                    .enter().append("circle")
                      .attr("class", function(d, i){
                        var classname = "";
                        if (i >= $rootScope.listOfPriceFund.length) classname = "dot_" + $rootScope.listofOtherPortfolio[i - $rootScope.listOfPriceFund.length].portname;
                        else classname = "dot_" + $rootScope.listOfPriceFund[i].name;
                        return classname;
                      })
                      .attr("id", function(d, i){
                        var classname = "";
                        if (i >= $rootScope.listOfPriceFund.length) classname = "dot_" + $rootScope.listofOtherPortfolio[i - $rootScope.listOfPriceFund.length].portname;
                        else classname = "dot_" + $rootScope.listOfPriceFund[i].name;
                        return classname;
                      })
                      .attr("r", 8)
                      .attr("cx", function(d, i) {
                        var xValue = x_Day7LossMin[i];
                        if (xValue > 0.25) xValue = 0.25;
                        if (xValue < 0) xValue = 0;
                        return x(xValue);
                        })
                      .attr("cy", function(d) {
                        var yValue = d;
                        if (yValue > 0.3) yValue = 0.3;
                        if (yValue < -0.15) yValue = -0.15;
                        return y(yValue); 
                        })
                      .attr("clip-path", "url(#clip)")
                      .style("fill", function(d, i){
                        var cntFund = $rootScope.listOfPriceFund.length;
                        var isPort = (i < cntFund) ? 0 : 1;
                        var color = d3.rgb(isPort * (100 + 150/(i-cntFund+1)), (100 + 100/(i+1)) * (1-isPort), 0);
                        return color;
                      })
                      .style("opacity", function(d, i){
                        var cntFund = $rootScope.listOfPriceFund.length;
                        if (i >= cntFund){
                          if ($rootScope.listofOtherPortfolio[i - cntFund].showhide == 0) return 0;
                        }
                        return 0.7;
                      })
                      .style("display", function(d, i){
                        var cntFund = $rootScope.listOfPriceFund.length;
                        if (i >= cntFund){
                          if ($rootScope.listofOtherPortfolio[i - cntFund].showhide == 0) return "none";
                        }
                        return "block";
                      })
                      .on("mouseover",  function(d, i){onMouseOver(i)})
                      .on("mouseout",  onMouseOut);
                      
                    var x_Array = [];
                    var y_Array = [];
                    for (var i = 0; i < $rootScope.listofOtherPortfolio.length; i ++){
                      x_Array[i] = x(x_Day7LossMin[i + $rootScope.listOfPriceFund.length]);
                      y_Array[i] = y(y_Day91Return[i + $rootScope.listOfPriceFund.length]);
                    }

                    function onMouseOver(index){
                      var xData = x_Day7LossMin[index];
                      var yData = y_Day91Return[index];

                      if (xData > 0.25) xData = 0.25;
                      if (xData < 0) xData = 0;
                      if (yData > 0.3) yData = 0.3;
                      if (yData < -0.15) yData = -0.15;

                      if (index >= $rootScope.listOfPriceFund.length){
                        if ($rootScope.listofOtherPortfolio[index-$rootScope.listOfPriceFund.length].showhide == 0) return;
                        document.getElementById("scatter_title").innerHTML = $rootScope.listofOtherPortfolio[index-$rootScope.listOfPriceFund.length].portname;
                        document.getElementById("scatter_port").innerHTML = ($rootScope.listofOtherPortfolio[index-$rootScope.listOfPriceFund.length].yearRateArray[$rootScope.sliderIndex] > 0)? "+" + $rootScope.listofOtherPortfolio[index-$rootScope.listOfPriceFund.length].yearRateArray[$rootScope.sliderIndex] + "% desde inicio, tasa periodo o annual" : $rootScope.listofOtherPortfolio[index-$rootScope.listOfPriceFund.length].yearRateArray[$rootScope.sliderIndex] + "% desde inicio, tasa periodo o annual";
                      }else{
                        document.getElementById("scatter_title").innerHTML = $rootScope.listOfPriceFund[index].name;
                        // document.getElementById("scatter_port").innerHTML = "i : " + $rootScope.dayRetData.day91_return[index][$rootScope.sliderIndex];
                        document.getElementById("scatter_port").innerHTML = ($rootScope.arrStartReturn[index][$rootScope.sliderIndex] > 0) ? "+" + $rootScope.arrStartReturn[index][$rootScope.sliderIndex] + "% desde inicio, tasa periodo o annual" : $rootScope.arrStartReturn[index][$rootScope.sliderIndex] + "% desde inicio, tasa periodo o annual";
                      }
                      
                      document.getElementById("scatter_x").innerHTML = (xData * 100).toFixed(1) + "% caída máxima en 7 días ";
                      document.getElementById("scatter_y").innerHTML = ((yData * 100).toFixed(1) >= 0) ? "+"+(yData * 100).toFixed(1) + "% en 91 días" : (yData * 100).toFixed(1) + "% en 91 días";                      

                      var tooltip = document.getElementById("scatter_tooltip");
                      tooltip.style.left = (x(xData)+310 < width) ? ((x(xData) + 30).toFixed() + "px") : ((width-310) + "px");
                      tooltip.style.top = (y(yData)+50).toFixed() + "px";
                      tooltip.style.display = "block";
                    }

                    function onMouseOut(){
                      document.getElementById("scatter_tooltip").style.display = "none";
                    }

                    var bIsStart = 0;
                    var startCoord;
                    function onMouseStart(){
                      startCoord = d3.mouse(this);
                      bIsStart = 1;
                      d3.select(".rect_circle").attr("x", startCoord[0]);
                      d3.select(".rect_circle").attr("y", startCoord[1]);
                      d3.select(".rect_circle").style("opacity", 0);
                    }
                    function onMouseMove(){
                      if (bIsStart == 1){
                        d3.select(".rect_circle").style("opacity", 0.5);
                        var curCoord = d3.mouse(this);
                        if ((curCoord[0] >= startCoord[0]) && (curCoord[1] >= startCoord[1])){
                          d3.select(".rect_circle").attr("x", startCoord[0]);
                          d3.select(".rect_circle").attr("y", startCoord[1]);
                          d3.select(".rect_circle").attr("width", curCoord[0] - startCoord[0]);
                          d3.select(".rect_circle").attr("height", curCoord[1] - startCoord[1]);
                        }
                        if ((curCoord[0] >= startCoord[0]) && (curCoord[1] < startCoord[1])){
                          d3.select(".rect_circle").attr("x", startCoord[0]);
                          d3.select(".rect_circle").attr("y", curCoord[1]);
                          d3.select(".rect_circle").attr("width", curCoord[0] - startCoord[0]);
                          d3.select(".rect_circle").attr("height", startCoord[1] - curCoord[1]);
                        }
                        if ((curCoord[0] < startCoord[0]) && (curCoord[1] >= startCoord[1])){
                          d3.select(".rect_circle").attr("x", curCoord[0]);
                          d3.select(".rect_circle").attr("y", startCoord[1]);
                          d3.select(".rect_circle").attr("width", startCoord[0] - curCoord[0]);
                          d3.select(".rect_circle").attr("height", curCoord[1] - startCoord[1]);
                        }
                        if ((curCoord[0] < startCoord[0]) && (curCoord[1] < startCoord[1])){
                          d3.select(".rect_circle").attr("x", curCoord[0]);
                          d3.select(".rect_circle").attr("y", curCoord[1]);
                          d3.select(".rect_circle").attr("width", startCoord[0] - curCoord[0]);
                          d3.select(".rect_circle").attr("height", startCoord[1] - curCoord[1]);
                        }
                      }
                    }
                    function onMouseEnd(){
                      $rootScope.hideIndex = [];
                      bIsStart = 0;
                      var endCoord = d3.mouse(this);
                      var minX = Math.min(startCoord[0], endCoord[0]);
                      var maxX = Math.max(startCoord[0], endCoord[0]);
                      var minY = Math.min(startCoord[1], endCoord[1]);
                      var maxY = Math.max(startCoord[1], endCoord[1]);
                      if ((minX != maxX) && (minY != maxY)){
                        for (var i = 0; i < $rootScope.listofOtherPortfolio.length; i ++){
                          if ((x_Array[i] >= minX) && (x_Array[i] <= maxX) && (y_Array[i] >= minY) && (y_Array[i] <= maxY)){
                          }else{
                            $rootScope.hideIndex.push(i);
                          }
                        }
                      }
                    }
                  }
                }

                scope.renderTree = function(data){

                  var elements = document.querySelectorAll('.data-treegraph');
                  elements.forEach(function (element) {
                    element.parentNode.removeChild(element);
                  });

                  var treechart = new drawTreechart(data, scope, "#tree_chart");

                  // units graph of existing portfolio and comparison portfolio
                  function drawTreechart(data, datadate, id){
                    var listofTreeMap = {"name" : "tree", "children" : []};

                    for (var i = 0; i < $rootScope.listofOtherPortfolio.length; i ++){
                      if ($rootScope.listofOtherPortfolio[i].portname != $rootScope.username) continue;
                      var eachTree = {"name" : "", "children" : []};
                      eachTree.name = $rootScope.listofOtherPortfolio[i].portname;
                      for (var j = 0; j < $rootScope.listOfPriceFund.length; j ++){
                        var children = {"name" : "", "size" : 0};
                        children.name = $rootScope.listOfPriceFund[j].name;
                        children.size = $rootScope.listofOtherPortfolio[i].weightArray[j][$rootScope.sliderIndex];
                        eachTree.children[j] = children;
                      }
                      listofTreeMap.children.push(eachTree);
                    }

                    if (listofTreeMap.children.length == 0) listofTreeMap.children.push({"name" : "", "children" : []});

                    if (listofTreeMap.children.length > 0){
                      //  variables for SVG size
                      var width = window.innerWidth;
                      var height = 500;
                      var margin = {top: 20, right: 40, bottom: 40, left: 40};
                      
                      var color = d3.scale.category20c();

                      if (width >= 1280){
                        document.getElementById("tree_house").style.height = "160px";
                        width = width / 100 * 25;
                        height = 150;
                      }else if ((width < 1280) && (width >= 900)){
                        document.getElementById("tree_house").style.height = "300px";
                        height = 280;
                      }else if ((width < 900) && (width >= 600)){
                        document.getElementById("tree_house").style.height = "200px";
                        height = 180;
                      }else{
                        document.getElementById("tree_house").style.height = "150px";
                        height = 130;
                      }
                      width = width - margin.right - margin.left;
                      // creating a div to contain line charts.
                      // color = d3.scale.linear().domain([0,100]).range(['hsla(195, 100%, 50%, 1)','hsla(195, 100%, 31%, 1)']);
                      var color = d3.scale.category10()

                      var treemap = d3.layout.treemap()
                            .size([width,height])
                            .sticky(true)
                            .value(function(d) { return d.size; });

                      var div = d3.select(id).append("div")
                            .attr('class', 'data-treegraph')
                            .style("position", "relative")
                            .style("width", (width) + "px")
                            .style("height", (height) + "px")
                            .style("left", "15px")
                            .style("top", "10px");

                      var node = div.datum(listofTreeMap).selectAll(".node")
                          .data(treemap.nodes)
                        .enter().append("div")
                          .attr("class", "node")
                          .call(position)
                          .style("background", function(d,i) { return d.children ? color(i) : null; })
                          .text(function(d) { return d.children ? null : d.name; });

                        node.data(treemap.value(function(d) { return d.size; }).nodes)
                          .transition()
                            .duration(1500)
                            .call(position);

                      function position() {
                            this.style("left", function(d) { return d.x + "px"; })
                                .style("top", function(d) { return d.y + "px"; })
                                .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
                                .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
                          }

                      d3.selectAll('.node').on('mouseover',function(){
                        d3.select(this).style('box-shadow','3px 0px 30px #fff');
                      });
                      d3.selectAll('.node').on('mouseout',function(){
                        d3.select(this).style('box-shadow','none');
                      });
                    }

                    

                    // line for units of actual portfolio
                    // var g = svg.append("svg:g")
                    //   .style('stroke', '#F44336')
                    //   .style('fill', 'none');

                    // var clip = svg.append("defs").append("svg:clipPath")
                    //     .attr("id", "clip")
                    //     .append("svg:rect")
                    //     .attr("id", "clip-rect")
                    //     .attr("x", margin.left - 8)
                    //     .attr("y", margin.bottom - 8)
                    //     .attr("width", width - margin.left - margin.right + 16)
                    //     .attr("height", height - margin.top - margin.bottom + 16);

                    // svg.append("rect")
                    //     .attr("class", "rect_circle")
                    //     .attr("id", "rect_circle")
                    //     .attr("x", 100)
                    //     .attr("y", 100)
                    //     .attr("width", 74)
                    //     .attr("height", 60)
                    //     .attr("clip-path", "url(#clip)")
                    //     .style('fill', 'grey')
                    //     .style('stroke-width', 1)
                    //     .style('stroke', 'grey')
                    //     .style("opacity", 0);
                  }
                }

                scope.render = function(data) {
                  // Remove any existing graph
                  var elements = document.querySelectorAll('.data-graph');
                  elements.forEach(function (element) {
                    element.parentNode.removeChild(element);
                  });

                  // actual and comparison portfolio charts
                  var linechart = new drawlinechart(data, scope, '#portfolio_chart'); // draw portfolio graph                  
                  var extra = new drawExtraLine($rootScope.listOfPriceFund[$rootScope.m_nSelIndex].u, scope, '#line_extra');

                  function drawlinechart(data, datadate, id, sdate){
                      data = $rootScope.portfolio;
                      if (data && data.length > 0) {
                  //  variables for SVG size
                      var width = window.innerWidth;
                      var height = 150;
                      var margin = {top: 20, right: 11, bottom: 20, left: 10};
                      if (window.innerWidth >= 1280) width = window.innerWidth / 100 * 25 - margin.left - margin.right;
                      else width = window.innerWidth - margin.left - margin.right;

                      width = width - 16 * 2; // card content
                  // creating a div to contain line charts.
                      var div = d3.select(id);
                      var svg = div.append('svg:svg')
                      .attr('width', width - 10)
                      .attr('height',	height)
                      .attr('class', 'data-graph')
                  // setup variables
                      var y = d3.scale.linear()
                        .domain(d3.extent(data.concat($rootScope.arrOtherPortfolio)))
                        .range([ 0 + margin.bottom, height - margin.top ]);
                      var x = d3.time.scale()
                        .domain(d3.extent(scope.datadate))
                        .range([ 0 + margin.left, width - margin.right ]);
                      var xi = d3.time.scale()
                        .domain(d3.extent(scope.datadate))
                        .range([0, data.length]);
                      var xAxis = d3.svg.axis()
                        .orient("bottom")
                        .scale(x)
                        .tickFormat(d3.time.format('%m-%y'));

                      // line of gain or loss in portfolio   
                      var g = svg.append("svg:g")
                        .style('stroke', '#F44336')
                        .style('fill', 'none');
                      var lineGraph = d3.svg.line()
                        .x(function(d, i) {return x(scope.datadate[i]);})
                        .y(function(d) {return height - y(d);});
                      // line chart path
                      g.append("svg:path")
                        .attr("d",lineGraph(data))
                        .style('stroke-width', 2)
                        .style('stroke', '#3663d5')
                        .style('fill', 'none');
                  
                      // tooltip for gain or loss of portfolio
                      // vertical line
                      var verticalLine = svg.append('line')
                        .attr({
                            'x1': 0,
                            'y1': 8,
                            'x2': 0,
                            'y2': height,
                        })
                        .attr("stroke", "black")
                        .attr('class', 'verticalLine')
                        .style('stroke-width', 2);
                      // date of portfolio
                      // var toolTipDate = svg.append('text')
                      //   .text(function(d) { return "" })
                      //   .attr('text-anchor', 'start')
                      //   .attr('class', 'toolTipDate')
                      //   .attr('dy', '20')
                      //   .attr('dx', '-90');
                      // value of portofolio
                      var toolTipValue = svg.append('text')
                        .text(function(d) { return "" })
                        .attr('text-anchor', 'start')
                        .attr('class', 'toolTipValue')
                        .attr('dy', '20')
                        .attr('dx', '8');
                      // 91 day return of portfolio
                      // var toolTip91dr = svg.append('text')
                      //   .text(function(d) { return "" })
                      //   .attr('text-anchor', 'start')
                      //   .attr('class', 'toolTip91dr')
                      //   .attr('dy', '40')
                      //   .attr('dx', '8');
                      // var prevToolTipValue = svg.append('text')
                      //   .text(function(d) { return "" })
                      //   .attr('text-anchor', 'start')
                      //   .attr('class', 'prevToolTipValue')
                      //   .attr('dy', '60')
                      //   .attr('dx', '8');

                      scope.$watch('sdate', function(value) {
                        if (value != undefined){
                          scope.moveTooltip(x(value));
                          $rootScope.curSlider = x(value);
                        }                        
                      });

                      scope.moveTooltip = function(xPos){
                          d3.select(".verticalLine")
                          .attr("transform", function () {
                              return "translate(" + xPos + ",0)";
                          })
                          .attr("display" , "block");
                          // value
                          d3.select(".toolTipValue")
                          .text(function(){
                            for (var i = 0; i < scope.datadate.length; i ++){
                              var cur = new Date(x.invert(xPos));
                              var item = new Date(scope.datadate[i]);
                              
                              if ($rootScope.isSameDate(cur, item) == true){
                                $rootScope.curDateIndex = i;
                                return d3.format("$0,.02f")($rootScope.portfolio[i]);
                              }
                            }
                          })
                          .attr("transform", function () {
                            var xPosition = xPos;
                            var thisWidth = this.getComputedTextLength();
                            if (thisWidth + xPos + 20 > width){
                              xPosition = xPos - thisWidth - 15;
                            }
                            return "translate(" + xPosition + ",0)";
                          })
                          .attr("display" , "block");
                      };
                    };
                  }

                  function drawExtraLine(data, datadate, id){
                      if (data && data.length > 0) {
                  //  variables for SVG size
                      var width = window.innerWidth;
                      var height = 150;
                      var margin = {top: 20, right: 11, bottom: 20, left: 10};
                      if (window.innerWidth >= 1280) width = window.innerWidth / 100 * 50 - margin.left - margin.right;
                      else width = window.innerWidth - margin.left - margin.right;

                      width = width - 16 * 2; // card content

                  // creating a div to contain fund line chart
                      var div = d3.select(id);
                      var svg = div.append('svg:svg')
                      .attr('width', width)
                      .attr('height',	height)
                      .attr('class', 'data-graph')
                  // setup variables
                      var y = d3.scale.linear()
                        .domain(d3.extent(data))
                        .range([ 0 + margin.bottom, height - margin.top ]);
                      var x = d3.time.scale()
                        .domain(d3.extent(scope.datadate))
                        .range([ 0 + margin.left, width - margin.right ]);
                      var xi = d3.time.scale()
                        .domain(d3.extent(scope.datadate))
                        .range([0, data.length]);
                      var xAxis = d3.svg.axis()
                        .orient("bottom")
                        .scale(x)
                        .tickFormat(d3.time.format('%m-%y'));
                      var g = svg.append("svg:g")
                        .style('stroke', '#9E9E9E')
                        .style('fill', 'none');
                      var lineGraph = d3.svg.line()
                        .x(function(d, i) {return x(scope.datadate[i]);})
                        .y(function(d) {return height - y(d);});
                  // fund line chart path
                      g.append("svg:path")
                        .attr("d",lineGraph(data))
                        .style('stroke-width', 2)
                        .style('stroke', '#3663d5')
                        .style('fill', 'none');
                      // tooltip
                      var verticalLine = svg.append('line')
                        .attr({
                            'x1': 0,
                            'y1': 8,
                            'x2': 0,
                            'y2': height - 8
                        })
                        .attr("stroke", "black")
                        .attr('class', 'line_exvline')
                        .style('stroke-width', 2);
                      // tooltip value
                      var toolTipValue = svg.append('text')
                        .text(function(d) { return "" })
                        .attr('text-anchor', 'start')
                        .attr('class', 'line_extoolTipValue')
                        .attr('dy', '20')
                        .attr('dx', '8');

                      scope.$watch('sdate', function(value) {
                        if (value != undefined){
                          // console.log(x(value));
                          scope.moveTooltip_e(x(value));
                        }                        
                      });

                      scope.moveTooltip_e = function(xPos){
                          d3.select(".line_exvline")
                          .attr("transform", function () {
                              return "translate(" + xPos + ",0)";
                          })
                          .attr("display" , "block");
                          d3.select(".line_extoolTipValue")
                          .text(function(){
                              return d3.format("$0,.06f")($rootScope.listOfPriceFund[$rootScope.m_nSelIndex].u[$rootScope.curDateIndex]);
                          })
                          .attr("transform", function () {
                              var xPosition = xPos;
                              var thisWidth = this.getComputedTextLength();
                              if (thisWidth + xPos + 20 > width){
                                xPosition = xPos - thisWidth - 15;
                              }
                              return "translate(" + xPosition + ",0)";
                          })
                          .attr("display" , "block");
                      };                      
                    };
                  }
              }
            }
          };
      }]);
}());

