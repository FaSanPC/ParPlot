//Inizialization of global variables
var width = document.body.clientWidth,
    height = 300,
    selectedItems=[],
    nameSelectedItems=[],
    data,
    dataBrushed=[],
    dataUnbrushed,
    grid2,
    mainData=[],
    maxAxis,
    minAxis,
    canvasClasses=null,
    color_scale,
    dataView,
    countCharacteristics,
    selected=true;

  
// Variable that contain the COLORS corresponfing to the gruops of data (bars chart)

var colorgen = d3.scale.ordinal()
.range(["#ed2315","#fffb0f","#1bff0f","#3f0fff","#00FFFF","#FF8C00","#9932CC","#DAA520","#ADFF2F","#FF69B4","#00FA9A","#BC8F8F","#8B4513"]);

  var color = function(d) { return colorgen(d.group); };


// Parcoords variable creation
var parcoords = d3.parcoords()("#example")
  .alpha(0.4)
  .mode("queue") // progressive rendering
    .createAxes()
  .height(height)
    .width(width)
  .margin({
    top: 36,
    left: 0,
    right: 0,
    bottom: 16
  });


/////////////////////////////////////////////////////////////////////START MAIN FUNCTION////////////
////////////////////////////////////////////

// create chart from loaded data
function parallelCoordinates(data) {

 // slickgrid needs each data element to have an id
  data.forEach(function(d,i) { d.id = d.id || i; });
    
   
 console.log(data);
//Setting reference data into Selected Items
if(clearSearch!="guardado"){
    for(var c=0;c<data.length; c++){
        if(data[c].name.includes("ref_")){
         selectedItems.unshift(data[c]);
            }
        }
}
    
/////////////////  
 

// setting parallel coordinates graph
  parcoords
    .data(data)
    .render()
    .hideAxis(["name","group","id"])
    .createAxes()
    .reorderable()
    .color(color)
    .brushMode("1D-axes");
 
  // setting up grid
  var column_keys = d3.keys(data[0]);
  var columns = column_keys.map(function(key,i) {
    return {
      id: key,
      name: key,
      field: key,
      sortable: true
    }
  });

  var options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    multiColumnSort: false
  };

  dataView = new Slick.Data.DataView();
  var grid = new Slick.Grid("#grid", dataView, columns, options);
  var pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));

  // wire up model events to drive the grid
  dataView.onRowCountChanged.subscribe(function (e, args) {
    grid.updateRowCount();
    grid.render();
  });

  dataView.onRowsChanged.subscribe(function (e, args) {
    grid.invalidateRows(args.rows);
    grid.render();
  });

  // column sorting
  var sortcol = column_keys[0];
  var sortdir = 1;

  function comparerText(a, b) {
   var x = a[sortcol], y = b[sortcol];
   return (x == y ? 0 : (x > y ? 1 : -1));
  }

    function comparerNum(a, b) {
       var x = (isNaN(a[sortcol]) || a[sortcol] === "" || a[sortcol] === null) ? -99e+10 : parseFloat(a[sortcol]);
    var y = (isNaN(b[sortcol]) || b[sortcol] === "" || b[sortcol] === null) ? -99e+10 : parseFloat(b[sortcol]);
    return sortdir * (x === y ? 0 : (x > y ? 1 : -1));
  }
  
  // click header to sort grid column
  grid.onSort.subscribe(function (e, args) {
    sortdir = args.sortAsc ? 1 : -1;
    sortcol = args.sortCol.field;

    if ($.browser.msie && $.browser.version <= 8) {
      dataView.fastSort(sortcol, args.sortAsc);
    } else {  
    console.log(args.sortCol.name);  
    if(args.sortCol.name=="name"||args.sortCol.name=="group"){
      dataView.sort(comparerText, args.sortAsc);}
    else{
       dataView.sort(comparerNum, args.sortAsc);
    }
        
    }
  });

  // highlight row in chart
  grid.onMouseEnter.subscribe(function(e,args) {
    // Get row number from grid
    var grid_row = grid.getCellFromEvent(e).row;

    // Get the id of the item referenced in grid_row
    var item_id = grid.getDataItem(grid_row).id;
    var d = parcoords.brushed() || data;

    // Get the element position of the id in the data object
    elementPos = d.map(function(x) {return x.id; }).indexOf(item_id);

    // Highlight that element in the parallel coordinates graph
    parcoords.highlight([d[elementPos]]);
  });
    
    
  grid.onMouseLeave.subscribe(function(e,args) {
      if(selected){
    parcoords.unhighlight();
      }
      else{
        parallelCoordinatesFixed(selectedItems);
      }
  });
    
    // on Click in chart 
    grid.onClick.subscribe(function(e, args) {
        var item=dataView.getItem(args.row);
        
        if(!selectedItems.includes(item)){
               selectedItems.unshift(item);
        }  
    dataNameSelected(selectedItems);
   parallelCoordinatesFixed(selectedItems);
        
    });

    
  // fill grid with data
  gridUpdate(data);

  // update grid/bars_chart on brush. Save data brushed in a variable  
  parcoords.on("brush", function(d) {
    dataBrushed=d;
      
    //Keep condition related to selected items
         if(selected){
    parcoords.unhighlight();
      }
      else{
        parallelCoordinatesFixed(selectedItems);
      }

    gridUpdate(d);
    statistics();
  });

  function gridUpdate(data) {
    dataView.beginUpdate();
    dataView.setItems(data);
    dataView.endUpdate();
      
  };

    
    
    
    ///////Selection items grid
        //Set just names column
     for(var c=0;c<selectedItems.length; c++){
         var nsi={name:selectedItems[c].name};
         console.log(nsi); 
    nameSelectedItems.unshift(nsi);
     }
    
   console.log(nameSelectedItems);
    
    grid2 = d3.divgrid();
  d3.select("#extra-info")
    .datum(nameSelectedItems)
    .call(grid2)
    .selectAll(".row");
    
        //Conect data with parcoords
     d3.select("#extra-info")
    .datum(selectedItems)
    .call(grid2)
    .selectAll(".row")
    .on({
      "mouseover": function(d) { parcoords.highlight([d]) },
      "mouseout":  function(){ 
      if(selected){
        parcoords.unhighlight();
      }
      else{
        parallelCoordinatesFixed(selectedItems);
                }
                },
         //delete item at double click
        "dblclick": function(d){
            for( i=selectedItems.length-1; i>=0; i--) {
        if( selectedItems[i].name == d.name) selectedItems.splice(i,1);
                }
             d3.select("#extra-info")
                    .datum(selectedItems)
                    .call(grid2)
                    .selectAll(".row");
                }
    } );
    

   ///Call update functions
    bars_chart()
    statistics()
    fillDropDownMenu()
  
};

