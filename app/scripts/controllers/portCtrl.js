(function () {
  'use strict';

  angular.module('orzaApp.controllers')
    .controller('portCtrl', ['$scope', '$rootScope', '$interval', '$http', '$mdDialog', '$cookieStore',function($scope, $rootScope, $interval, $http, $mdDialog, $cookieStore){
      // creating original arrays for each of 15 funds [40,48,51,54,59,80,88,104,105,106,126,149,176,179,190] and calculation
      // initializing the model on number of units, except for fund 59
      // replaced static title with array from dataCtrl, corrected error on fund 59
      $scope.listMessage = [
        "",
        "No hay más unidades para vender",
        ""];
      $scope.arr = {};
      $scope.arr.ngSecondGraphTitle = $rootScope.listOfPriceFund[0].name;
      $scope.arr.ngSecondGraphModel = 0;
      $scope.arr.ngSecondGraphMount = 0;

      // values for 4 statics on portfolio graph
      $scope.ngScopePortArray = [];
      $scope.ngScopeRateArray = [];
      $scope.ngScopeVoP = 0;
      $scope.ngScopeGoL = 0;
      $scope.ngScopeMax = 0;
      $scope.ngScopeMin = 0;
      $scope.ngScopeRate = 0;

      // values for icon information on table header
      $scope.arr.tbHeader = [        
        {index : 0, title : 'portafolio', icon : '', flex : 15},
        {index : 1, title : 'fecha', icon : '', flex : 15},
        {index : 2, title : 'fondo', icon : '', flex : 15},
        {index : 3, title : 'compra o venta', icon : '', flex : 15},
        {index : 4, title : 'unidades', icon : '', flex : 15},
        {index : 5, title : 'precio unidad', icon : '', flex : 15},
        {index : 6, title : 'total pesos', icon : '', flex : 15},
      ];

      // flex value for table info
      $scope.arr.isExpand = "+";
      $scope.arr.flex1 = 15;
      $scope.arr.flex2 = 15;
      $scope.arr.flex3 = 15;
      $scope.arr.flex4 = 15;
      $scope.arr.flex5 = 15;
      $scope.arr.flex6 = 15;
      $scope.arr.flex7 = 15;
      $scope.arr.flex8 = 5;
      $scope.arr.styleFlex1;
      $scope.arr.styleFlex2;
      $scope.arr.styleFlex3;
      $scope.arr.styleFlex4;
      $scope.arr.styleFlex5;
      $scope.arr.styleFlex6;
      $scope.arr.styleFlex7;
      $scope.arr.styleExpand;
      $scope.arr.styleExpand1;
      $scope.arr.styleExpand2;
      $scope.arr.styleExpand3;
      $scope.arr.styleExpand4;
      $scope.arr.styleExpand5;
      
      
      // values for 5 statics on second graph
      $scope.ngScopeDay91 = 0;
      $scope.ngScopeDay182 = 0;
      $scope.ngScopeDay365 = 0;
      $scope.ngScopeYear = 0;
      $scope.ngScopeDay7 = 0;

      // values for 3 statics on third graph
      $scope.ngScopeTranPrice = 0;
      $scope.ngScopeUnidades = 0;

      // Excel variables
      $scope.arr.ngScopeUploadVisible = false;
      $scope.arr.ngScopeFilePath;

      ///////////////////////////////////////////
      $scope.arr.username = $rootScope.username;
      $scope.arr.sliderDisable = false;
      $scope.arr.selectedFunds = "";
      $scope.arr.errModel = "";
      $rootScope.m_nSelIndex = 0;

      // Resize slider width same as graph width
      $scope.arr.SliderStyle = (window.innerWidth - 180) +'px';

      window.addEventListener('resize', function() {                
        document.getElementById("date-slider").style.width = (window.innerWidth - 180) +'px';
        $scope.resetTable();
      });

      // Expand row of transaction table
      $scope.onExpand = function(index){
        var strText = document.getElementById("md-expand-column"+index).innerText;
        if (strText.indexOf("+") > -1){
          document.getElementById("md-expand-column"+index).innerText = strText.replace("+", "-");
          document.getElementById("md-expand-table"+index).style.display = "block";
        }else if(strText.indexOf("-") > -1){
          document.getElementById("md-expand-column"+index).innerText = strText.replace("-", "+");
          document.getElementById("md-expand-table"+index).style.display = "none";
        } 
      }

      // creating the first array of portfolio to be rendered
      $scope.unitChanged = function() {
        if (!isNaN($scope.arr.ngSecondGraphModel)){
          $scope.checkSellCount(); // if user have 5 items and he is going to sell 8, in this case, the value -8 will be changed into -5
          $scope.drawSecondGraph($rootScope.m_nSelIndex, $scope.arr.ngSecondGraphModel, $rootScope.sliderIndex); // Draw every element graph
          $scope.updateSlider(); // What does this do?
          $scope.drawFirstGraph(); // Draw portfolio graph
          $scope.disableSlider(); //Disable Slider
          $rootScope.strDrawStart = "draw";

          // reset Amount Price
          $scope.arr.ngSecondGraphMount = $rootScope.roundDown($rootScope.arrStaircase[$rootScope.m_nSelIndex][$rootScope.sliderIndex], 6);
        }
      };

      // creating the first array of portfolio to be rendered by amount price
      $scope.unitChangedMount = function(){
        if (!isNaN($scope.arr.ngSecondGraphMount)){
          $scope.arr.ngSecondGraphModel = $rootScope.roundDown($scope.arr.ngSecondGraphMount / $rootScope.listOfPriceFund[$rootScope.m_nSelIndex].u[$rootScope.sliderIndex], 6);
          if (!isNaN($scope.arr.ngSecondGraphModel)){
            $scope.checkSellCount(); // if user have 5 items and he is going to sell 8, in this case, the value -8 will be changed into -5
            $scope.drawSecondGraph($rootScope.m_nSelIndex, $scope.arr.ngSecondGraphModel, $rootScope.sliderIndex); // Draw every element graph
            $scope.updateSlider(); // What does this do?
            $scope.drawFirstGraph(); // Draw portfolio graph
            $scope.disableSlider(); //Disable Slider
            $rootScope.strDrawStart = "draw";
          }
        }
      }

      // disable slider control
      $scope.disableSlider = function(){
        if ($scope.arr.ngSecondGraphModel == $rootScope.arrPurchase[$rootScope.m_nSelIndex][$rootScope.sliderIndex]){
          $scope.arr.sliderDisable = false;
        }else{
          $scope.arr.sliderDisable = true;
        }
      }

      // move slider by key down
      $rootScope.onKeyDown = function(e){
        if ($rootScope.isRecRet == true){
          if ($scope.arr.sliderDisable == true){
            if (e.key == "ArrowLeft"){
              $scope.arr.slider = ($scope.arr.slider > 0) ? $scope.arr.slider-1 : 0;
            }else if(e.key == "ArrowRight"){
              $scope.arr.slider = ($scope.arr.slider < $rootScope.listOfPriceFund[0].ulen-1) ? $scope.arr.slider+1 : $scope.arr.slider;
            }
          }
        }
      }

      // This fuction is for check exception about transaction
      // example, 5 bought so unable to sell more than 5.
      // example, 5 bought on 2016/04/04 , 5 sold on 2016/07/08, in this case, user isn't able to sell any items on 2016/06/06
      // user cannot make unit count go negative in any future date
      $scope.checkSellCount = function(){
        $scope.errorMessage(0);
        var nCurIndex = $rootScope.sliderIndex;
        var nOptIndex = $rootScope.m_nSelIndex;

        var nSliderIndex = $rootScope.sliderIndex;
        var arrPurchaseTmp = angular.copy($rootScope.arrPurchase[nOptIndex]);          
        if (nSliderIndex > -1){
          arrPurchaseTmp[nSliderIndex] = $scope.arr.ngSecondGraphModel;
        }
        var total = 0; var bIsAvailable = true; var maxMin = 0;
        for (var i = 0; i < $rootScope.listOfPriceFund[nOptIndex].ulen; i ++){
          total = total + arrPurchaseTmp[i];
          if (total < 0){
            if (maxMin > total) maxMin = total;
            bIsAvailable = false;
          }
        }

        if (bIsAvailable == false){
          $scope.arr.ngSecondGraphModel -= maxMin;
          $scope.errorMessage(1);
        }

        // Update unidades and pesos
        $scope.ngScopeUnidades = total;
      }

      // Error Messages : example - No more items
      $scope.errorMessage = function(index){
        $scope.arr.errModel = $scope.listMessage[index];
      }

      // calculate value of portfolio (units*price) for each date and fill temporary array
      $scope.drawFirstGraph = function (){
        var newArr1 = [];
        var newArr2 = [];
        for (var i = 0; i < $rootScope.listOfPriceFund[0].ulen; i++) {
          var sum1 = 0;
          var sum2 = 0;
          for (var j = 0; j < $rootScope.listOfPriceFund.length; j ++){
            sum1 = sum1 + $rootScope.arrNew999Price[j][i];
            sum2 = sum2 + $rootScope.arrStaircase[j][i];
          }
          newArr1.push(sum1);
          newArr2.push(sum2);
        }
        // rootscope the portfolio array
        $rootScope.portfolio = newArr1;
        $scope.ngScopePortArray = newArr2;

        // calculate 91DayReturn and min7DayLoss for portfolio array
        var day91Arr = [];
        var day7LossArr = [];
        for (var i = 0; i < $rootScope.portfolio.length; i ++){
          if (i < 7) { day7LossArr[i] = 0 } else { day7LossArr[i] = ($rootScope.portfolio[i-7] == 0) ? 0 : Math.min(($rootScope.portfolio[i] / $rootScope.portfolio[i-7]) - 1,0) };
          if (i < 91) { day91Arr[i] = 0 } else { day91Arr[i] = ($rootScope.portfolio[i-91] == 0) ? 0 : ($rootScope.portfolio[i] / $rootScope.portfolio[i-91]) - 1 };
          $scope.ngScopeRateArray[i] = 0;
        }
        $rootScope.portDay91Return = day91Arr;
        $rootScope.portDay7Loss = day7LossArr;

        // get year Rate array from all of the transaction information
        for (var i = 0; i < $rootScope.listofOtherPortfolio.length; i ++){          
          if ($rootScope.listofOtherPortfolio[i].portname == $scope.arr.username){
            $scope.ngScopeRateArray = angular.copy($rootScope.listofOtherPortfolio[i].yearRateArray);
            // console.log($scope.arr.username + ":" + $rootScope.listofOtherPortfolio[i].portname);
            // console.log($rootScope.listofOtherPortfolio);
            break;
          }
        }

        // Update unidades and pesos
        $scope.ngScopeTranPrice = $rootScope.arrStaircase[$rootScope.m_nSelIndex][$rootScope.sliderIndex];        
        $scope.ngScopeTranPrice = ($scope.ngScopeTranPrice == undefined) ? $scope.ngScopeTranPrice : $rootScope.numberWithCommas($scope.ngScopeTranPrice.toFixed(2));        
      };
      $scope.drawSecondGraph = function(fundindex, count, nSliderIndex){
        var n_curSelected = fundindex;
        // Update graph data for every funds' graph
        if (n_curSelected > -1){
          var arrPurchaseTmp = angular.copy($rootScope.arrPurchase[n_curSelected]);
          
          if (nSliderIndex > -1){
            arrPurchaseTmp[nSliderIndex] = count;
          }

          var total = 0;
          var new999Price = 0;
          for (var i = 0; i < $rootScope.listOfPriceFund[n_curSelected].ulen; i ++){
            if (arrPurchaseTmp[i] != 0){
              total = total + arrPurchaseTmp[i];
              new999Price = new999Price + $rootScope.listOfPriceFund[n_curSelected].u[i] * arrPurchaseTmp[i];
            }
            $rootScope.arrStaircase[n_curSelected][i] = total * $rootScope.listOfPriceFund[n_curSelected].u[i];
            $rootScope.arrNew999Price[n_curSelected][i] = total * $rootScope.listOfPriceFund[n_curSelected].u[i] - new999Price;
          }
        }
      };
      // Init slider controll and get current selected index
      // In this function, we can get index of array following slider position
      $scope.InitSlider = function(){
        $scope.minDate = $rootScope.listOfPriceFund[0].udate[0];
        $scope.maxDate = $rootScope.listOfPriceFund[0].udate[$rootScope.listOfPriceFund[0].ulen - 1];

        $scope.minValue = getFormattedString(new Date($scope.minDate));
        $scope.maxValue = getFormattedString(new Date($scope.maxDate));

        $scope.$watch('arr.slider', function (value) {
            if (value != undefined) {
              $scope.errorMessage(0);

              var st = getFormattedDate($rootScope.listOfPriceFund[0].udate[0]);
              var et = getFormattedDate($rootScope.listOfPriceFund[0].udate[$rootScope.listOfPriceFund[0].ulen - 1]);
              $scope.minDate = st;
              $scope.maxDate = et;

              var updatedDate = new Date($scope.minDate);
              $scope.selectedDate = getFormattedDate(updatedDate.setDate(updatedDate.getDate() + value));//Update date on set slider
              $scope.curDate = $rootScope.convertDate($scope.selectedDate);

              $rootScope.sliderIndex = value;
              $scope.arr.ngSecondGraphModel = $rootScope.arrPurchase[$rootScope.m_nSelIndex][value];
              $scope.arr.ngSecondGraphMount = $rootScope.roundDown($rootScope.multiple($rootScope.arrPurchase[$rootScope.m_nSelIndex][value], $rootScope.listOfPriceFund[$rootScope.m_nSelIndex].u[value]), 6);

              $scope.updateStatistics();
              // $scope.updateSlider();
            }
        })
        function getFormattedString(date){ 
          var month = (date.getMonth()+1 < 10) ? '0'+(date.getMonth()+1) : (date.getMonth()+1);
          var day = (date.getDate()<10) ? '0'+date.getDate() : date.getDate();
          return month + '/' + day + '/' + date.getFullYear();
        }
        function getFormattedDate(stDate) {
            var sDate = new Date(stDate);
            return sDate;
        }
        function dayDiff(firstDate, secondDate) {
            var minDate = new Date(firstDate);
            var maxDate = new Date(secondDate);
            var timeDiff = Math.abs(maxDate.getTime() - minDate.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return diffDays;
        }

        $scope.selectedDate = new Date($scope.minDate);

        $scope.arr.sliderRange = dayDiff($scope.minDate, $scope.maxDate);
        $scope.arr.slider = $scope.arr.sliderRange;
      };

      $scope.updateStatistics = function(){
        // for portfolio graph statics
        var VoP = $scope.ngScopePortArray[$rootScope.sliderIndex];
        var Max = 0;
        var Min = 999999;
        var GoL = 0;
        
        for (var i = 0; i <= $rootScope.sliderIndex; i ++){
          if (Max < $rootScope.portfolio[i]) Max = $rootScope.portfolio[i];
          if (Min > $rootScope.portfolio[i]) Min = $rootScope.portfolio[i];
        }

        if (VoP > 0) GoL = $rootScope.portfolio[$rootScope.sliderIndex] / VoP * 100;        

        $scope.ngScopeVoP = (VoP != undefined) ? $rootScope.numberWithCommas(VoP.toFixed(2)) : 0;
        $scope.ngScopeGoL = (GoL != undefined) ? $rootScope.numberWithCommas(GoL.toFixed(2)) : 0;
        $scope.ngScopeMax = $rootScope.numberWithCommas(Max.toFixed(2));
        $scope.ngScopeMin = (Min != 999999) ? $rootScope.numberWithCommas(Min.toFixed(2)) : 0;
        $scope.ngScopeRate = $scope.ngScopeRateArray[$rootScope.sliderIndex];

        if ($scope.ngScopeGoL > 0) $scope.ngScopeGoL = "+"+$scope.ngScopeGoL;
        if ($scope.ngScopeRate > 0) $scope.ngScopeRate = "+"+$scope.ngScopeRate;

        // for second graph statics
        var day91 = $rootScope.dayRetData.day91_return[$rootScope.m_nSelIndex][$rootScope.sliderIndex]*100;
        var day182 = $rootScope.dayRetData.day182_return[$rootScope.m_nSelIndex][$rootScope.sliderIndex]*100;
        var day365 = $rootScope.dayRetData.day365_return[$rootScope.m_nSelIndex][$rootScope.sliderIndex]*100;
        var year = $rootScope.arrStartReturn[$rootScope.m_nSelIndex][$rootScope.sliderIndex] * 1;
        var day7 = $rootScope.dayRetData.day7_loss[$rootScope.m_nSelIndex][$rootScope.sliderIndex]*100;
        $scope.ngScopeDay91 = (day91 != undefined) ? $rootScope.numberWithCommas(day91.toFixed(1)) : 0;
        $scope.ngScopeDay182 = (day182 != undefined) ? $rootScope.numberWithCommas(day182.toFixed(1)) : 0;
        $scope.ngScopeDay365 = (day365 != undefined) ? $rootScope.numberWithCommas(day365.toFixed(1)) : 0;
        $scope.ngScopeYear = (year != undefined) ? $rootScope.numberWithCommas(year.toFixed(1)) : 0;
        $scope.ngScopeDay7 = (day7 != undefined) ? $rootScope.numberWithCommas(day7.toFixed(1)) : 0;
        if ($scope.ngScopeDay91 > 0) $scope.ngScopeDay91 = "+"+$scope.ngScopeDay91;
        if ($scope.ngScopeDay182 > 0) $scope.ngScopeDay182 = "+"+$scope.ngScopeDay182;
        if ($scope.ngScopeDay365 > 0) $scope.ngScopeDay365 = "+"+$scope.ngScopeDay365;
        if ($scope.ngScopeYear > 0) $scope.ngScopeYear = "+"+$scope.ngScopeYear;
        if ($scope.ngScopeDay7 > 0) $scope.ngScopeDay7 = "+"+$scope.ngScopeDay7;

        var sum = 0;
        for (var i = 0; i <= $rootScope.sliderIndex; i ++){
          sum = sum + $rootScope.arrPurchase[$rootScope.m_nSelIndex][i];                              
        }
        
        $scope.ngScopeTranPrice = $rootScope.arrStaircase[$rootScope.m_nSelIndex][$rootScope.sliderIndex];
        $scope.ngScopeTranPrice = ($scope.ngScopeTranPrice == undefined) ? $scope.ngScopeTranPrice : $rootScope.numberWithCommas($scope.ngScopeTranPrice.toFixed(2));        
        $scope.ngScopeUnidades = $rootScope.numberWithCommas(sum);
      }

      // Calculate $rootScope.portfolio
      // $rootScope.portfolio is to draw first graph
      $scope.updateSlider = function(){
        var newArr = [];
        for (var i = 0; i < $rootScope.listOfPriceFund[0].ulen; i++) {
          var max = new Date($scope.maxDate);
          var cur = new Date($rootScope.listOfPriceFund[0].udate[i]);
          if (cur <= max){
            var sum = 0;
            for (var j = 0; j < $rootScope.listOfPriceFund.length; j ++){
              sum = sum + $rootScope.listOfPriceFund[j].u[i] * $scope.arr.ngSecondGraphModel;
            }
            newArr.push(sum);         
          }
        }
        $rootScope.portfolio = newArr;
      };

      // fund select controller
      // example : RF.GloModera, RF.GloAgresi, RF.GloConser, ....
      $scope.optChanged = function(){
        $rootScope.m_nSelIndex = $scope.GetFundIndex($scope.arr.selectedFunds);
        $rootScope.ngSecondGraphTitle = $rootScope.listOfPriceFund[$rootScope.m_nSelIndex].name;
        $scope.arr.ngSecondGraphModel = $rootScope.arrPurchase[$rootScope.m_nSelIndex][$rootScope.sliderIndex];
        $scope.arr.ngSecondGraphMount = $rootScope.roundDown($rootScope.multiple($rootScope.arrPurchase[$rootScope.m_nSelIndex][$rootScope.sliderIndex], $rootScope.listOfPriceFund[$rootScope.m_nSelIndex].u[$rootScope.sliderIndex]), 6);
        $scope.updateStatistics();
        $rootScope.strDrawStart = "draw";
        $scope.arr.ngScopeUploadVisible = ($scope.arr.tableInfo == undefined) ? false : ($scope.arr.tableInfo.length > 0) ? false : true;
        $scope.arr.ngScopeUploadVisible = ($scope.arr.username == "") ? false : $scope.arr.ngScopeUploadVisible;
      };

      $scope.GetFundIndex = function(strFundName){
        for (var i = 0; i < $rootScope.listOfPriceFund.length; i ++){
            if ($rootScope.listOfPriceFund[i].name == strFundName){
                return i;
            }
        }
        return 0;
      }
      $scope.GetDateIndex = function(arr, tdate){
        for (var i = 0; i < arr.length; i ++){
          var sourceDate = new Date(arr[i]);
          var strDate = $rootScope.convertDate(sourceDate);
          if (strDate == tdate) return i;
        }
        return -1;
      }
      $scope.calculateItemCount = function(){        
        for (var i = 0; i < $rootScope.arrPurchase.length; i ++){
          var sum = 0;
          for (var j = 0; j < $rootScope.arrPurchase[i].length; j ++){
            sum = sum + $rootScope.arrPurchase[i][j];
            $rootScope.arrItemCount[i][j] = sum;
          }
        }
      }

      // Init Table
      $scope.initTable = function(){
        for (var i = 0; i < $rootScope.listOfPriceFund.length; i ++){
            var arr_Tmp = [];
            for (var j = 0; j < $rootScope.listOfPriceFund[i].u.length; j ++){
                arr_Tmp[j] = 0;
            }            
            $rootScope.arrNew999Price[i] = angular.copy(arr_Tmp);
            $rootScope.arrStaircase[i] = angular.copy(arr_Tmp);
            $rootScope.arrPurchase[i] = angular.copy(arr_Tmp);
            $rootScope.arrItemCount[i] = angular.copy(arr_Tmp);
        }
      }

      // Update Table
      $scope.refreshTable = function(){
        var transactions = $rootScope.listOfTransaction;
        $scope.arr.tableInfo = [];
        $scope.arr.tableStore = [];

        for (var i = 0; i < $rootScope.listOfPortfolio.length; i ++){
          var listOfSaverTransaction = [];
          for (var j = 0; j < transactions.length; j ++){
            // if ($rootScope.loginUser[0].saver_id != transactions[j].strSaverID) continue;
            if ($rootScope.listOfPortfolio[i].portfolio_id != transactions[j].strPortID) continue;
            listOfSaverTransaction.push(transactions[j]);
          }

          if (listOfSaverTransaction.length > 0){
            var eachObj = {"PortIndex" : 0, "PortStatus" : "Show", "PortIcon" : "add", "Portname" : listOfSaverTransaction[0].strPortID, "Portarray" : angular.copy(listOfSaverTransaction)};
            $scope.arr.tableStore.push(eachObj);
          }
        }

        for (var i = 0; i < $scope.arr.tableStore.length; i ++){
          $scope.arr.tableStore[i].PortIndex = i;
        }

        $scope.arr.tableInfo = angular.copy($scope.arr.tableStore);
        
        $scope.arr.tbHeader[0].icon = "";
        $scope.onTableReorder(1);
      }

      $scope.checkTable = function(){
        for (var i = 0; i < $scope.arr.tableInfo.length; i ++){
          for (var j = 0; j < $scope.listOfPriceFund.length; j ++){
            var eachArray = []
            for (var k = 0; k < $scope.arr.tableInfo[i].Portarray.length; k ++){              
              if ($scope.arr.tableInfo[i].Portarray[k].nFundIndex == j) eachArray.push($scope.arr.tableInfo[i].Portarray[k]);
            }
            if (eachArray.length > 0){
              for (var k = 0; k < eachArray.length; k ++){
                eachArray[k].deletable = false;
                var sum = 0;
                for (var n = 0; n < eachArray.length; n ++){
                  if (k == n) continue;
                  var ItemCnt = (eachArray[n].strBoS == "Venta") ? -eachArray[n].nItemCnt : eachArray[n].nItemCnt;
                  sum = sum + ItemCnt;
                  if (sum < 0){
                    eachArray[k].deletable = true;
                    break;
                  }
                }
              }
            }
          }
          // var nArrIndex = $scope.arr.tableInfo[i].nFundIndex;
          // var arrItemCountTmp = angular.copy($rootScope.arrItemCount[nArrIndex]);
          // var nDateIndex = $scope.GetDateIndex($rootScope.listOfPriceFund[0].udate, $scope.arr.tableInfo[i].tDate);
          // var nItemCnt = ($scope.arr.tableInfo[i].strBoS == "Sell") ? -$scope.arr.tableInfo[i].nItemCnt : $scope.arr.tableInfo[i].nItemCnt;

          // var bCheckSum = true;
          // for (var j = nDateIndex; j < $rootScope.listOfPriceFund[0].ulen; j ++){
          //   if (arrItemCountTmp[j] - nItemCnt < 0){
          //     bCheckSum = false;
          //     break;
          //   }
          // }

          // $scope.arr.tableInfo[i].deletable = (bCheckSum) ? false : true;
        }
      }

      $scope.onShowHide = function(index, bIsDraw){
        $scope.arr.tableInfo = [];
        $scope.arr.tableStore[index].PortStatus = ($scope.arr.tableStore[index].PortStatus == "Show") ? "Hide" : "Show";
        $scope.arr.tableStore[index].PortIcon = ($scope.arr.tableStore[index].PortStatus == "Show") ? "add" : "remove";
        
        for (var i = 0; i < $scope.arr.tableStore.length; i ++){
          $scope.arr.tableInfo.push(angular.copy($scope.arr.tableStore[i]));
          if ($scope.arr.tableStore[i].PortStatus != "Show"){
            $rootScope.listofOtherPortfolio[i].showhide = 0;
            $scope.arr.tableInfo[i].Portarray = [];
          }else{
            $rootScope.listofOtherPortfolio[i].showhide = 1;
          }
        }
        if(bIsDraw == 1) $rootScope.strDrawStart = "draw";
      }

      $scope.onShowAll = function(index){
        $scope.arr.tableInfo = [];
        $scope.arr.tableStore[index].PortStatus = "Show";
        $scope.arr.tableStore[index].PortIcon = "add";
        
        for (var i = 0; i < $scope.arr.tableStore.length; i ++){
          $scope.arr.tableInfo.push(angular.copy($scope.arr.tableStore[i]));
          if ($scope.arr.tableStore[i].PortStatus != "Show"){
            $rootScope.listofOtherPortfolio[i].showhide = 0;
            $scope.arr.tableInfo[i].Portarray = [];
          }else{
            $rootScope.listofOtherPortfolio[i].showhide = 1;
          }
        }

        $rootScope.strDrawStart = "draw";
      }

      $scope.refreshGraph = function(){
        $scope.drawFirstGraph();
        for (var i = 0; i < $scope.arr.tableInfo.length; i ++){
          if ($scope.arr.tableInfo[i].Portname != $scope.arr.username) continue;

          for (var j = 0; j < $scope.arr.tableInfo[i].Portarray.length; j ++){
            var nFundIndex = $scope.GetFundIndex($scope.arr.tableInfo[i].Portarray[j].strFundName);
            var nCount = $scope.arr.tableInfo[i].Portarray[j].nItemCnt;
            nCount = ($scope.arr.tableInfo[i].Portarray[j].strBoS == "Venta") ? -nCount : nCount;
            var nDateIndex = $scope.GetDateIndex($rootScope.listOfPriceFund[0].udate, $scope.arr.tableInfo[i].Portarray[j].tDate);
            
            $rootScope.arrPurchase[nFundIndex][nDateIndex] = nCount;
            
            $scope.calculateItemCount();
            $scope.drawSecondGraph(nFundIndex, nCount, nDateIndex);
          }        
          $scope.drawFirstGraph();
        }
      }
      $scope.onTableReorder = function(index){
        var strIconName = $scope.arr.tbHeader[index].icon;
        for (var i = 0; i < $scope.arr.tbHeader.length; i ++){
          $scope.arr.tbHeader[i].icon = "";
        }
        var strOrderCmd = "";
        if (strIconName == ""){
          $scope.arr.tbHeader[index].icon = "arrow_drop_down";
          strOrderCmd = "down";
        }else if(strIconName == "arrow_drop_down"){
          $scope.arr.tbHeader[index].icon = "arrow_drop_up";
          strOrderCmd = "up";
        }else if(strIconName == "arrow_drop_up"){
          $scope.arr.tbHeader[index].icon = "arrow_drop_down";
          strOrderCmd = "down";
        }
        $scope.sortTable(index, strOrderCmd);
      }
      $scope.sortTable = function(index, strOrderCmd){
        for (var i = 0; i < $scope.arr.tableInfo.length; i ++){
          $scope.arr.tableInfo[i].Portarray.sort(function(a, b){        
            var keyA = a[Object.keys(a)[index]],
                keyB = b[Object.keys(a)[index]];
                
            // Compare the 2 dates
            if(keyA < keyB) return (strOrderCmd == "down") ? -1 : 1;
            if(keyA > keyB) return (strOrderCmd == "down") ? 1 : -1;
              return 0;
          });
        }
      }
      // Buy function
      $scope.onBuy = function(name){
        if (Math.abs($scope.arr.ngSecondGraphModel) == 0) return;
        if ($rootScope.username.length < 1){
          $mdDialog.show(
            $mdDialog.alert()
              .parent(angular.element(document.querySelector('#popupContainer')))
              .clickOutsideToClose(true)
              .title('Input Error')
              .textContent('Please input Portfolio name.')
              .ariaLabel('Alert Dialog Demo')
              .ok('Got it!')
          );
          return;
        }
        // initializing buyInfo object
        var buyInfo = {};
        buyInfo.username = $rootScope.username;
        buyInfo.saverid = "deploy_user";
        buyInfo.unitData = Math.abs($scope.arr.ngSecondGraphModel);
        buyInfo.curDate = $scope.curDate;
        buyInfo.eachValue = [];
        buyInfo.eachIndex = [];
        buyInfo.curIndex = $rootScope.m_nSelIndex;
        // updating the array of units for a fund after a buy transaction
        buyInfo.portValue = $rootScope.portfolio[$rootScope.sliderIndex];
        for (var i = 0; i < $rootScope.arrNew999Price.length; i ++){          
          buyInfo.eachIndex[i] = $rootScope.listOfPriceFund[i].index;
          buyInfo.eachValue[i] = $rootScope.multiple($rootScope.listOfPriceFund[i].u[$rootScope.sliderIndex], buyInfo.unitData);
        }

        buyInfo.nowDate = $rootScope.convertDate(new Date());

        var url = '/buy';
        
        if ($scope.arr.ngSecondGraphModel >= 0){
          // buy item
          url = url + '/' + buyInfo.eachIndex[buyInfo.curIndex];
          url = url + '/' + buyInfo.unitData;
          url = url + '/' + 999;
          url = url + '/' + buyInfo.eachValue[buyInfo.curIndex];
          url = url + '/' + buyInfo.curDate;        
          url = url + '/' + buyInfo.username;  
          url = url + '/' + buyInfo.saverid;
          url = url + '/' + buyInfo.nowDate;
        }else{
          //sell item
          url = url + '/' + 999;
          url = url + '/' + buyInfo.unitData;
          url = url + '/' + buyInfo.eachIndex[buyInfo.curIndex];
          url = url + '/' + buyInfo.eachValue[buyInfo.curIndex];
          url = url + '/' + buyInfo.curDate;
          url = url + '/' + buyInfo.username;
          url = url + '/' + buyInfo.saverid;
          url = url + '/' + buyInfo.nowDate;
        }
        $scope.arr.sliderDisable = false;
        // console.log(url);          
        $http.get(url).success(function (portdata) {
          $http.get('/userInfo').success(function (portnames){
            $rootScope.listOfPortfolio = portnames;
            $rootScope.getTransactionData();
          });
        });
        $scope.arr.tableInfo = [];
        // save portfolio name into cookie
        var storeInfo = {};
        storeInfo.username = $rootScope.username;
        $cookieStore.put('Orza', storeInfo);
      };

      // discard transaction
      $scope.onSell = function(name){
        if ($scope.arr.sliderDisable == true){
            $scope.arr.sliderDisable = false;
            $scope.arr.ngSecondGraphModel = $rootScope.arrPurchase[$rootScope.m_nSelIndex][$rootScope.sliderIndex];
            $scope.unitChanged();
        }
      };

      // portfolio save
      $scope.onSave = function(){
          var storeInfo = {};
          storeInfo.username = $rootScope.username;

          var confirm = $mdDialog.confirm()
            .title('Would you like to save data into cookie?')
            .textContent('All of the data would be saved and you can load it.')
            .ariaLabel('Lucky day') // Type of label?
            .ok('Save it')
            .cancel('Not now');

          // store information on portfolio in cookie
          $mdDialog.show(confirm).then(function() {
              $cookieStore.put('Orza', storeInfo);
          }, function() {
              // Not now
          });
      };

      // delete transaction
      $scope.onDelete = function(transaction){
        if (transaction.nFundIndex > -1){
          $http.get("/delete/" + transaction.id ).success(function (transData) {
              $rootScope.getTransactionData();
          });
          $scope.arr.tableInfo = [];
        }       
      }

      // upload transaction
      $scope.onUpload = function(){
        document.getElementById("file").click();
      }

      // download transaction
      $scope.onDownload = function(){
        document.getElementById("download").click();
      }

      // compare keys for long fund names
      $scope.GetFundIndexByKey = function(strLongName){
        strLongName = strLongName.toLowerCase();
        for (var i = 0; i < $rootScope.listOfPriceFund.length; i ++){
          for (var j = 0; j < $rootScope.listOfPriceFund[i].dict.length; j ++){
            var nIndex = strLongName.indexOf($rootScope.listOfPriceFund[i].dict[j]);
            if (nIndex > -1){
              return $rootScope.listOfPriceFund[i].name;
            }
          }
        }
        return undefined;
      }
      // parsing excel data
      $scope.onParsing = function(data){
        var postData = [];
        for (var i = 0; i < data.length; i ++){
          var fundObj = data[i]["fondo"];

          if ((data[i]["año"] == undefined) || (data[i]["año"] == "")) break;
          if ((data[i]["mes"] == undefined) || (data[i]["mes"] == "")) break;
          if ((data[i]["día"] == undefined) || (data[i]["día"] == "")) break;
          if ((data[i]["fondo"] == undefined) || (data[i]["fondo"] == "")) break;          
          if ((data[i]["compra/-venta"] == undefined) || (data[i]["compra/-venta"] == "")) break;
          if ((data[i]["portafolio"] == undefined) || (data[i]["portafolio"] == "")) break;

          var strFundName = $scope.GetFundIndexByKey(fundObj);
          if (strFundName == undefined) break;

          var nFundID = $scope.GetFundIndex(strFundName);
          var strDate = $rootScope.convertDate(new Date(data[i]["año"] + "-" + data[i]["mes"] + "-" + data[i]["día"]));
          var strPortName = data[i]["portafolio"];
          var nItemCnt = data[i]["compra/-venta"]*1;
          var nSliderIndex = $scope.GetDateIndex($rootScope.listOfPriceFund[0].udate, strDate);
          var nItemValue = $rootScope.listOfPriceFund[nFundID].u[nSliderIndex];
          var strCurDate = $rootScope.convertDate(new Date());
          var nTotal = $rootScope.multiple(Math.abs(nItemCnt), nItemValue);

          var objParam = {fund_id_bought : 0, units_bought : 0, fund_id_sold : 0, units_sold : 0, date_value_transaction : 0, portfolio_id : 0, saver_id : 0, nowDate : 0};
          objParam.fund_id_bought = (nItemCnt >= 0) ? $rootScope.listOfPriceFund[nFundID].index : 999;
          objParam.units_bought = Math.abs(nItemCnt);
          objParam.fund_id_sold = (nItemCnt >= 0) ? "999" : $rootScope.listOfPriceFund[nFundID].index;
          objParam.units_sold = nTotal;
          objParam.date_value_transaction = strDate;
          objParam.portfolio_id = strPortName;
          objParam.saver_id = "deploy_user";
          objParam.nowDate = strCurDate;

          var url = "/buy/";
          var cond1 = (nItemCnt >= 0) ? $rootScope.listOfPriceFund[nFundID].index : 999;
          url = url + cond1 + "/";
          url = url + Math.abs(nItemCnt) + "/";
          var cond2 = (nItemCnt >= 0) ? "999" : $rootScope.listOfPriceFund[nFundID].index;
          url = url + cond2 + "/";
          url = url + nTotal + "/";
          url = url + strDate + "/";
          url = url + $rootScope.username + "/";
          url = url + "deploy_user" + "/";
          url = url + strCurDate;

          postData.push(objParam);
        }
        
        if (postData.length > 0){
          $http.post("/buy", {user: postData}).success(function(pData){
            $http.get('/userInfo').success(function (portnames){
              $rootScope.listOfPortfolio = portnames;
              $rootScope.getTransactionData();
            });
          });
          $scope.arr.tableInfo = [];
          $scope.arr.ngScopeUploadVisible = false;

          // save communication time
          var storeInfoTime = {};
          storeInfoTime.loginName = $rootScope.loginUser;
          storeInfoTime.loginTime = new Date();
          $cookieStore.put('OrzaTime', storeInfoTime);
        }
      }

      $scope.resetTable = function(){
        if (window.innerWidth >= 1280){
          $scope.arr.isExpand = "";
          for (var i = 0; i < 7; i ++){
            $scope.arr.tbHeader[i].flex = 15;
            eval("$scope.arr.flex" + (i+1) + "=" + 15);
            eval("$scope.arr.styleFlex" + (i+1) + "= {'display' : 'block'}");
            if (i < 5){
              eval("$scope.arr.styleExpand" + (i+1) + "= {'display' : 'none'}");
            }
          }
          $scope.arr.flex8 = 5;
        }else if ((window.innerWidth < 1280) && (window.innerWidth >= 1000)){
          $scope.arr.isExpand = "+";
          for (var i = 0; i < 7; i ++){
            if (i < 6){
              $scope.arr.tbHeader[i].flex = 20;
              eval("$scope.arr.flex" + (i+1) + "=" + 20);
              eval("$scope.arr.styleFlex" + (i+1) + "= {'display' : 'block'}");
            }else{
              $scope.arr.tbHeader[i].flex = 0;
              eval("$scope.arr.flex" + (i+1) + "=" + 0);
              eval("$scope.arr.styleFlex" + (i+1) + "= {'display' : 'none'}");
            }
            if (i < 5){
              if (i < 4) eval("$scope.arr.styleExpand" + (i+1) + "= {'display' : 'none'}");
              else eval("$scope.arr.styleExpand" + (i+1) + "= {'display' : 'block'}");
            }
          }
          $scope.arr.flex8 = 5;
        }else if((window.innerWidth < 1050) && (window.innerWidth >= 800)){
          $scope.arr.isExpand = "+";
          for (var i = 0; i < 7; i ++){
            if (i < 5){
              $scope.arr.tbHeader[i].flex = 20;
              eval("$scope.arr.flex" + (i+1) + "=" + 20);
              eval("$scope.arr.styleFlex" + (i+1) + "= {'display' : 'block'}");
            }else{
              $scope.arr.tbHeader[i].flex = 0;
              eval("$scope.arr.flex" + (i+1) + "=" + 0);
              eval("$scope.arr.styleFlex" + (i+1) + "= {'display' : 'none'}");
            }
            if (i < 5){
              if (i < 3) eval("$scope.arr.styleExpand" + (i+1) + "= {'display' : 'none'}");
              else eval("$scope.arr.styleExpand" + (i+1) + "= {'display' : 'block'}");
            }
          }
          $scope.arr.flex8 = 5;
        }else if((window.innerWidth < 800) && (window.innerWidth >= 700)){
          $scope.arr.isExpand = "+";
          for (var i = 0; i < 7; i ++){
            if (i < 4){
              $scope.arr.tbHeader[i].flex = 20;
              eval("$scope.arr.flex" + (i+1) + "=" + 20);
              eval("$scope.arr.styleFlex" + (i+1) + "= {'display' : 'block'}");
            }else{
              $scope.arr.tbHeader[i].flex = 0;
              eval("$scope.arr.flex" + (i+1) + "=" + 0);
              eval("$scope.arr.styleFlex" + (i+1) + "= {'display' : 'none'}");
            }
            if (i < 5){
              if (i < 2) eval("$scope.arr.styleExpand" + (i+1) + "= {'display' : 'none'}");
              else eval("$scope.arr.styleExpand" + (i+1) + "= {'display' : 'block'}");
            }
          }
          $scope.arr.flex8 = 20;
        }else if((window.innerWidth < 700) && (window.innerWidth >= 600)){
          $scope.arr.isExpand = "+";
          for (var i = 0; i < 7; i ++){
            if (i < 3){
              $scope.arr.tbHeader[i].flex = 30;
              eval("$scope.arr.flex" + (i+1) + "=" + 30);
              eval("$scope.arr.styleFlex" + (i+1) + "= {'display' : 'block'}");
            }else{
              $scope.arr.tbHeader[i].flex = 0;
              eval("$scope.arr.flex" + (i+1) + "=" + 0);
              eval("$scope.arr.styleFlex" + (i+1) + "= {'display' : 'none'}");
            }
            if (i < 5){
              if (i < 1) eval("$scope.arr.styleExpand" + (i+1) + "= {'display' : 'none'}");
              else eval("$scope.arr.styleExpand" + (i+1) + "= {'display' : 'block'}");
            }
          }
          $scope.arr.flex8 = 10;
        }else if(window.innerWidth < 600){
          $scope.arr.isExpand = "+";
          for (var i = 0; i < 7; i ++){
            if (i < 2){
              $scope.arr.tbHeader[i].flex = 40;
              eval("$scope.arr.flex" + (i+1) + "=" + 40);
              eval("$scope.arr.styleFlex" + (i+1) + "= {'display' : 'block'}");
            }else{
              $scope.arr.tbHeader[i].flex = 0;
              eval("$scope.arr.flex" + (i+1) + "=" + 0);
              eval("$scope.arr.styleFlex" + (i+1) + "= {'display' : 'none'}");
            }
            if (i < 5){
              eval("$scope.arr.styleExpand" + (i+1) + "= {'display' : 'block'}");
            }
          }
          $scope.arr.flex8 = 20;
        }
      }

      $scope.$watch('arr.ngScopeFilePath', function (files) {
        if (files != undefined){
          if (files.length > 0){
            var f = files[0];
            var r = new FileReader();
            r.onloadend = function(e) {
              var data = e.target.result;
              
              $http.post("/getExcel", {user: data}).success(function(excelData){
                $scope.onParsing(excelData);
              });
            }
            r.readAsText(f, 'CF80');
          }          
        }          
      });

      $scope.$watch('isRecRet', function (value) {
          if (value == true){
            $scope.arr.username = $rootScope.username;
          }
      });

      $scope.$watch('arr.username', function (value) {
          $rootScope.username = $scope.arr.username;   
          $scope.initTable();
          $scope.refreshTable();
          $scope.refreshGraph();
          $scope.checkTable();
          $scope.optChanged();
      });
      
      $rootScope.$watch('listOfTransaction', function (){
        $scope.initTable();
        $scope.refreshTable();
        $scope.refreshGraph();
        $scope.checkTable();
        $scope.optChanged();
      });

      $rootScope.$watch('hideIndex', function (){
        if ($rootScope.hideIndex != undefined){
          if ($rootScope.hideIndex.length > 0){
            for (var i = 0; i < $rootScope.listofOtherPortfolio.length; i ++){
              $scope.onShowAll(i);
            }
            for (var i = 0; i < $rootScope.hideIndex.length; i ++){
              $scope.onShowHide($rootScope.hideIndex[i], 1);
            }
          }else{
            for (var i = 0; i < $rootScope.listofOtherPortfolio.length; i ++){
              $scope.onShowAll(i);
            }            
          }          
        }
      });

      $interval(function() {

        $scope.arr.determinateValue += 1;
        if ($scope.arr.determinateValue > 100) {
          $scope.arr.determinateValue = 30;
        }
      }, 100);

      // Draw Portfolio Graph
      $scope.drawFirstGraph();
      $scope.InitSlider();

      // Draw Every Funds Graphs
      $scope.drawSecondGraph($rootScope.m_nSelIndex, $scope.arr.ngSecondGraphModel, $rootScope.sliderIndex);

      // Select every funds name to show or hide.
      $scope.arr.selectedFunds = $rootScope.listOfPriceFund[$rootScope.m_nSelIndex].name;
      $rootScope.userModel = "none"
      $scope.optChanged();
      $scope.resetTable();
  }])
  .directive('filesInput', function(){
    return{
      require: "ngModel",
      link: function postLink(scope,elem,attrs,ngModel) {
        elem.on("change", function(e) {
          var files = elem[0].files;
          ngModel.$setViewValue(files);
        })
      }
    }
  });
}());