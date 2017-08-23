(function() {
  var fs = require('fs');
  var express = require('express');
  var http = require('http');
  var mysql = require('mysql');
  var bodyParser = require('body-parser');
  var parseXlsx = require('xlsx');
  var csv = require('fast-csv');
  var app = express();

app.set('port', process.env.PORT || 8080);
app.use(express.static(__dirname + '/app'));
app.use(bodyParser.json());

app.post('/getExcel', function(req, res){
  var csvdata = [];
  
  csv.fromString(req.body.user, {headers: true})
    .on("data", function(data){
        csvdata.push(data);
    })
    .on("end", function(){
        res.json(csvdata);
    });
});
app.post('/buy', function(req, res){
  var pObject = req.body.user;
  if (pObject.length > 0){
    var portfolio_ID = pObject[0].portfolio_id;
    var strDate = pObject[0].nowDate;

    var csvdata_portfolio = [];
    var stream_portfolio = fs.createReadStream(__dirname + "/app/testdb/portnames.csv");
    csv.fromStream(stream_portfolio, {headers : ["portfolio_id", "portfolio_name_saver"]})
      .on("data", function(data){
        csvdata_portfolio.push(data);
      })
      .on("end", function(){
        var bIsExist = false;
        for (var i = 0; i < csvdata_portfolio.length; i ++){
          if (csvdata_portfolio[i].portfolio_id == portfolio_ID){
            bIsExist = true;
            break;
          }
        }

        if (bIsExist == true){
          // exist
        }else{
          csvdata_portfolio.push({"portfolio_id" : portfolio_ID, "portfolio_name_saver" : portfolio_ID});
          var csvStream_portfolio = csv.createWriteStream({headers: false}),
          writableStream = fs.createWriteStream(__dirname + "/app/testdb/portnames.csv");

          writableStream.on("finish", function(){
            // success injection portfolio data into database
          });

          csvStream_portfolio.pipe(writableStream);      
          for (var i = 0; i < csvdata_portfolio.length; i ++){
            csvStream_portfolio.write({"portfolio_id" : csvdata_portfolio[i].portfolio_id, "portfolio_name_saver" : csvdata_portfolio[i].portfolio_name_saver});
          }
          csvStream_portfolio.end();
        }

        var csvdata_transaction = [];
        var stream_transaction = fs.createReadStream(__dirname + "/app/testdb/transaction.csv");
        csv.fromStream(stream_transaction, {headers : ["transaction_id", "transaction_portfolio_id", "transaction_saver_id", "fund_id_bought", "units_bought", "fund_id_sold", "units_sold", "date_value_transaction"]})
          .on("data", function(data){
            csvdata_transaction.push(data);
          })
          .on("end", function(){
            // read transaction data successfully
            var nWriteCnt = 0;
            for (var n = 0; n < pObject.length; n ++){
              var param1 = pObject[n].portfolio_id;
              var param2 = pObject[n].saver_id;
              var param3 = pObject[n].fund_id_bought;
              var param4 = pObject[n].units_bought;
              var param5 = pObject[n].fund_id_sold;
              var param6 = pObject[n].units_sold;
              var param7 = pObject[n].date_value_transaction;

              // console.log("================ Parameters ================");
              // console.log(param1);
              // console.log(param2);
              // console.log(param3);
              // console.log(param4);
              // console.log(param5);
              // console.log(param6);
              // console.log(param7);
              // console.log("================ Parameters ================");

              for (var i = 1; i < 99999; i ++){
                var bIsFound = false;
                for (var j = 0; j < csvdata_transaction.length; j ++){
                  if (csvdata_transaction[j].transaction_id * 1 == i){
                    bIsFound = true;
                    break;
                  }
                }
                if (bIsFound == false){
                  csvdata_transaction.push({"transaction_id" : csvdata_transaction.length, "transaction_portfolio_id" : param1, "transaction_saver_id" : param2, "fund_id_bought" : param3, "units_bought" : param4, "fund_id_sold" : param5, "units_sold" : param6, "date_value_transaction" : param7});
                  break;
                }
              }
            }

            var csvStream = csv.createWriteStream({headers: false}),
            writableStream = fs.createWriteStream(__dirname + "/app/testdb/transaction.csv");

            writableStream.on("finish", function(){
              res.json("done");
            });

            csvStream.pipe(writableStream);      
            for (var i = 0; i < csvdata_transaction.length; i ++){
              csvStream.write({"transaction_id" : csvdata_transaction[i].transaction_id, "transaction_portfolio_id" : csvdata_transaction[i].transaction_portfolio_id, "transaction_saver_id" : csvdata_transaction[i].transaction_saver_id, "fund_id_bought" : csvdata_transaction[i].fund_id_bought, "units_bought" : csvdata_transaction[i].units_bought, "fund_id_sold" : csvdata_transaction[i].fund_id_sold, "units_sold" : csvdata_transaction[i].units_sold, "date_value_transaction" : csvdata_transaction[i].date_value_transaction});
            }
            csvStream.end();
          });
      });
  }
})

// get returns from MySQL database
app.get('/ret/:sDate', function(req, res){
  var csvdata = [];
  var stream = fs.createReadStream(__dirname + "/app/testdb/fundinformation.csv");
  csv.fromStream(stream, {headers : ["pr_fund_id", "fund_id_pr_fund","pr_fund", "date_value_pr_fund"]})
    .on("data", function(data){
      csvdata.push(data);
    })
    .on("end", function(){
      res.json(csvdata);
    });
});

// get fund ids and names from MySQL database
app.get('/ret1', function(req, res){
  var csvdata = [];
  var stream = fs.createReadStream(__dirname + "/app/testdb/fundnames.csv");
  csv.fromStream(stream, {headers : ["fund_id_alias_fund", "alias", "alias_match_1", "alias_match_2", "alias_match_3"]})
    .on("data", function(data){
      csvdata.push(data);
    })
    .on("end", function(){
      res.json(csvdata);
    });
});

app.get('/userInfo', function(req, res){
  var csvdata = [];
  var stream = fs.createReadStream(__dirname + "/app/testdb/portnames.csv");
  csv.fromStream(stream, {headers : ["portfolio_id", "portfolio_name_saver"]})
    .on("data", function(data){
      csvdata.push(data);
    })
    .on("end", function(){
      res.json(csvdata);
    });
});

app.get('/transaction/:portid', function(req, res){
  var csvdata = [];
  var stream = fs.createReadStream(__dirname + "/app/testdb/transaction.csv");
  csv.fromStream(stream, {headers : ["transaction_id", "transaction_portfolio_id", "transaction_saver_id", "fund_id_bought", "units_bought", "fund_id_sold", "units_sold", "date_value_transaction"]})
    .on("data", function(data){
      csvdata.push(data);
    })
    .on("end", function(){
      res.json(csvdata);
    });
});

app.get('/delete/:id', function(req, res){
  var trans_id = req.params.id;
  var csvdata = [];
  var stream = fs.createReadStream(__dirname + "/app/testdb/transaction.csv");
  csv.fromStream(stream, {headers : ["transaction_id", "transaction_portfolio_id", "transaction_saver_id", "fund_id_bought", "units_bought", "fund_id_sold", "units_sold", "date_value_transaction"]})
    .on("data", function(data){
      csvdata.push(data);
    })
    .on("end", function(){
      var newdata = [];
      for (var i = 0; i < csvdata.length; i ++){
        if (csvdata[i].transaction_id == trans_id){
          continue;
        }
        newdata.push(csvdata[i]);
      }

      var csvStream = csv.createWriteStream({headers: false}),
      writableStream = fs.createWriteStream(__dirname + "/app/testdb/transaction.csv");

      writableStream.on("finish", function(){
        res.json("done");
      });

      csvStream.pipe(writableStream);      
      for (var i = 0; i < newdata.length; i ++){
        csvStream.write({"transaction_id" : newdata[i].transaction_id, "transaction_portfolio_id" : newdata[i].transaction_portfolio_id, "transaction_saver_id" : newdata[i].transaction_saver_id, "fund_id_bought" : newdata[i].fund_id_bought, "units_bought" : newdata[i].units_bought, "fund_id_sold" : newdata[i].fund_id_sold, "units_sold" : newdata[i].units_sold, "date_value_transaction" : newdata[i].date_value_transaction});
      }
      csvStream.end();
    });
});

 // save transaction to transaction table in MySQL database
 app.get('/buy/:fund_id_bought/:units_bought/:fund_id_sold/:units_sold/:date_value_transaction/:portfolio_id/:saver_id/:nowDate', function(req, res){
    
    // default value of 1 for transaction_portfolio_id and transaction_saver_id 
    var param1 = req.params.portfolio_id;
    var param2 = req.params.saver_id;
    var param3 = req.params.fund_id_bought;
    var param4 = req.params.units_bought;
    var param5 = req.params.fund_id_sold;
    var param6 = req.params.units_sold;
    var param7 = req.params.date_value_transaction;
    var param8 = req.params.nowDate;

    // console.log("================ Parameters ================");
    // console.log(param1);
    // console.log(param2);
    // console.log(param3);
    // console.log(param4);
    // console.log(param5);
    // console.log(param6);
    // console.log(param7);
    // console.log(param8);
    // console.log("================ Parameters ================");
    var csvdata_portfolio = [];
    var stream_portfolio = fs.createReadStream(__dirname + "/app/testdb/portnames.csv");
    csv.fromStream(stream_portfolio, {headers : ["portfolio_id", "portfolio_name_saver"]})
      .on("data", function(data){
        csvdata_portfolio.push(data);
      })
      .on("end", function(){
        var bIsExist = false;
        for (var i = 0; i < csvdata_portfolio.length; i ++){
          if (csvdata_portfolio[i].portfolio_id == param1){
            bIsExist = true;
            break;
          }
        }

        if (bIsExist == true){
          // exist
        }else{
          csvdata_portfolio.push({"portfolio_id" : param1, "portfolio_name_saver" : param1});
          var csvStream_portfolio = csv.createWriteStream({headers: false}),
          writableStream = fs.createWriteStream(__dirname + "/app/testdb/portnames.csv");

          writableStream.on("finish", function(){
            // success injection portfolio data into database
          });

          csvStream_portfolio.pipe(writableStream);      
          for (var i = 0; i < csvdata_portfolio.length; i ++){
            csvStream_portfolio.write({"portfolio_id" : csvdata_portfolio[i].portfolio_id, "portfolio_name_saver" : csvdata_portfolio[i].portfolio_name_saver});
          }
          csvStream_portfolio.end();
        }

        var csvdata_transaction = [];
        var stream_transaction = fs.createReadStream(__dirname + "/app/testdb/transaction.csv");
        csv.fromStream(stream_transaction, {headers : ["transaction_id", "transaction_portfolio_id", "transaction_saver_id", "fund_id_bought", "units_bought", "fund_id_sold", "units_sold", "date_value_transaction"]})
          .on("data", function(data){
            csvdata_transaction.push(data);
          })
          .on("end", function(){
            // read transaction data successfully
            var bIsUpdate = false;
            for (var i = 0; i < csvdata_transaction.length; i ++){
              if ((csvdata_transaction[i].transaction_portfolio_id == param1)
              && (csvdata_transaction[i].date_value_transaction == param7) && (csvdata_transaction[i].fund_id_bought == param3)
              && (csvdata_transaction[i].fund_id_sold == param5)){
                // update transaction if there is a previous transaction for that fund on that date
                bIsUpdate = true;
                csvdata_transaction[i].units_bought = param4;
                csvdata_transaction[i].units_sold = param6;
                break;
              }
            }

            if (bIsUpdate == false){
              for (var i = 1; i < 99999; i ++){
                var bIsFound = false;
                for (var j = 0; j < csvdata_transaction.length; j ++){
                  if (csvdata_transaction[j].transaction_id * 1 == i){
                    bIsFound = true;
                    break;
                  }
                }
                if (bIsFound == false){
                  csvdata_transaction.push({"transaction_id" : csvdata_transaction.length, "transaction_portfolio_id" : param1, "transaction_saver_id" : param2, "fund_id_bought" : param3, "units_bought" : param4, "fund_id_sold" : param5, "units_sold" : param6, "date_value_transaction" : param7});
                  break;
                }
              }
            }

            var csvStream = csv.createWriteStream({headers: false}),
            writableStream = fs.createWriteStream(__dirname + "/app/testdb/transaction.csv");

            writableStream.on("finish", function(){
              res.json("done");
            });

            csvStream.pipe(writableStream);      
            for (var i = 0; i < csvdata_transaction.length; i ++){
              csvStream.write({"transaction_id" : csvdata_transaction[i].transaction_id, "transaction_portfolio_id" : csvdata_transaction[i].transaction_portfolio_id, "transaction_saver_id" : csvdata_transaction[i].transaction_saver_id, "fund_id_bought" : csvdata_transaction[i].fund_id_bought, "units_bought" : csvdata_transaction[i].units_bought, "fund_id_sold" : csvdata_transaction[i].fund_id_sold, "units_sold" : csvdata_transaction[i].units_sold, "date_value_transaction" : csvdata_transaction[i].date_value_transaction});
            }
            csvStream.end();
          });
      });
 });


http.createServer(app).listen(app.get('port'), function(){
console.log("Express server listening on port " + app.get('port'));
  });       

}).call(this);
