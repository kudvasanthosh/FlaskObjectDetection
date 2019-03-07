/**
 * Created by chad hart on 11/30/17.
 * Client side of Tensor Flow Object Detection Web API
 * Written for webrtcHacks - https://webrtchacks.com
 */

//Parameters
const s = document.getElementById('objDetect');
const uploadWidth = s.getAttribute("data-uploadWidth") || 544; //the width of the upload file
const mirror =  false; //mirror the boundary boxes
const scoreThreshold = s.getAttribute("data-scoreThreshold") || 0.5;
const apiServer =  window.location.origin + '/model/predict';//the full TensorFlow Object Detection API server url

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







//Video element selector
v = document.getElementById("cloudVideo");
//for starting events
let isPlaying = false,
    gotMetadata = false;

//Canvas setup

//create a canvas to grab an image for upload
let imageCanvas = document.createElement('canvas');
let imageCtx = imageCanvas.getContext("2d");

let drawCanvas = document.getElementById("cloud-canvas");
let drawCtx = drawCanvas.getContext("2d");

//draw boxes and labels on each detected object
function drawBoxes(objects) {

    //clear the previous drawings
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    //filter out objects that contain a class_name and then draw boxes and labels on each
    objects.filter(object => object.label).forEach(object => {
        var corners = object['detection_box'];
        let x = corners[1]  * drawCanvas.width;
        let y = corners[0] * drawCanvas.height;
        var height = (corners[2] - corners[0]) * drawCanvas.height;
        var width = (corners[3] - corners[1]) * drawCanvas.width;
        //flip the x axis if local video is mirrored
        if (mirror) {
            x = drawCanvas.width - (x + width)
        }

        drawCtx.fillText(object.label + " - " + Math.round(object.probability * 100) + "%", x + 5, y + 20);
        drawCtx.strokeRect(x, y, width, height);

    });
}

//Add file blob to a form and post
function postFile(file) {
    var ajaxTime= new Date().getTime();
    //Set options as form data
    let formdata = new FormData();
    formdata.append("image", file);
    formdata.append("requestTimestamp", ajaxTime);
    formdata.append("threshold", scoreThreshold);

    let xhr = new XMLHttpRequest();
    xhr.open('POST', apiServer, true);
    xhr.onload = function () {
        if (this.status === 200) {
            var responseRecived= new Date().getTime();
            let objects = JSON.parse(this.response);

            //draw the boxes
            drawBoxes(objects.predictions);

            //Save and send the next image
            imageCtx.drawImage(v, 0, 0, v.videoWidth, v.videoHeight, 0, 0, uploadWidth, uploadWidth * (v.videoHeight / v.videoWidth));
            imageCanvas.toBlob(postFile, 'image/jpeg');
            var totalTime= responseRecived-ajaxTime;            
            // //chart calculations
            // var requestTime = parseFloat(objects.requestTime);
            let processingTime = parseFloat(objects.processingTime);
            // var responseTime =Math.abs(parseFloat(responseRecived-objects.processingEnd));
            // //var totalTime= requestTime+processingTime+responseTime;
            var rttProcessing= totalTime-processingTime;
            // requestTimeArray.push(requestTime);
            // responseTimeArray.push(responseTime);
            processingTimeArray.push(processingTime);
            cloudDataArray.push(rttProcessing);

            // document.getElementById('req-max-resp-time').innerHTML=Math.max(...requestTimeArray).toFixed(2)+' ms';
            // document.getElementById('req-min-resp-time').innerHTML=Math.min(...requestTimeArray).toFixed(2)+' ms';
            // document.getElementById('req-avg-resp-time').innerHTML=(requestTimeArray.reduce((a,b) => a + b, 0) / requestTimeArray.length).toFixed(2)+' ms';
            
            document.getElementById('processing-max-resp-time').innerHTML=Math.max(...processingTimeArray).toFixed(2)+' ms';
            document.getElementById('processing-min-resp-time').innerHTML=Math.min(...processingTimeArray).toFixed(2)+' ms';
            document.getElementById('processing-avg-resp-time').innerHTML=(processingTimeArray.reduce((a,b) => a + b, 0) / processingTimeArray.length).toFixed(2)+' ms';
            
            // document.getElementById('resp-max-resp-time').innerHTML=Math.max(...responseTimeArray).toFixed(2)+' ms';
            // document.getElementById('resp-min-resp-time').innerHTML=Math.min(...responseTimeArray).toFixed(2)+' ms';
            // document.getElementById('resp-avg-resp-time').innerHTML=(responseTimeArray.reduce((a,b) => a + b, 0) / responseTimeArray.length).toFixed(2)+' ms';
                        
            document.getElementById('overall-max-resp-time').innerHTML=Math.max(...cloudDataArray).toFixed(2)+' ms';
            document.getElementById('overall-min-resp-time').innerHTML=Math.min(...cloudDataArray).toFixed(2)+' ms';
            document.getElementById('overall-avg-resp-time').innerHTML=(cloudDataArray.reduce((a,b) => a + b, 0) / cloudDataArray.length).toFixed(2)+' ms';

            cloudChart.options.data[0].dataPoints.push({ y: rttProcessing });
            cloudChart.render();           
            
        }
        else {
            console.error(xhr);
        }
    };
    xhr.send(formdata);
}

//Start object detection
function startObjectDetection() {

    console.log("starting object detection");
    console.log(v.videoWidth,v.videoHeight)
    //Set canvas sizes base don input video
    drawCanvas.width = v.videoWidth;
    drawCanvas.height = v.videoHeight;

    imageCanvas.width = uploadWidth;
    imageCanvas.height = uploadWidth * (v.videoHeight / v.videoWidth);

    //Some styles for the drawcanvas
    drawCtx.lineWidth = 1;
    drawCtx.strokeStyle = "cyan";
    drawCtx.font = "14px OpenSans";
    drawCtx.fillStyle = "cyan";

    //Save and send the first image
    imageCtx.drawImage(v, 0, 0, v.videoWidth, v.videoHeight, 0, 0, uploadWidth, uploadWidth * (v.videoHeight / v.videoWidth));
    imageCanvas.toBlob(postFile, 'image/jpeg');

}

//Starting events

//check if metadata is ready - we need the video size
v.onloadedmetadata = () => {
    console.log("video metadata ready");
    gotMetadata = true;
    if (isPlaying)
        startObjectDetection();
};

//see if the video has started playing
v.onplaying = () => {
    console.log("video playing");
    isPlaying = true;
    if (gotMetadata) {
        startObjectDetection();
    }
};

