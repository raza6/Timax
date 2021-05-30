/* INIT MATERIAL*/
document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.collapsible');
  var instances = M.Collapsible.init(elems);
});
  
/* INIT TIMAX™*/

//Form var
let inBetweenExPause = 10;
let inBetweenRepPause = 60;
let inBetweenRunPause = 180;
let exTime = 30;
let nbExInRun = 3;
let nbRepInRun = 4;
let nbRun = 3;
let volume = 70;

//Script var
let timingList = [];
let currentTimingStatus = {};
let isPaused = false;
let beep = new Audio('https://freesound.org/data/previews/180/180821_118393-lq.mp3');
beep.volume = volume/100;
let victory = new Audio('https://ia903209.us.archive.org/35/items/GuileTheme/Guile Theme.mp3');
victory.volume = volume/100;
let timeOutHandlerRunTimer;
let timeOutHandlerReset;

const haveATreat = [
  'You did it you crazy son of a bitch !',
  'You\'re a beautiful person and you deserve to be love',
  'Congratulation, you\'re improving everyday !',
  'Once again, you\'re the best person on Earth',
  'I hope to be like you one day',
  'Hey you fucking rock',
  'You\'re doing fantastically great',
  'You\'re a fucking icon',
  'You\'re to precious for this world'
];

const timingType = {
  NONE: undefined,
  EXERCISE: "ex",
	SMALL_PAUSE: "smallPause",
	BIG_PAUSE: "bigPause"
};

document.getElementById('inBetweenExPause').addEventListener('change', (e) => {
  inBetweenExPause = parseInt(e.target.value);
});
document.getElementById('inBetweenRepPause').addEventListener('change', (e) => {
  inBetweenRepPause = parseInt(e.target.value);
});
document.getElementById('inBetweenRunPause').addEventListener('change', (e) => {
  inBetweenRunPause = parseInt(e.target.value);
});
document.getElementById('exTime').addEventListener('change', (e) => {
  exTime = parseInt(e.target.value);
});
document.getElementById('nbExInRun').addEventListener('change', (e) => {
  nbExInRun = parseInt(e.target.value);
});
document.getElementById('nbRepInRun').addEventListener('change', (e) => {
  nbRepInRun = parseInt(e.target.value);
});
document.getElementById('nbRun').addEventListener('change', (e) => {
  nbRun = parseInt(e.target.value);
});
document.getElementById('volume').addEventListener('change', (e) => {
  volume = parseInt(e.target.value);
  victory.volume = volume/100;
  beep.volume = volume/100;
});

/* INIT INTERFACE */
const launchButton = document.getElementById("launch");
launchButton.addEventListener('click', () => {
  start();
});

const cancelButton = document.getElementById("cancel");
cancelButton.addEventListener('click', () => {
  clearTimeout(timeOutHandlerRunTimer);
  reset();
});

const pauseButton = document.getElementById("pause");
pauseButton.addEventListener('click', () => {
  clearTimeout(timeOutHandlerRunTimer);
  isPaused = !isPaused;
  if (isPaused) {
    pauseButton.children[0].innerText = 'play_arrow';
    pauseButton.children[1].innerText = 'RESUME';
  } else {
    pauseButton.children[0].innerText = 'pause';
    pauseButton.children[1].innerText = 'PAUSE';
    runTimer();
  }
});

const displayTimer = document.getElementById('timerDisplay');
const displayRemaining = document.getElementById('timerRemaining');
const cardDisplayStatusNotLaunched = document.getElementById('notLaunched');
const cardDisplayStatusLaunched = document.getElementById('launched');
const timerBlinker = document.getElementById('timerBlinker');

/* TIMER BEHAVIOR */
function reset() {
  cardDisplayStatusNotLaunched.hidden = false;
  cardDisplayStatusLaunched.hidden = true;
  beep.pause();
  victory.pause();
  displayTimer.innerText = '0';
  displayTimer.classList.remove('victory');

  clearTimeout(timeOutHandlerReset);
  clearTimeout(timeOutHandlerRunTimer);

  timingList = [];
  currentTimingStatus = {
    currentSegmentId: 0,
    currentSegmentRemaining: 0,
    totalRemaining: 0,
    specialEvent: timingType.NONE,
    isEnded: false
  }
}

