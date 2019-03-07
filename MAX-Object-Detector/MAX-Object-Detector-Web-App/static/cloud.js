var cloudChart;
var requestTimeArray=[];
var processingTimeArray=[];
var responseTimeArray=[];
var cloudDataArray=[];
var useragent= navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i);
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
document.getElementById("flip-camera").style.display="none";
if(useragent){
    document.getElementById("flip-camera").style.display="block";
    constraints.video.facingMode={};
    constraints.video.facingMode.exact="environment";   
}

function changeCamera(){

    if(useragent){       
        if(constraints.video.facingMode && constraints.video.facingMode.exact=="environment"){                       
            constraints.video.facingMode.exact="user";
        }else{
            constraints.video.facingMode.exact="environment";
        }

        navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            document.getElementById("cloudVideo").srcObject = stream;
            console.log("Got local user video");
        
        })
        .catch(err => {
            console.log('navigator.getUserMedia error: ', err)
        });
    }

}

navigator.mediaDevices.getUserMedia(constraints)
.then(stream => {
    document.getElementById("cloudVideo").srcObject = stream;
    console.log("Got local user video");

})
.catch(err => {
    console.log('navigator.getUserMedia error: ', err)
});