(function () {
  'use strict';

  // create the angular app
  angular.module('orzaApp', [    
    'ngRoute',
    'orzaApp.controllers',
    'orzaApp.directives',
    'ngMaterial'    
    ])
    .config(function($routeProvider, $mdThemingProvider) {
      $routeProvider
      .when('/main', {
        templateUrl : 'scripts/main/main.html'
      })
      .otherwise({
        redirectTo : '/main'
      });
      $mdThemingProvider.theme('default')
      .primaryPalette('blue')
      .accentPalette('red')
      // .dark();
    });
    

  // setup dependency injection
  angular.module('d3', ['ngMaterial']);
  angular.module('orzaApp.controllers', []);
  angular.module('orzaApp.directives', ['d3']);
}());