/////////////////////////////////////////////////////////////////////END MAIN FUNCTION////////////
////////////////////////////////////////////

//////Function that highlights the selected  data
function parallelCoordinatesFixed() {
    
    parcoords.highlight(selectedItems);
    
}

///// Search by text (search box)
     d3.select("#search").on("keyup", show);
    
    function show(){
        console.log(data);
        var tempArray=[];
       var query = d3.select("#search")[0][0].value;
        
        if(query.length>0){
    for(var c=0;c<data.length; c++){
        if(data[c].name.includes(query)){
        tempArray.unshift(data[c]);
            }
        }
            dataView.beginUpdate();
            dataView.setItems(tempArray);
            dataView.endUpdate();
            parcoords
                .data(tempArray)
                .render();
    }
        else{
            dataView.beginUpdate();
            dataView.setItems(data);
            dataView.endUpdate();
            parcoords
                .data(data)
                .render();
            };
        
    };



///// Bars chart//////
    
    //data for bars chart
    function bars_chart(){
    
        /// If NOT crated the bars allready
    if (null==canvasClasses) { 
    var dataGroup=[];
    for(var contador=0;contador<data.length; contador++){
    var itemGroup = data[contador].group;
       dataGroup.unshift(itemGroup);
   }
        
    //get number of items per group
    var counts = {};
    dataGroup.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });
    var values=Object.values(counts); 
        
   countCharacteristics=Object.getOwnPropertyNames(counts);
    
        //Create array of groups
    var dataArray=[];
    
    for(var c=0;c<(countCharacteristics.length); c++){
       var gr=countCharacteristics[c];
        
       var ct=values[c];

       var tempp={group: gr,numRep:ct};
        
        
       dataArray.push(tempp);
   } 
            
     
    var maxValue=Math.max.apply(Math,dataArray.map(function(o){return o.numRep;}));
    
    ////// Shape bars chart
    var widthBarArray=350;
    var heightBarArray=500;
    
    
    var widthScale=d3.scale.linear()
                    .domain([0,maxValue])
                    .range([0,widthBarArray]);
    
        
        
    /////// Canvas bars chart -Classes
    canvasClasses=d3.select("#grid1")
                    .append("svg")
                    .attr("width",widthBarArray)
                    .attr("height",heightBarArray)
                    .append("g");

        //creation of bars chart
        canvasClasses.selectAll("rect")
                .data(dataArray)
                .enter()
                    .append("rect")
                    .attr("width",function(d){return widthScale(d.numRep);})
                    .attr("height",10)
                    .attr("fill",function(d){return color(d)})
                    .attr("y", function(d,i){return i*30;})
                    .on("click",function(d){
            var ggg=d.group;
            console.log(ggg);
            });
    
        //text on bars
        canvasClasses.selectAll("text")
            .data(dataArray)
            .enter()
                .append("text")
                .attr("fill", "black")
                .attr("y", function(d,i){return i*30+20;})
                .text(function(d){return d.group+": "+d.numRep;});
        }
        
        /// If crated the bars allready (update)////
        else{
            
    dataGroup=[];
    for(var contador=0;contador<data.length; contador++){
    var itemGroup = data[contador].group;
       dataGroup.unshift(itemGroup);
   }
            
    //get number of items per group
    counts = {};
    dataGroup.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });
    var values=Object.values(counts); 
    var countCharac2Case=Object.getOwnPropertyNames(counts);
    var values2=[];        
    
   
    for(var c1=0;c1<(countCharacteristics.length); c1++){
        var findVal=false;
        
        for(var c2=0;c2<(countCharac2Case.length); c2++){
            if(countCharacteristics[c1]==countCharac2Case[c2]){
               values2[c1]=values[c2];
                findVal=true;
            }
            if (!findVal){
                values2[c1]=0;
            }
        }
   }   
           
    var dataArray=[];
    
    for(var c=0;c<(countCharacteristics.length); c++){
       var gr=countCharacteristics[c];
        
       var ct=values2[c];

       var tempp={group: gr,numRep:ct};
        
        
       dataArray.push(tempp);
   }        
    
    
    maxValue=Math.max.apply(Math,dataArray.map(function(o){return o.numRep;}));
    
    ////// Shape bars chart
    widthBarArray=350;
    heightBarArray=500;
    
    widthScale=null;        
    widthScale=d3.scale.linear()
                    .domain([0,maxValue])
                    .range([0,widthBarArray]);
    
    /////// Canvas bars chart -Classes

        //creation of bars chart
        canvasClasses.selectAll("rect")
                    .data(dataArray)
                    .attr("width",function(d){return widthScale(d.numRep);});
    
        //text on bars
        canvasClasses.selectAll("text")
                .data(dataArray)
                .text(function(d){return d.group+": "+d.numRep;});
        }
    }


