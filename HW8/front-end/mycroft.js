var app = angular.module("SherlockSearch", ['ngAnimate']); 
app.controller("Lestrade", function($scope) {
    $scope.showResFav = 1; 
    $scope.showGoogleRev = 1;
    $scope.showDetails = function(){
        $scope.showResFav = 0;
        console.debug($scope.showResFav);
    };
    $scope.showResults = function(){
        $scope.showResFav = 1;
        console.debug($scope.showResFav);
    };
});