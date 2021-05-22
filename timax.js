/* INIT MATERIAL*/
document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.collapsible');
    var instances = M.Collapsible.init(elems);
  });
  
  /* INIT TIMAX™*/
  let inBetweenExPause = 10;
  let inBetweenRepPause = 60;
  let inBetweenRunPause = 180;
  let exTime = 30;
  let nbExInRun = 3;
  let nbRepInRun = 4;
  let nbRun = 3;
  let timerStruct = [];
  let currentTimingStruct = {};
  let isCancelled = false;
  let isPaused = false;
  let beep = new Audio('https://freesound.org/data/previews/180/180821_118393-lq.mp3');
  beep.volume = 0.7;
  let victory = new Audio('https://ia903209.us.archive.org/35/items/GuileTheme/Guile Theme.mp3');
  
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
  
  /* INIT INTERFACE */
  const launchButton = document.getElementById("launch");
  launchButton.addEventListener('click', (e) => {
    start();
  });
  
  const cancelButton = document.getElementById("cancel");
  cancelButton.addEventListener('click', (e) => {
    isCancelled = true;
  });
  
  const pauseButton = document.getElementById("pause");
  pauseButton.addEventListener('click', (e) => {
    isPaused = !isPaused;
    if (isPaused) {
      pauseButton.children[0].innerText = 'play_arrow';
      pauseButton.children[1].innerText = 'RESUME';
    } else {
      pauseButton.children[0].innerText = 'pause';
      pauseButton.children[1].innerText = 'PAUSE';
      playTimer();
    }
  });
  
  const display = document.getElementById('timerDisplay');
  const displayRemaining = document.getElementById('timerRemaining');
  const switchDisplayNotLaunched = document.getElementById('notLaunched');
  const switchDisplayLaunched = document.getElementById('launched');
  const timerBlinker = document.getElementById('timerBlinker');
  
  /* TIMER BEHAVIOR */
  async function start() {
    //Make sure were in init position
    reset();
  
    //Build timerStruct
    for (let run = 0; run < nbRun; run++) {
      for (let rep = 0; rep < nbRepInRun; rep++) {
        for (let ex = 0; ex < nbExInRun; ex++) {
          timerStruct.push({
            time: inBetweenExPause,
            type: 'smallPause'
          });
          timerStruct.push({
            time: exTime,
            type: 'ex'
          });
        }
        if (rep < nbRepInRun - 1) {
          timerStruct.push({
            time: inBetweenRepPause,
            type: 'bigPause'
          });
        }
      }
      if (run < nbRun - 1) {
        timerStruct.push({
          time: inBetweenRunPause,
          type: 'bigPause'
        });
      }
    }
    console.log(timerStruct);
  
    //Switch display
    switchDisplayNotLaunched.hidden = true;
    switchDisplayLaunched.hidden = false;
  
    //Start timer
    playTimer();
  }
  
  async function playTimer() {
    //Run over timerStruct
    await timerLoop(timerStruct, currentTimingStruct);
  
    //Reset if exiting timer
    if (!isPaused) {
      reset();
    }
  }
  
  async function timerLoop(timings, currentTimingConfig) {
    let remaining;
    if (currentTimingConfig.remainingTiming > 0) {
      remaining = timerStruct.slice(currentTimingConfig.idTiming + 1).reduce((a, b) => a + b.time, 0);
      remaining += currentTimingConfig.remainingTiming;
    } else {
      remaining = timerStruct.slice(currentTimingConfig.idTiming).reduce((a, b) => a + b.time, 0);
    }
  
  
    mainLoop:
      for (let i = currentTimingConfig.idTiming; i < timerStruct.length; i++) { //Loop over each segment
        let timing = timerStruct[i];
  
        //Handle special sub-segment
        let nextCurrentTiming;
        if (i === currentTimingConfig.idTiming && currentTimingConfig.idTiming > 0) {
          nextCurrentTiming = currentTimingConfig.remainingTiming;
        } else {
          nextCurrentTiming = timing.time;
        }
        for (let currentTiming = nextCurrentTiming; currentTiming >= 0; currentTiming--) { //Unwind sub-segment
          display.innerText = currentTiming;
          displayRemaining.innerText = new Date(1000 * remaining--).toISOString().substr(11, 8);
  
          //Cancel
          if (isCancelled) {
            isCancelled = false;
            break mainLoop;
          }
  
          //Pause
          if (isPaused) {
            currentTimingStruct = {
              idTiming: i,
              remainingTiming: currentTiming
            }
            console.log(currentTimingStruct);
  
            break mainLoop;
          }
  
          //Trigger alarm
          if (currentTiming === 0) {
            if (i < timerStruct.length - 1) {
              if (timerStruct[i + 1].type === 'smallPause') {
                blink(1);
              } else if (timerStruct[i + 1].type === 'ex') {
                blink(2);
              } else {
                blink(3);
              }
            } else {
              victory.play();
              display.innerText = 'You did it you crazy son of a bitch !';
              display.classList.add('victory');
              await sleep(244000);
              victory.pause();
              display.innerText = '0';
              display.classList.remove('victory')
            }
          }
  
          await sleep(1000);
        }
      }
  }
  
  function reset() {
    switchDisplayNotLaunched.hidden = false;
    switchDisplayLaunched.hidden = true;
    timerStruct = [];
    currentTimingStruct = {
      idTiming: 0,
      remainingTiming: 0
    }
  }
  
  /* UTILS */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
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
  