////Add list of names Selected Items///////////

function dataNameSelected(selectedItems){
    //Set just names column
     for(var c=0;c<selectedItems.length; c++){
         var nsi={name:selectedItems[c].name};
         console.log(nsi); 
    nameSelectedItems.unshift(nsi);
     }
    
   console.log(nameSelectedItems);
    
    grid2 = d3.divgrid();
  d3.select("#extra-info")
    .datum(nameSelectedItems)
    .call(grid2)
    .selectAll(".row");
    
    //Conect whit data at parcoords
      d3.select("#extra-info")
      .datum(selectedItems)
      .call(grid2)
      .selectAll(".row")
      .on({
    "mouseover": function(d) { parcoords.highlight([d]) },
    "mouseout":  function(){ 
          
      if(selected){
        parcoords.unhighlight();
      }
      else{
        parallelCoordinatesFixed(selectedItems);
                }
            },
           //delete item at double click
    "dblclick": function(d){
            for( i=selectedItems.length-1; i>=0; i--) {
        if( selectedItems[i].name == d.name) selectedItems.splice(i,1);
                }
             d3.select("#extra-info")
                    .datum(selectedItems)
                    .call(grid2)
                    .selectAll(".row");
                }
      });  
    
}
/////

/////////CSV Downloader
function convertArrayOfObjectsToCSV(args) {
        var result, ctr, keys, columnDelimiter, lineDelimiter, data;

        data = args.data || null;
        if (data == null || !data.length) {
            return null;
        }

        columnDelimiter = args.columnDelimiter || ',';
        lineDelimiter = args.lineDelimiter || '\n';

        keys = Object.keys(data[0]);

        result = '';
        result += keys.join(columnDelimiter);
        result += lineDelimiter;

        data.forEach(function(item) {
            ctr = 0;
            keys.forEach(function(key) {
                if (ctr > 0) result += columnDelimiter;

                result += item[key];
                ctr++;
            });
            result += lineDelimiter;
        });

        return result;
    }