function start() {
  //Make sure were in init position
  reset();

  //Build timingList
  for (let run = 0; run < nbRun; run++) {
    for (let rep = 0; rep < nbRepInRun; rep++) {
      for (let ex = 0; ex < nbExInRun; ex++) {
        timingList.push({
          time: inBetweenExPause,
          type: timingType.SMALL_PAUSE
        });
        timingList.push({
          time: exTime,
          type: timingType.EXERCISE
        });
      }
      if (rep < nbRepInRun - 1) {
        timingList.push({
          time: inBetweenRepPause,
          type: timingType.BIG_PAUSE
        });
      }
    }
    if (run < nbRun - 1) {
      timingList.push({
        time: inBetweenRunPause,
        type: timingType.BIG_PAUSE
      });
    }
  }
  
  //Build currentTimingStatus
  currentTimingStatus = {
    ...currentTimingStatus,
    currentSegmentId: 0,
    currentSegmentRemaining: timingList[0].time,
    totalRemaining: timingList.reduce((a, b) => a + b.time + 1, 0) - 1,
  }
  
  console.log(timingList, currentTimingStatus);

  //Switch display
  cardDisplayStatusNotLaunched.hidden = true;
  cardDisplayStatusLaunched.hidden = false;

  //Start timer
  runTimer();
}

function runTimer() {
  timeOutHandlerRunTimer = setTimeout(() => runTimer(), 1000);
  displayCurrentTiming();
  prepareNextTick();
}

function displayCurrentTiming() {
  if (currentTimingStatus.isEnded) { //Handle end
    clearTimeout(timeOutHandlerRunTimer);
    victory.play();
    displayTimer.innerText = haveATreat[Math.floor(Math.random() * haveATreat.length)];
    displayTimer.classList.add('victory');
    timeOutHandlerReset = setTimeout(() => reset(), 244000);
  } else { // Timer running display
    displayTimer.innerText = currentTimingStatus.currentSegmentRemaining;
    displayRemaining.innerText = new Date(1000 * currentTimingStatus.totalRemaining).toISOString().substr(11, 8);
    if (currentTimingStatus.specialEvent !== timingType.NONE) { //Handle blinking
      switch(currentTimingStatus.specialEvent) {
        case timingType.EXERCISE:
          blink(2);
          break;
        case timingType.SMALL_PAUSE:
          blink(1);
          break;
        case timingType.BIG_PAUSE:
          blink(3);
          break;
      }
    }
  }
}

function prepareNextTick() {
  if (currentTimingStatus.currentSegmentRemaining > 0) {
    currentTimingStatus = {
      ...currentTimingStatus,
      currentSegmentRemaining: currentTimingStatus.currentSegmentRemaining - 1,
      totalRemaining: currentTimingStatus.totalRemaining - 1,
      specialEvent: timingType.NONE
    }
  } else { // Next segment
    if (currentTimingStatus.currentSegmentId < timingList.length - 1) {
      currentTimingStatus = {
        currentSegmentId: currentTimingStatus.currentSegmentId + 1,
        currentSegmentRemaining: timingList[currentTimingStatus.currentSegmentId + 1].time,
        totalRemaining: currentTimingStatus.totalRemaining - 1,
        specialEvent: timingList[currentTimingStatus.currentSegmentId + 1].type
      }
    } else { // End
      currentTimingStatus = {
        ...currentTimingStatus,
        specialEvent: timingType.NONE,
        isEnded: true
      }
    }
  }
}

/* UTILS */
function blink(times = 1) {
  for (let t = 0; t < times; t++) {
    setTimeout(() => {
      timerBlinker.classList.add('red', 'darken-4');
      beep.play();
    }, t * 500);
    setTimeout(() => {
      timerBlinker.classList.remove('red', 'darken-4');
    }, t * 500 + 250);
  }
}
