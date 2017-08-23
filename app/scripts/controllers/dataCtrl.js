(function () {
  'use strict';

  angular.module('orzaApp.controllers', ['ngCookies', 'ngMaterial', 'ngRoute'])
    .controller('dataCtrl', ['$scope', '$rootScope','$http', '$timeout', '$filter', '$cookieStore', '$mdDialog', '$location',
    function($scope, $rootScope, $http, $timeout, $filter, $cookieStore, $mdDialog, $location) {
    // module retrieves data and names from MySQL request, calculates statistics for all funds, creates buy, sell and portfolio
    // review if we can move to other controllers buy, sell, load and save functions
    
    // Start date
    var f_startDate = '2013-01-01 00:00:00';

    /////////////////////////////////////////////////////////////////////
    ///////////////        Lists of Database Tables      ////////////////
    /////////////////////////////////////////////////////////////////////
    // array of price_fund
    $rootScope.listOfPriceFund = [];
    // array of all transactions of the database
    $rootScope.listOfTransaction = [];
    // array for all portfolio list of the database
    $rootScope.listOfPortfolio = [];
    // array for other portfolio list of the database
    $rootScope.listofOtherPortfolio = [];
    /////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////


    /////////////////////////////////////////////////////////////////////
    /////////////        Lists of fund data for Graph      //////////////
    /////////////////////////////////////////////////////////////////////
    // array for 3rd graph data including -new999Price
    $rootScope.arrNew999Price = [];
    // array for 3rd graph data which isn't including new999Price
    $rootScope.arrStaircase = [];    
    // array of purchase info for each fund
    // 0,0,3,0,0,0,2,0,0,-5,0,... (3 bought, 2 bought, 5 sold)
    $rootScope.arrPurchase = [];
    // array for running total of units bought for each fund 
    // 0,0,3,3,3,3,5,5,5,0,0,... (3 bought, 2 bought, 5 sold)
    $rootScope.arrItemCount = [];
    // array for start return value
    $rootScope.arrStartReturn = [];
    /////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////


    /////////////////////////////////////////////////////////////////////
    /////////////       Lists of Statics Information       //////////////
    /////////////////////////////////////////////////////////////////////
    $rootScope.dayRetData = [];
    $rootScope.dayRetData.day1_return = [];
    $rootScope.dayRetData.day1_loss = [];
    $rootScope.dayRetData.day7_loss = [];
    $rootScope.dayRetData.day91_return = [];
    $rootScope.dayRetData.day182_return = [];
    $rootScope.dayRetData.day365_return = [];
    $rootScope.dayRetData.year_return = [];
    $rootScope.dayRetData.start_return = [];
    /////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////

    // Re-draw graph if the value is "draw"
    $rootScope.strDrawStart = "none";
    // logged user name
    $rootScope.loggedUser = ($rootScope.loginUser != undefined) ? $rootScope.loginUser[0].user_name_saver : "";
    
    // array of fund ids
    // var f_index = [40,48,51,54,59,80,88,104,105,106,126,149,176,179,190];
    var f_index = [3, 5, 6, 7, 8, 9, 60, 103, 113];

    //  arrays of fund names, i.e., for fund 40 it's n[40][0].alias
    var n = []; n.push([]);
    $http.get('/ret1').success(function (fundnames) {
        for (var i = 0; i < fundnames.length; i ++){
            fundnames[i].fund_id_alias_fund = fundnames[i].fund_id_alias_fund * 1;
        }

        for (var i=0; i<f_index.length; i++){
            n[f_index[i]] = $filter('filter')(fundnames, function (d) { return d.fund_id_alias_fund === f_index[i]; });
        };

        // arrays of funds and their calculations
        $http.get('/ret/' + f_startDate).success(function (rows) {
            // console.log(rows);
            for (var i = 0; i < rows.length; i ++){
                rows[i].fund_id_pr_fund = rows[i].fund_id_pr_fund * 1;
                rows[i].pr_fund = rows[i].pr_fund * 1;
            }

            var f = [];
            // loop to create fund-filtered arrays
            for (var i=0; i<f_index.length; i++){
                f[f_index[i]] = $filter('filter')(rows, function (d) { return d.fund_id_pr_fund === f_index[i]; });
            }
            // creating arrays for each calculation
            // units, 1dreturn, 1dloss, 7dloss, 91dreturn, 182dreturn, 365dreturn, startyearreturn, startfundreturnindividualdates, startfundreturnequaldate

            var arru =[];
            var arrudate =[];
            var u=0; var dt=0;
            
            // nested loop to create array of funds and fund calculations
            for (var j=0; j<f_index.length; j++){
                arru.push([]);
                arrudate.push([]);
                for (var i = 0; i < f[f_index[j]].length; i++) {
                    u = f[f_index[j]][i].pr_fund;
                    dt = new Date(f[f_index[j]][i].date_value_pr_fund.replace(/-/g, '\/'));
                    arru[j].push(u);
                    arrudate[j].push(dt);
                }
            }

            // filling listOfPriceFund array with each fund
            var maxDate = new Date('2000-01-01');
            for (var i = 0; i < f_index.length; i ++){
                var item = {'name' : '', 'u' : '', 'udate':'', 'ulen' : '', 'index' : 0, 'dict' : []};
                item.name = n[f_index[i]][0].alias;              
                item.u = arru[i];
                item.udate = arrudate[i];
                item.ulen = item.u.length;
                item.index = f_index[i];
                if ((n[f_index[i]][0].alias_match_1 != null) && (n[f_index[i]][0].alias_match_1 != "")) item.dict.push(n[f_index[i]][0].alias_match_1);
                if ((n[f_index[i]][0].alias_match_2 != null) && (n[f_index[i]][0].alias_match_2 != "")) item.dict.push(n[f_index[i]][0].alias_match_2);
                if ((n[f_index[i]][0].alias_match_3 != null) && (n[f_index[i]][0].alias_match_3 != "")) item.dict.push(n[f_index[i]][0].alias_match_3);
                $rootScope.listOfPriceFund[i] = item;

                // get last date of the array
                var tmpDate = new Date($rootScope.listOfPriceFund[i].udate[$rootScope.listOfPriceFund[i].udate.length - 1]);
                if (tmpDate - maxDate > 0) maxDate = tmpDate;
            }

            // Create longest date array
            var maxArray = [];
            var firstDate = new Date(f_startDate.replace(/-/g, '\/'));
            for (var i = 0; i < 99999; i ++){
                if (firstDate > maxDate) break;
                maxArray[i] = angular.copy(firstDate);
                firstDate.setDate(firstDate.getDate() + 1);
            }

            for (var i = 0; i < f_index.length; i ++){
                var dataArr = [];
                var orgDataIndex = 0;
                for (var j = 0; j < maxArray.length; j ++){
                    var orgDate = new Date(maxArray[j]);
                    var curDate = new Date($rootScope.listOfPriceFund[i].udate[orgDataIndex]);
                    if ($rootScope.isSameDate(orgDate, curDate) == true){
                        dataArr[j] = $rootScope.listOfPriceFund[i].u[orgDataIndex];
                        orgDataIndex ++;
                    }else{
                        dataArr[j] = 0;
                    }                    
                }
                $rootScope.listOfPriceFund[i].udate = angular.copy(maxArray);
                $rootScope.listOfPriceFund[i].ulen = maxArray.length;
                $rootScope.listOfPriceFund[i].u = dataArr;
            }
            
            // calculate gain or less
            var arr1dr = []; var arr1dl = []; var arr7dl = []; var arr91dr = []; var arr182dr = []; var arr365dr = []; var arryr = []; var arrisr = [];var arresr = [];
            var arr1drdate = []; var arr1dldate = []; var arr7dldate = []; var arr91drdate = []; var arr182drdate = []; var arr365drdate = []; var arryrdate = []; var arrisrdate = [];var arresrdate = [];
            var arrStartValue = [];
            for (var i = 0; i < f_index.length; i ++) arrStartValue[i] = 0;
            for (var i = 0; i < f_index.length; i ++){                        
                arr1drdate[i] = (maxArray);
                arr1dldate[i] = (maxArray);
                arr7dldate[i] = (maxArray);
                arr91drdate[i] = (maxArray);
                arr182drdate[i] = (maxArray);
                arr365drdate[i] = (maxArray);
                arryrdate[i] = (maxArray);
                arrisrdate[i] = (maxArray);
                arresrdate[i] = (maxArray);
                arr1dr[i] = []; arr1dl[i] = []; arr7dl[i] = []; arr91dr[i] = []; arr182dr[i] = []; arr365dr[i] = []; arryr[i] = []; arrisr[i] = []; arresr[i] = [];
                var day1_return=0; var day1_loss=0; var day7_loss=0; var day91_return=0; var day182_return=0; var day365_return=0; var year_return=0; var start_return=0;
                for (var j = 0; j < $rootScope.listOfPriceFund[i].u.length; j ++){
                    if (arrStartValue[i] == 0){
                        if ($rootScope.listOfPriceFund[i].u[j] != 0) arrStartValue[i] = $rootScope.listOfPriceFund[i].u[j];
                    }
                    var curVal = $rootScope.listOfPriceFund[i].u[j];
                    if (j == 0) { day1_return = 0 } else { day1_return = ($rootScope.listOfPriceFund[i].u[j-1] == 0) ? 0 : (curVal / $rootScope.listOfPriceFund[i].u[j-1]) - 1 };
                    if (j == 0) { day1_loss = 0 } else { day1_loss = ($rootScope.listOfPriceFund[i].u[j-1] == 0) ? 0 : Math.min((curVal / $rootScope.listOfPriceFund[i].u[j-1]) - 1, 0) };
                    if (j < 7) { day7_loss = 0 } else { day7_loss = ($rootScope.listOfPriceFund[i].u[j-7] == 0) ? 0 : Math.min((curVal / $rootScope.listOfPriceFund[i].u[j-7]) - 1,0) };
                    if (j < 91) { day91_return = 0 } else { day91_return = ($rootScope.listOfPriceFund[i].u[j-91] == 0) ? 0 : (curVal / $rootScope.listOfPriceFund[i].u[j-91]) - 1 };
                    if (j < 182) { day182_return = 0 } else { day182_return = ($rootScope.listOfPriceFund[i].u[j-182] == 0) ? 0 : (curVal / $rootScope.listOfPriceFund[i].u[j-182]) - 1 };
                    if (j < 365) { day365_return = 0 } else { day365_return = ($rootScope.listOfPriceFund[i].u[j-365] == 0) ? 0 : (curVal / $rootScope.listOfPriceFund[i].u[j-365]) - 1 };
                    if (j == 0) { year_return = 0 } else { year_return = (arrStartValue[i] == 0) ? 0 : (curVal / arrStartValue[i]) - 1 };
                    if (j == 0) { start_return = (arrStartValue[i] != 0) ? 0 : -1 } else { start_return = (arrStartValue[i] == 0) ? -1 : (curVal / arrStartValue[i]) - 1 };

                    arr1dr[i][j] = (day1_return);
                    arr1dl[i][j] = (day1_loss);
                    arr7dl[i][j] = (day7_loss);
                    arr91dr[i][j] = (day91_return);
                    arr182dr[i][j] = (day182_return);
                    arr365dr[i][j] = (day365_return);
                    arryr[i][j] = (year_return);
                    arrisr[i][j] = (start_return + 1);
                    arresr[i][j] = (start_return);
                }
            }
            // fill day return arrays
            $rootScope.dayRetData.day1_return = arr1dr;
            $rootScope.dayRetData.day1_loss = arr1dl;
            $rootScope.dayRetData.day7_loss = arr7dl;
            $rootScope.dayRetData.day91_return = arr91dr;
            $rootScope.dayRetData.day182_return = arr182dr;
            $rootScope.dayRetData.day365_return = arr365dr;
            $rootScope.dayRetData.year_return = arryr;
            $rootScope.dayRetData.start_return = arrisr;

            // $rootScope.listOfPriceFund.splice(4, 1); // Remove f59 data
            $rootScope.m_nSelIndex = 0; // Current selected index        


            $rootScope.username = ""; //portfolio name
            $rootScope.curDate = new Date();

            $rootScope.mainGraphDate = maxArray; // Date for Portfolio Graph
            
            // filling $rootScope.arr with individual fund data for each graph
            for (var i = 0; i < $rootScope.listOfPriceFund.length; i ++){
                var arr_Tmp = [];
                for (var j = 0; j < $rootScope.listOfPriceFund[i].u.length; j ++){
                    arr_Tmp[j] = 0;
                }            
                $rootScope.arrNew999Price[i] = angular.copy(arr_Tmp);
                $rootScope.arrStaircase[i] = angular.copy(arr_Tmp);
                $rootScope.arrPurchase[i] = angular.copy(arr_Tmp);
                $rootScope.arrItemCount[i] = angular.copy(arr_Tmp);
                $rootScope.arrStartReturn[i] = angular.copy(arr_Tmp);
            }

            var loadedCookie = $cookieStore.get('Orza');
            if (loadedCookie != undefined) $rootScope.username = loadedCookie.username;

            $rootScope.isRecRet = true; // 0 or 1 flag value which express get data from server index.html

            $rootScope.getFundResult();
            $rootScope.getTransactionData();
        });
    });

    $http.get('/userInfo').success(function (portnames){
        $rootScope.listOfPortfolio = portnames;
    });

    $rootScope.getFundResult = function(){
        var tmpArr = [];
        for (var i = 0; i < $rootScope.dayRetData.start_return.length; i ++){
            tmpArr[i] = [];
            var cnt = 0;
            for (var j = 0; j < $rootScope.dayRetData.start_return[i].length; j ++){
                tmpArr[i][j] = cnt;
                if ($rootScope.dayRetData.start_return[i][j] != 0) cnt++

                if ($rootScope.dayRetData.start_return[i][j] == 0){
                    $rootScope.arrStartReturn[i][j] = 0;
                }else{
                    if (tmpArr[i][j] < 366){
                        $rootScope.arrStartReturn[i][j] = $rootScope.dayRetData.start_return[i][j] - 1;
                    }else{
                        $rootScope.arrStartReturn[i][j] = Math.pow($rootScope.dayRetData.start_return[i][j], (365.25 / tmpArr[i][j])) - 1;
                    }
                }

                $rootScope.arrStartReturn[i][j] = ($rootScope.arrStartReturn[i][j] * 100).toFixed(2);
                if ($rootScope.arrStartReturn[i][j] == "-0.00") $rootScope.arrStartReturn[i][j] = "0.00";
            }
        }
    }

    $rootScope.getTransactionData = function(){
        $http.get('/transaction/all').success(function (response) {
            for (var i = 0; i < response.length; i ++){
                response[i].fund_id_bought = response[i].fund_id_bought * 1;
                response[i].fund_id_sold = response[i].fund_id_sold * 1;
                response[i].transaction_id = response[i].transaction_id * 1;
                response[i].units_bought = response[i].units_bought * 1;
            }
            $rootScope.listOfTransaction = [];
            for (var i = 0; i < response.length; i ++){
                var transDate = new Date(response[i].date_value_transaction.replace(/-/g, '\/'));
                var startDate = new Date(f_startDate);

                if (startDate - transDate > 0) continue;

                var tempArr = {'strPortID' : '', 'tDate' : new Date(), 'strFundName' : '', 'strBoS' : '', 'nItemCnt' : 0, 'fItemValue' : 0, 'fTotal' : 0, 'id' : '', 'strSaverID':'', 'nFundIndex' : -1, 'str_nItemCnt' : '0', 'str_fItemValue' : '0', 'str_fTotal' : '0'}; 
                var transactionID = response[i].transaction_id;
                var strFundName = "";
                var nFundIndex = -1;
                for (var j = 0; j < f_index.length; j ++){
                    var fundID = (response[i].fund_id_bought == 999) ? response[i].fund_id_sold : response[i].fund_id_bought;
                    if (f_index[j] == fundID){
                        strFundName = $rootScope.listOfPriceFund[j].name;
                        nFundIndex = j;
                        break;
                    }
                }
                tempArr.id = transactionID;
                tempArr.strSaverID = response[i].transaction_saver_id;
                tempArr.strPortID = response[i].transaction_portfolio_id;
                tempArr.strFundName = strFundName;
                tempArr.nFundIndex = nFundIndex;
                tempArr.tDate = $rootScope.convertDate(response[i].date_value_transaction.replace(/-/g, '\/'));
                tempArr.strBoS = (response[i].fund_id_bought == 999) ? "Venta" : "Compra";
                tempArr.nItemCnt = response[i].units_bought;
                tempArr.fItemValue = (response[i].units_sold / response[i].units_bought).toFixed(6);
                tempArr.fTotal = response[i].units_sold;
                tempArr.str_nItemCnt = $rootScope.numberWithCommas(tempArr.nItemCnt);
                tempArr.str_fItemValue = $rootScope.numberWithCommas(tempArr.fItemValue);
                tempArr.str_fTotal = $rootScope.numberWithCommas(parseFloat(tempArr.fTotal).toFixed(2));
                $rootScope.listOfTransaction.push(tempArr);
            }

            $rootScope.listofOtherPortfolio = [];
            for (var i = 0; i < $rootScope.listOfPortfolio.length; i ++){
                // if ($rootScope.listOfPortfolio[i].portfolio_id != "accionescolombia") continue;
                $rootScope.onChangeUserList($rootScope.listOfPortfolio[i].portfolio_id);
            }
        });
    }
    $rootScope.onChangeUserList = function(value){
        var response = [];
        for (var i = 0; i < $rootScope.listOfTransaction.length; i ++){
            if ($rootScope.listOfTransaction[i].strPortID == value) response.push(angular.copy($rootScope.listOfTransaction[i]));
        }

        if (response.length == 0) return;
        // init array
        var arrOtherNew999Price = [];
        var arrOtherStaircase = [];
        var arrOtherWeight = [];
        var arrOtherIndex = [];

        for (var i = 0; i < $rootScope.listOfPriceFund.length; i ++){
            var arr_Tmp = [];
            for (var j = 0; j < $rootScope.listOfPriceFund[i].u.length; j ++){
                arr_Tmp[j] = 0;
            }            
            arrOtherNew999Price[i] = angular.copy(arr_Tmp);
            arrOtherStaircase[i] = angular.copy(arr_Tmp);
            arrOtherWeight[i] = angular.copy(arr_Tmp);
            arrOtherIndex[i] = angular.copy(arr_Tmp);
        }   

        // sorting by date_value_transactio field of the database
        response.sort(function(a, b){
            var keyA = new Date(a.tDate),
                keyB = new Date(b.tDate);
            // Compare the 2 dates
            if(keyA < keyB) return -1;
            if(keyA > keyB) return 1;
            return 0;
        });
        
        // calculate data and store into arrOtherNew999Price
        for (var i = 0; i < response.length; i ++){
            if (response[i].strBoS == "Venta"){
                response[i].nItemCnt = -response[i].nItemCnt;
            }

            var fundIndex = response[i].nFundIndex;
            var transactionDate = new Date(response[i].tDate.replace(/-/g, '\/'));
            var dateIndex = -1;
            for (var j = 0; j < $rootScope.mainGraphDate.length; j ++){
                var curDate = new Date($rootScope.mainGraphDate[j]);
                if ($rootScope.isSameDate(curDate, transactionDate) == true){
                    dateIndex = j;
                    break;
                }
            }
            arrOtherNew999Price[fundIndex][dateIndex] = response[i].nItemCnt;
            // console.log("index = " + fundIndex);
            // console.log("date index = " + dateIndex);
            // console.log(response[i]);
        }

        for (var i = 0; i < arrOtherNew999Price.length; i ++){
            var temp = 0;
            var new999Price = 0;
            for (var j = 0; j < arrOtherNew999Price[i].length; j ++){
                if (arrOtherNew999Price[i][j] != 0){
                    temp = temp + arrOtherNew999Price[i][j];
                    new999Price = new999Price + $rootScope.listOfPriceFund[i].u[j] * arrOtherNew999Price[i][j];                        
                }
                arrOtherNew999Price[i][j] = temp * $rootScope.listOfPriceFund[i].u[j] - new999Price;
                arrOtherStaircase[i][j] = temp * $rootScope.listOfPriceFund[i].u[j];
            }
        }

        var newArr = [];
        var newStairSum = [];
        for (var i = 0; i < $rootScope.listOfPriceFund[0].ulen; i++){
            var sum = 0;
            var sum1 = 0;
            for (var j = 0; j < $rootScope.listOfPriceFund.length; j ++){
                sum = sum + arrOtherNew999Price[j][i];
                sum1 = sum1 + arrOtherStaircase[j][i];
            }
            newArr.push(sum);
            newStairSum.push(sum1);
        }

        // calculate weight
        for (var i = 0; i < $rootScope.listOfPriceFund[0].ulen; i ++){
            for (var j = 0; j < $rootScope.listOfPriceFund.length; j ++){
                arrOtherWeight[j][i] = (arrOtherStaircase[j][i] == 0) ? 0 : arrOtherStaircase[j][i] / newStairSum[i];
                arrOtherWeight[j][i] = arrOtherWeight[j][i];
            }
        }

        // calculate each index
        for (var i = 0; i < $rootScope.listOfPriceFund.length; i ++){
            for (var j = 0; j < $rootScope.listOfPriceFund[i].ulen; j ++){
                if (j > 0){
                    if ((arrOtherStaircase[i][j-1] == 0) && (arrOtherStaircase[i][j] == 0)){
                        arrOtherIndex[i][j] = 0
                    }else{
                        if ((arrOtherStaircase[i][j-1] == 0) && (arrOtherStaircase[i][j] != 0)){
                            arrOtherIndex[i][j] = 1
                        }else{
                            arrOtherIndex[i][j] = $rootScope.listOfPriceFund[i].u[j] / $rootScope.listOfPriceFund[i].u[j-1];
                        }
                    }
                }else{
                    arrOtherIndex[i][j] = (arrOtherStaircase[i][j] != 0) ? 1 : 0;
                }
            }
        }

        // calculate index total
        var indexArray = [];
        var indexTmpArray = [];
        for (var i = 0; i < $rootScope.listOfPriceFund[0].ulen; i++){
            var sum = 0;

            if (i > 0){
                if ((newStairSum[i] == 0) && (newStairSum[i-1] == 0)){
                    sum = 0;
                }else{
                    if ((newStairSum[i] != 0) && (newStairSum[i-1] == 0)){
                        sum = 1;
                    }else{
                        for (var j = 0; j < $rootScope.listOfPriceFund.length; j ++){
                            // console.log("p1 : " + arrOtherIndex[j][i] + " p2 : " + arrOtherWeight[j][i-1] + " p3 : " + indexTmpArray[indexTmpArray.length - 1]);
                            sum = sum + arrOtherIndex[j][i] * arrOtherWeight[j][i-1] * indexTmpArray[indexTmpArray.length - 1];
                        }
                    }
                }
            }else{
                sum = (newStairSum[i] == 0) ? 0 : 1;
            }
            indexTmpArray.push(sum);
            indexArray.push(sum);
        }

        // console.log(indexArray);
        // console.log(arrOtherWeight);

        // calculate days from total
        var daysArray = [];
        var incDepth = 0;
        for (var i = 0; i < indexArray.length; i ++){
            daysArray[i] = (i > 0) ? daysArray[i - 1] + incDepth : 0;
            if ((incDepth == 0) && (indexArray[i] == 1)) incDepth = 1;            
        }

        // calculate yearly rate
        var yearRateArray = [];
        for (var i = 0; i < indexArray.length; i ++){
            if (i == 0) yearRateArray[i] = 0;
            else{
                if (indexArray[i - 1] == 0) yearRateArray[i] = 0;
                else{
                    if (daysArray[i] < 365) yearRateArray[i] = indexArray[i] - 1;
                    else{
                        yearRateArray[i] = Math.pow(indexArray[i], (365.25 / daysArray[i])) - 1;
                    }
                }
            }
            yearRateArray[i] = (yearRateArray[i] * 100).toFixed(2);
            if (yearRateArray[i] == "-0.00") yearRateArray[i] = "0.00";
        }

        // console.log(arrOtherStaircase);
        // console.log(indexArray);
        // console.log(arrOtherWeight);
        // console.log(arrOtherIndex);

        // for (var i = 0; i < indexArray.length; i ++){
        //     console.log((i+3) + " : " + arrOtherIndex[3][i] + " : " + arrOtherIndex[4][i] + " : " + arrOtherIndex[5][i] + " : " + arrOtherIndex[9][i] + " :: " + indexArray[i]);
        //     console.log((i+3) + " : " + arrOtherWeight[3][i] + " : " + arrOtherWeight[4][i] + " : " + arrOtherWeight[5][i] + " : " + arrOtherWeight[9][i]);
        // }

        // calculate 91DayReturn and min7DayLoss for portfolio array
        var day91Arr = [];
        var day7LossArr = [];
        for (var i = 0; i < indexArray.length; i ++){
          if (i < 7) { day7LossArr[i] = 0 } else { day7LossArr[i] = (indexArray[i-7] == 0) ? 0 : Math.min((indexArray[i] / indexArray[i-7]) - 1,0);};
          if (i < 91) { day91Arr[i] = 0 } else { day91Arr[i] = (indexArray[i-91] == 0) ? 0 : (indexArray[i] / indexArray[i-91]) - 1 };
        }

        var objOther = {"portname" : "", "new999Price" : [], "staircase" : [], "portArray" : [], "weightArray" : [], "day91Array" : [], "day7Array" : [], "yearRateArray" : [], "showhide" : 1};
        objOther.portname = value;
        objOther.new999Price = arrOtherNew999Price;
        objOther.staircase = arrOtherStaircase;
        objOther.portArray = indexArray;
        objOther.weightArray = arrOtherWeight;
        objOther.day91Array = day91Arr;
        objOther.day7Array = day7LossArr;
        objOther.yearRateArray = yearRateArray;

        $rootScope.listofOtherPortfolio.push(objOther);
    };
    $rootScope.isSameDate = function(a, b){
        if (a.getFullYear() == b.getFullYear()){
            if (a.getMonth() == b.getMonth()){
                if (a.getDate() == b.getDate()){     
                    return true;
                }
            }
        }
        return false;
    }
    $rootScope.numberWithCommas = function(x) {
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }
    $rootScope.convertDate = function(paramDate){
        var date = new Date(paramDate);   
        var month = (date.getMonth()+1 < 10) ? '0'+(date.getMonth()+1) : (date.getMonth()+1);
        var day = (date.getDate()<10) ? '0'+date.getDate() : date.getDate();
        var strDate = date.getFullYear() + '-' + month + '-' + day;
        return strDate;
    }
    function decimalPlaces(num) {
        var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
        if (!match) { return 0; }
        return Math.max(
            0,
            // Number of digits right of decimal point.
            (match[1] ? match[1].length : 0)
            // Adjust for scientific notation.
            - (match[2] ? +match[2] : 0));
    }
    $rootScope.multiple = function(param1, param2){
        var len1 = decimalPlaces(param1);
        var len2 = decimalPlaces(param2);
        var len = (len1 >= len2) ? len1 : len2;
        var maxVal = Math.pow(10, len);
        var value1 = Math.round(param1 * maxVal);
        var value2 = Math.round(param2 * maxVal);
        return value1 * value2 / (maxVal * maxVal);
    }
    $rootScope.roundDown = function(number, decimals){
        decimals = decimals || 0;
        return ( Math.floor( number * Math.pow(10, decimals) ) / Math.pow(10, decimals) );
    }
  }]);
}());