///Downloader for active data
function downloadCSV1(args) {
        var filename, link;

        var csv = convertArrayOfObjectsToCSV({
            data
        });
        if (csv == null) return;

        filename = args.filename || 'export.csv';

        if (!csv.match(/^data:text\/csv/i)) {
            csv = 'data:text/csv;charset=utf-8,' + csv;
        }
        data = encodeURI(csv);

        link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();
    }

///Downloader for selected items
    function downloadCSV(args) {
        
        var data, filename, link;

        var csv = convertArrayOfObjectsToCSV({
            data: selectedItems
        });
        if (csv == null) return;

        filename = args.filename || 'export.csv';

        if (!csv.match(/^data:text\/csv/i)) {
            csv = 'data:text/csv;charset=utf-8,' + csv;
        }
        data = encodeURI(csv);

        link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();
    }

//Download screenshot
function downloadScreenshot() {
    window.print();
    }



/////////////////////////////// CSV Uploader
////Parcoords data
var uploader = document.getElementById("uploader");  
var reader = new FileReader();

reader.onload = function(e) {
  var contents = e.target.result;
  data = d3.csv.parse(contents);
    mainData=d3.csv.parse(contents);
  parallelCoordinates(data);
  // remove button, since re-initializing doesn't work for now
  uploader.parentNode.removeChild(uploader);
    var element = document.getElementById("valueLabel");
element.parentNode.removeChild(element);
    
};

uploader.addEventListener("change", handleFiles, false);  

function handleFiles(brushSelections) {
  var file = this.files[0];
  reader.readAsText(file);
};

/////////////////////////////

///// Basic buttons
d3.select("#clear-search").on("click", clean_search);
d3.select("#keep-data").on("click", keep_data);
d3.select("#exclude-data").on("click", exclude_data);
d3.select("#refresh").on("click", refresh_page);

