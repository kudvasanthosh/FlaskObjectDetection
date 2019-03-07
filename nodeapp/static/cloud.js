var cloudChart;
var cloudDataArray=[];
window.onload = function () {
    cloudChart = new CanvasJS.Chart("cloudChartContainer", {
        animationEnabled: true,
        theme: "light2",
        backgroundColor: "#000000",
        title:{
            text: ""
        },
        axisY:{
            includeZero: false
        },
        data: [{        
            type: "line",       
            dataPoints: [
                { y: 0 },
            ]
        }]
    });    
    cloudChart.render();    
}
const constraints = {
    audio: false,
    video: {
        width: {min: 640, ideal: 640, max: 1280},
        height: {min: 480, ideal: 480, max: 720}
    }
};


navigator.mediaDevices.getUserMedia(constraints)
.then(stream => {
    document.getElementById("cloudVideo").srcObject = stream;
    console.log("Got local user video");

})
.catch(err => {
    console.log('navigator.getUserMedia error: ', err)
});