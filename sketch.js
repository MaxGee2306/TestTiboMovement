// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

let video;
let poseNet;
const wow = new Audio("assets/sounds/wow.mp3");
let currentState = "initial";
let animation;
let wallyAnimation;
let rainAnimation;
const poseContainer = document.querySelector(".pose");
const coordsToTrack = [
  "nose",
  "leftEye",
  "rightEye",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "leftKnee",
  "rightKnee",
];
const coordTable = {};
let poses = [];

function setup() {
  const canvas = createCanvas(1920, 1440);
  canvas.parent(document.querySelector(".container"));
  canvas.addClass("canvasel");
  video = createCapture(VIDEO);
  video.size(width, height);
  sunAnimation = bodymovin.loadAnimation({
    container: document.querySelector(".animation1"),
    renderer: "svg",
    loop: true,
    autoplay: false,
    path: "animations/Sunshine-HandsUp.json",
  });

  rainAnimation = bodymovin.loadAnimation({
    container: document.querySelector(".rainymation"),
    renderer: "svg",
    loop: true,
    autoplay: false,
    path: "animations/Rainy.json",
  });

  wallyAnimation = bodymovin.loadAnimation({
    container: document.querySelector(".wallymation"),
    renderer: "svg",
    loop: true,
    autoplay: false,
    path: "animations/Wally.json",
  });

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on("pose", function (results) {
    poses = results;
    if (Object.keys(coordTable).length !== coordsToTrack.length)
      initTable(results);
  });
  window.setInterval(() => {
    updateTable();
  }, 200);
  // Hide the video element, and just show the canvas
  video.hide();
}

const startAnimation1 = () => {
  document.querySelector(".animation1").style.opacity = 1;
  sunAnimation.play();
};

const startRainAnimation = () => {
  document.querySelector(".rainymation").style.opacity = 1;
  rainAnimation.play();
};

const startWallyAnimation = () => {
  document.querySelector(".wallymation").style.opacity = 1;
  wallyAnimation.play();
};

const initTable = () => {
  if (poses.length >= 1) {
    Object.keys(poses[0].pose).map((item) => {
      console.log(item);
      if (coordsToTrack.includes(item)) {
        coordTable[item] = {
          x: document.querySelector(`.${item}X`),
          y: document.querySelector(`.${item}Y`),
        };
      }
    });
  }
};

const updateTable = () => {
  if (poses.length >= 1) {
    Object.keys(poses[0].pose).map((item) => {
      if (coordsToTrack.includes(item)) {
        const { x, y, confidence } = poses[0].pose[item];
        if (confidence > 0.1) {
          coordTable[item].x.innerHTML = x;
          coordTable[item].y.innerHTML = y;
        }
        // console.log(item, x, y);
      }
    });
  }
};

const detectPoses = () => {
  if (poses.length >= 1) {
    const {
      leftWrist,
      rightWrist,
      leftEye,
      rightEye,
      leftKnee,
      rightKnee,
      leftElbow,
      rightElbow,
    } = poses[0].pose;
    if (leftWrist.y < leftEye.y && rightWrist.y < rightEye.y) {
      if (currentState !== "handsUp") {
        poseContainer.innerHTML = "HANDS UP";
        rainAnimation.stop();
        wallyAnimation.stop();
        wow.pause();
        document.querySelector(".rainymation").style.opacity = 0;
        document.querySelector(".wallymation").style.opacity = 0;
        startAnimation1();
        currentState = "handsUp";
      }
    } else if (leftWrist.y > leftKnee.y && rightWrist.y > rightKnee.y) {
      if (currentState !== "handsDown") {
        sunAnimation.stop();
        wallyAnimation.stop();
        wow.pause();
        document.querySelector(".animation1").style.opacity = 0;
        document.querySelector(".wallymation").style.opacity = 0;
        startRainAnimation();
        poseContainer.innerHTML = "HANDS DOWN";
        currentState = "handsDown";
      }
    } else if (
      leftElbow.x < leftWrist.x &&
      rightElbow.x > rightWrist.x &&
      leftElbow.y - leftWrist.y > -100 &&
      leftElbow.y - leftWrist.y < 100 &&
      rightElbow.y - rightWrist.y > -100 &&
      rightElbow.y - rightWrist.y < 100
    ) {
      if (currentState !== "tPose") {
        rainAnimation.stop();
        sunAnimation.stop();
        wow.play();
        startWallyAnimation();
        document.querySelector(".rainymation").style.opacity = 0;
        document.querySelector(".animation1").style.opacity = 0;
        currentState = "tPose";
        poseContainer.innerHTML = "T POSE";
      }
    } else {
      if (currentState !== "initial") {
        rainAnimation.stop();
        sunAnimation.stop();
        wallyAnimation.stop();
        wow.pause();
        document.querySelector(".rainymation").style.opacity = 0;
        document.querySelector(".animation1").style.opacity = 0;
        document.querySelector(".wallymation").style.opacity = 0;
        currentState = "initial";
        poseContainer.innerHTML = "NO POSE DETECTED";
      }
    }
  }
};

function modelReady() {
  select("#status").html("Model Loaded");
}

function draw() {
  image(video, 0, 0, width, height);
  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  drawSkeleton();
  detectPoses();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255, 0, 0);
      line(
        partA.position.x,
        partA.position.y,
        partB.position.x,
        partB.position.y
      );
    }
  }
}