///start process again with the initial uploaded data
function clean_search(){
    
    /// Boolean variable to verify at reload
    var clearSearch="guardado";
    localStorage.setItem("clearSearch", clearSearch);
    
    /// Save data (locar storage)
    var data=mainData;
    localStorage.setItem('data',JSON.stringify(data));
    //localStorage.setItem("data", data);
    localStorage.setItem('selectedItems',JSON.stringify(selectedItems));
    
    location.reload();   
  
}

//F5 to start a new project
function refresh_page(){
    var clearSearch="NoGuardado";
    localStorage.setItem("clearSearch", clearSearch);
    
    location.reload();
    }


//erase not brushed data
function keep_data(){
    
   data=dataBrushed;
    console.log(mainData);
    console.log(data);
    
    
    dataView.beginUpdate();
    dataView.setItems(data);
    dataView.endUpdate();

    parcoords
        .data(data)
        .render();
     dataBrushed=[];
    
    //Keep condition related to selected items
         if(selected){
    parcoords.unhighlight();
      }
      else{
        parallelCoordinatesFixed(selectedItems);
      }
        
    
    bars_chart();
}

//erase brushed data
function exclude_data(){
      console.log("in");
      console.log(mainData);
    console.log(data);
   var tempData=[];
    var inside= false;
    for(var c1=0;c1<data.length; c1++){
        for(var c2=0;c2<dataBrushed.length; c2++){
            inside=false;
          if (dataBrushed[c2].name==data[c1].name) {
              inside =true;
              c2=dataBrushed.length;
          }  
        }
        if(!inside){
            tempData.unshift(data[c1]);  
        }
    }
    
    data=tempData.slice();
    console.log(mainData);
    console.log(data);
     dataView.beginUpdate();
    dataView.setItems(data);
    dataView.endUpdate();

    parcoords
        .data(data)
        .render();
    dataBrushed=[];
    
    //Keep condition related to selected items
         if(selected){
    parcoords.unhighlight();
      }
      else{
        parallelCoordinatesFixed(selectedItems);
      }
        
    
    bars_chart();
}

//Appearance toggles
d3.select("#hide-ticks").on("click", hide_ticks);
d3.select("#show-ticks").on("click", show_ticks);
d3.select("#dark-theme").on("click", dark_theme);
d3.select("#light-theme").on("click", light_theme);

function hide_ticks() {
  d3.selectAll(".axis g").style("display", "none");
  //d3.selectAll(".axis path").style("display", "none");
  //d3.selectAll(".background").style("visibility", "hidden");
  d3.selectAll("#hide-ticks").attr("disabled", "disabled");
  d3.selectAll("#show-ticks").attr("disabled", null);
};

function show_ticks() {
  d3.selectAll(".axis g").style("display", null);
  //d3.selectAll(".axis path").style("display", null);
  //d3.selectAll(".background").style("visibility", null);
  d3.selectAll("#show-ticks").attr("disabled", "disabled");
  d3.selectAll("#hide-ticks").attr("disabled", null);
};

function dark_theme(data) {
  d3.select("body").attr("class", "dark");
    d3.select("#main").attr("class", "dark");
  d3.selectAll("#dark-theme").attr("disabled", "disabled");
  d3.selectAll("#light-theme").attr("disabled", null);
}

function light_theme() {
  d3.select("body").attr("class", null);
    d3.select("#main").attr("class", null);
  d3.selectAll("#light-theme").attr("disabled", "disabled");
  d3.selectAll("#dark-theme").attr("disabled", null);
}



///////Selected items toggles 
//Show selected items
d3.select("#on-selected").on("click",
                             function(){
                selected=false;
            console.log(selected);
                parallelCoordinatesFixed();
                                });
///Hide selected itmes
d3.select("#off-selected").on("click", offSelected);
function offSelected(){
       selected=true;
parcoords.unhighlight();
}


/////////////////////////////


///// Statistics
function statistics(){
d3.select("#rendered-count").text(dataBrushed.length);
d3.select("#data-count").text(data.length);
}


///// Drop Down Menu
//Fill menu with axes names
function fillDropDownMenu(){
    var axisNames=Object.getOwnPropertyNames(data[0]);
    var select = document.getElementById('drop-down');
    
    for(var c=2;c<axisNames.length; c++){
        var opt = document.createElement('option');
    opt.value = axisNames[c];
    opt.innerHTML = axisNames[c];
    select.appendChild(opt);
          }     
}

//Get selected option from menu
 function dropDownMenu(that) {
     
//Case option selected "Group"
     if('Group'==that.value){
         
  //Set colors according to the groups       
        parcoords
     .render()
     .color(color);
    
//Keep condition related to selected items
         if(selected){
    parcoords.unhighlight();
      }
      else{
        parallelCoordinatesFixed(selectedItems);
      }
        }
     
  //Case option selected different than "Group"   
     else{ 
         
    //Get max and minimum values from selected option
        
     maxAxis= Math.max.apply(Math,data.map(function(d){return d[that.value];}));
    minAxis= Math.min.apply(Math,data.map(function(d){return d[that.value];}));
     
     console.log(maxAxis);
        console.log(minAxis);
     
    //Set color range     
     color_scale = d3.scale.linear()
    .domain([minAxis, maxAxis])
    .range(["green", "blue"])
    .interpolate(d3.interpolateLab);
     
     
     var colorAxis = function(d) { return  color_scale(d[that.value]); };
     
     parcoords
     .render()
     .color(colorAxis);
         
    
     //Update sliders
     d3.select("#bundling1")
     .attr('min', minAxis)
      .attr('max', maxAxis)
     .attr('step',0.005);
     
     d3.select("#bundling2")
     .attr('min', minAxis)
      .attr('max', maxAxis)
     .attr('step',0.005);
     
     //// bundling slider 1
    d3.select("#bundling1").on("change", function() {
    d3.select("#strength1").text(this.value);
        
        maxAxis=this.value;
        
         color_scale = d3.scale.linear()
            .domain([minAxis, maxAxis])
            .range(["green", "blue"])
            .interpolate(d3.interpolateLab);
        
        var colorMaxAxis = function(d) { return  color_scale(d[that.value]); };
        
        parcoords
        .render()
        .color(colorMaxAxis);
        
     if(selected){
        parcoords.unhighlight();
        }
        else{
        parallelCoordinatesFixed(selectedItems);
      }
    });
     
     //// bundling slider 2
       d3.select("#bundling2").on("change", function() {
    d3.select("#strength2").text(this.value);
        
        minAxis=this.value;
        
         color_scale = d3.scale.linear()
            .domain([minAxis, maxAxis])
            .range(["green", "blue"])
            .interpolate(d3.interpolateLab);
        
        var colorMinAxis = function(d) { return  color_scale(d[that.value]); };
        
        parcoords
        .render()
        .color(colorMinAxis);
           
           if(selected){
        parcoords.unhighlight();
        }
        else{
        parallelCoordinatesFixed(selectedItems);
      }
    });
         
        //Maintain the actual state of selected items
         if(selected){
    parcoords.unhighlight();
      }
      else{
        parallelCoordinatesFixed(selectedItems);
      }
    }
 }


/////////Get info in case of clear search
var clearSearch = localStorage.getItem("clearSearch");
console.log(clearSearch);


if(clearSearch=="guardado"){
    
    //Re-load data
var retrievedObject = localStorage.getItem('data');
var retrievedObject2 = localStorage.getItem('selectedItems');
    

data=JSON.parse(retrievedObject);
mainData=JSON.parse(retrievedObject);  
    
var varX=JSON.parse(retrievedObject2); 
selectedItems=varX;
    console.log(selectedItems);
 
   console.log(data);
    parallelCoordinates(data);
    //Remove loading data button and label
     var element = document.getElementById("valueLabel");
    element.parentNode.removeChild(element);
     uploader.parentNode.removeChild(uploader);
    
}
else{console.log("out")};
///
 
////////////////////////////////////