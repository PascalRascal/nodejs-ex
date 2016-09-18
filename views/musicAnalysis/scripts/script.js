/* global SpotifyWebApi */
/*
  The code for finding out the BPM / tempo is taken from this post:
  http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio/
 */

/* TODO List
 * 1. Improve Visualization
 * 2. Ability to adjust algorithm options in the browser
 * 3. Improve Performance or at least add a loading bar or something
 */


var queryInput = document.querySelector('#query'),
    result = document.querySelector('#result'),
    text = document.querySelector('#text'),
    audioTag = document.querySelector('#audio')
    audioPreview = document.getElementById('musicPreview'),
    fileList = document.getElementById("fileList"),
    omniButton = document.getElementById("omniButton"),
    omniButtonIcon = document.getElementById("omniButtonIcon"),
    omniButtonPrompt = document.getElementById("omniButtonPrompt");
var totalSongSize = 0;
var renderedBuffer;
var originalSongBuffer;
var fileUpload = document.getElementById("drop_zone");
var songs = [];
var songsAnalyzed = 0;
var oldSection;
var songIndex = 0;
var wordsForUser = document.getElementById("wordsForUser");
var wordsOfEncouragement = ["GO", "KEEP IT UP", "GO HAM", "DIG DEEP", "FASTER STRONGER HARDER", "GOGOGOGOGO", "YOU GOT THIS", "PIERCE THE HEAVENS", "YOU'RE A MANIAC", "LEAVE MANKIND BEHIND"];
var wordsOfResting = ["Take a breather", "Enjoy the song", "Get hyped and get ready", "You're doing great", "Get ready", "Round ??? coming up!"];
var myVisualizer;

omniButton.mode = "fileUpload"

function randomWord(words){
    var rand = Math.floor(Math.random() * words.length);
    return words[rand];
}

//Controls for the Omni-Button
omniButton.addEventListener("click", function (ev) {
    if (omniButton.mode === "generateWorkout") {
        uploadFunction();
    } else if (omniButton.mode === "startWorkout") {
        playBack();
    }
})

//Show the user what files they chose
function updateFileList() {
    for (var i = 0; i < fileUpload.files.length; i++) {
        renderFile(fileUpload.files[i]);
    }


    omniButtonIcon.classList = "fa fa-cog omniButtonIconNoVisualization";
    omniButton.mode = "generateWorkout";
    omniButtonPrompt.innerHTML = "Analyze Your Awesome Songs"
    fileUpload.classList += " hidden";

}

//Shows a file to the user
function renderFile(file) {
    var fileDiv = document.createElement("div");
    fileDiv.classList = "fileEntry text-center";
    fileDiv.innerHTML = `
        <h3> ` + file.name.slice(0, file.name.length - 4) + `<h3>
    `
    fileList.appendChild(fileDiv);
}
//Keep track of URLs created so we can delete them later if necessary
var sectionURLs = [];

//Displays the Files Uploaded to the user
function updateProgressState() {
    if (audioTag.paused) {
        return;
    }
    var progressIndicator = document.querySelector('#progress');
    if (progressIndicator && audioTag.duration) {
        document.getElementById("durationTracker").innerHTML = Math.floor(audioTag.currentTime) + " / " + audioTag.duration;
        progressIndicator.setAttribute('x', (audioTag.currentTime * 100 / audioTag.duration) + '%');
    }
    var currentSection = checkSection(audioTag.currentTime, songs[songIndex].analyzedData.sections);

    console.log(currentSection.start);
    if (currentSection != oldSection) {
        var sectionAnalysis = document.getElementById("sectionAnalysis");
        if(currentSection.intensityDeviation > 1){
            console.log("Color Changed");
            startTransition(hex2Rgb(myVisualizer.barColor), hex2Rgb("#F2003C"), myVisualizer);
            wordsForUser.innerHTML = randomWord(wordsOfEncouragement);
        }
        if(currentSection.intensityDeviation < 1){
            console.log("Color Changed");
            startTransition(hex2Rgb(myVisualizer.barColor), hex2Rgb("#273430"), myVisualizer);
            wordsForUser.innerHTML = randomWord(wordsOfResting);
        }
        if(currentSection.intensityDeviation < 0){
            console.log("Color Changed");
            startTransition(hex2Rgb(myVisualizer.barColor), hex2Rgb("#194884"), myVisualizer);
            wordsForUser.innerHTML = randomWord(wordsOfResting);
        }
        sectionAnalysis.innerHTML = '';
        drawSection(currentSection, currentSection.index);
        console.log("Section Changed!");
        oldSection = currentSection;
    }

    requestAnimationFrame(updateProgressState);
}

audioTag.addEventListener('play', updateProgressState);
audioTag.addEventListener('playing', updateProgressState);
audioTag.addEventListener('ended', switchSongs);
function switchSongs() {

    songIndex++;
    if (songs[songIndex]) {
        console.log("Switching Song");
        audioTag.src = songs[songIndex].songObjectURL
        audioTag.load();
        audioTag.play();
    }


}

function switchSongsWithIndex(index){

}

function updatePlayLabel() {
    
}

audioTag.addEventListener('play', updatePlayLabel);
audioTag.addEventListener('playing', updatePlayLabel);
audioTag.addEventListener('pause', updatePlayLabel);
function playBack() {
    if (audioTag.paused) {
        audioTag.play();
        
        omniButtonIcon.classList = "fa fa-pause omniButtonIconVisualization";
    } else {
        audioTag.pause();
        omniButtonIcon.classList = "fa fa-play omniButtonIconVisualization";
    }
}



result.style.display = 'none';

//Trims the data and removes any irrelevant meta-data, also gets the sampling rate about the song
function handleArrayBuffer(musicArrayBuffer, currentSong) {
    omniButtonIcon.classList = "fa fa-cog fa-spin omniButtonIconNoVisualization"
    omniButtonPrompt.innerHTML = "Analyzing Your Awesome Songs"


    var musicDataView = new DataView(musicArrayBuffer);

    var frameCount = 0;
    var tagIndex = 0;
    var sampleCount = 0;

    var frameType = mp3Parser.readTags(musicDataView)[0]._section.type;

    //Skips any frames at the start that dont contain music data
    var frameType = mp3Parser.readTags(musicDataView)[0]._section.type;
    while (frameType != "frame") {
        tagIndex++;
        frameType = mp3Parser.readTags(musicDataView)[tagIndex]._section.type
    }
    console.log(mp3Parser.readTags(musicDataView)[tagIndex])
    var samplingRate = mp3Parser.readTags(musicDataView)[tagIndex].header.samplingRate
    currentSong.samplingRate = samplingRate;

    var mp3tags = mp3Parser.readTags(musicDataView)[tagIndex];
    while (true) {
        if (mp3tags._section.type === 'frame') {
            frameCount++;
            sampleCount = sampleCount + mp3tags._section.sampleLength;
        } else {
            //If it doesnt contain music data? TRASH IT!
            musicArrayBuffer.splice(mp3tags._section.nextFrameIndex - mp3tags._section.sampleLength, mp3tags_section.nextFrameIndex);
        }
        mp3tags = mp3Parser.readFrame(musicDataView, mp3tags._section.nextFrameIndex);
        if (mp3tags == null) {
            break;
        }
    }
    //Clear up memory
    musicDataView = null;
    //Put the data into the audiotag

    currentSong.musicArrayBuffer = musicArrayBuffer;
    var songBlob = new Blob([musicArrayBuffer], { type: "audio/mpeg3" });
    currentSong.songObjectURL = window.URL.createObjectURL(songBlob);

    getMusicData(musicArrayBuffer, sampleCount, samplingRate, currentSong);
    songs.push(currentSong);

    //Clear up memory
    musicArrayBuffer = null;

}

//Loads the trimmed audio-data and filters it appropiately before analyzing it
var getMusicData = function (musicArrayBuffer, songsize, samplingRate, currentSong) {
    var musicDataView = new DataView(musicArrayBuffer);



    //The song sampling rate
    //TODO: Reimpliment this being dynamic

    //TODO: Impliment mp3-parser to get total frames, should be fun! ^_^
    //kill me
    var samplingRate = samplingRate;


    // Create offline context
    var OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    var offlineContext = new OfflineContext(2, songsize, samplingRate);

    offlineContext.decodeAudioData(musicArrayBuffer, function (buffer) {

        // Create buffer source
        var source = offlineContext.createBufferSource();
        source.buffer = buffer;

        // Beats, or kicks, generally occur around the 100 to 150 hz range.
        // Below this is often the bassline.  So let's focus just on that.

        // First a lowpass to remove most of the song.

        var lowpass = offlineContext.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 150;
        lowpass.Q.value = 1;

        // Run the output of the source through the low pass.

        source.connect(lowpass);

        // Now a highpass to remove the bassline.

        var highpass = offlineContext.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 100;
        highpass.Q.value = 1;

        // Run the output of the lowpass through the highpass.

        lowpass.connect(highpass);

        // Run the output of the highpass through our offline context.

        highpass.connect(offlineContext.destination);

        // Start the source, and render the output into the offline conext.

        source.start(0);
        offlineContext.startRendering();
    });

    offlineContext.oncomplete = function (e) {
        var userPPS = document.getElementById("userPPS").value;
        var userSectionMargin = document.getElementById("userSectionMargin").value;

        var analysisOptions = { partsPerSecond: userPPS, sectionMargin: userSectionMargin };

        var renderedBuffer = e.renderedBuffer;
        analyzeSong([renderedBuffer.getChannelData(0), renderedBuffer.getChannelData(1)], samplingRate, analysisOptions, currentSong, showWorkOut);
    };
};

//
function showWorkOut(currentSong) {
    var totalDeviation = 0;
    var maximumDeviation = 0;
    if (isProcessingDone()) {
        console.log("All songs have been processed!");
        myVisualizer = _createVisualizer({});
        myVisualizer.renderFrame();
        console.log(songs);
        result.style.display = 'block';
        omniButtonIcon.classList = "fa fa-play omniButtonIconVisualization";
        omniButtonPrompt.innerHTML = "Ready to go HAM"
        omniButton.mode = "startWorkout";
        oldSection = songs[songIndex].analyzedData.sections[0];
        audioTag.src = songs[0].songObjectURL
    }
    polishSections(currentSong);
    currentSong.analyzedData.sections.forEach(function(section,index){
        section.index = index;
    });



}


//Analyzes the song data, calls cb when done
function analyzeSong(songData, samplingRate, songOptions, currentSong, cb) {
    var pps;
    var sm;
    if (songOptions.peaksPerSecond) {
        pps = peaksPerSecond;
    } else {
        pps = 2;
    }
    if (songOptions.sectionMargin) {
        sm = songOptions.sectionMargin
    } else {
        sm = 1.5;
    }
    console.log(sm);

    var worker = new Worker(URL.createObjectURL(new Blob(["(" + worker_function.toString() + ")()"], { type: 'text/javascript' })));

    var workerPeaks;
    var workerSongData;

    worker.addEventListener('message', function (e) {
        var data = e.data;
        if (data.returnType == "peaks") {
            workerPeaks = data.peaks;
            workerSongData = data.songData
            getWorkerSections(workerSongData, workerPeaks, data.samplingRate, sm);
        } else if (data.returnType == "sections") {
            var sections = data.sections;
            currentSong.analyzedData.sections = data.sections;
            currentSong.analyzedData.peaks = workerPeaks;
            cb(currentSong);
        }
    }, false);

    function getWorkerPeaks(songData, samplingRate, peaksPerSecond) {
        worker.postMessage({ 'cmd': 'getPeaks', 'songData': songData, 'samplingRate': samplingRate, 'peaksPerSecond': peaksPerSecond });
    }

    function getWorkerIntervals(peaks, samplingRate, sm) {
        worker.postMesssage({ 'cmd': 'getIntervals', 'peaks': peaks, 'samplingRate': samplingRate, 'sectionMargin': sm });
    }

    function getWorkerSections(songData, peaks, samplingRate) {
        worker.postMessage({ 'cmd': 'getSections', 'peaks': peaks, 'samplingRate': samplingRate, 'songData': songData, 'sectionMargin': sm });
    }


    getWorkerPeaks(songData, samplingRate, pps);


}


//Loads and analyzes user file
var uploadFunction = function () {
    var fileList = [];
    for (var i = 0; i < fileUpload.files.length; i++) {
        fileList.push(fileUpload.files[i]);
    }

    fileList.forEach(function (file, index) {
        var musicFile = file;
        var currentSong = new song(musicFile.name, index);


        //Read the user file into a format that can we can work with, an array buffer
        var arrayBufferReader = new FileReader();
        arrayBufferReader.onload = function () {
            handleArrayBuffer(arrayBufferReader.result, currentSong);
            //Clear up memory
            arrayBufferReader = null;
        }

        arrayBufferReader.readAsArrayBuffer(musicFile);

    });

}

//Loads and analyzes the example song
function getExampleAudio() {
    loadExampleSong('FuriousFreak.mp3', 0);
    fileUpload.classList = "hidden";
}
//Maybe? Have to load multiple songs
function loadExampleSong(songName, index) {
    var xhr = new XMLHttpRequest();
    var currentSong = new song(songName, index)
    xhr.open('GET', window.location.href + '/exampleSongs/' + songName, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function (e) {
        handleArrayBuffer(this.response, currentSong);
    }
    xhr.send();
}
var song = function (title, index) {
    this.title = title;
    this.songIndex = index;
    this.analyzedData = {};
}

function isProcessingDone() {
    for (var i = 0; i < songs.length; i++) {
        if (!songs[i].analyzedData.sections) {
            return false;
        }
    }
    return true;
}

//Combines two sections
//Assume that i < j
function combineSection(i, j, sections) {
    if (sections[i] && sections[j]) {
        console.log("Starting to slice the sections")
        //Combine the easy things
        var newStart = sections[i].start;
        var newEnd = sections[j].end;
        var duration = sections[i].duration + sections[j].duration;
        var length = sections[i].length + sections[j].length;

        //Combine Peaks
        Array.prototype.push.apply(sections[i].peaks, sections[j].peaks);

        var standardDeviation = ((sections[i].stdDev * sections[i].duration) + (sections[j].stdDev * sections[j].duration)) / duration;
        var averageVolume = ((sections[i].avgVolume * sections[i].duration) + (sections[j].avgVolume * sections[j].duration)) / duration;

        sections[i].start = newStart
        sections[i].end = newEnd;
        sections[i].duration = duration;
        sections[i].length = length;
        sections[i].stdDev = standardDeviation;
        sections[i].avgVolume = averageVolume;
        sections[i].intensity = sections[i].peaks.length / duration;
        sections.splice(j, 1);
    }
}



function drawSection(section, index) {
    sectionDiv = document.createElement("div");
    sectionDiv.addEventListener("click", function () {
        audioTag.currentTime = section.start / section.samplingRate;
        console.log(section);
    })
    sectionDiv.className = "songSection";
    sectionDiv.innerHTML = `
        <h3> Section ` + index + `</h3>
        <br>
        <b>IntensityDeviation: ` + section.intensityDeviation + `</b> <br>
        <b>Peaks: ` + section.peaks.length + `</b> <br>
        <b>Duration: ` + section.duration + `</b> <br>
        <b>Start: ` + section.start / section.samplingRate + `</b> <br>
    `
    sectionDiv.style.backgroundColor = section.color;
    document.getElementById("sectionAnalysis").appendChild(sectionDiv);
}
//Get standardDeviation of intensity of sections
function getStandardDev(data, dataAvg) {
    var summation = 0;
    if (dataAvg) {
        for (var i = 0; i < data.length; i++) {
            item = data[i];
            summation = summation + ((item.intensity - dataAvg) * (item.intensity - dataAvg));
        }
    }
    return Math.sqrt(summation / data.length);
}

function checkSection(currentTime, sections) {
    var currentSection = sections[0];
    for (var i = 0; i < sections.length; i++) {
        if (currentTime >= ((sections[i].start / sections[i].samplingRate))) {
            currentSection = sections[i];
        }
    }
    return currentSection;
}

function polishSections(currentSong) {
    for (var i = 0; i < currentSong.analyzedData.sections.length; i++) {
        var currentSection = currentSong.analyzedData.sections[i];
        currentSection.intensity = currentSection.peaks.length / currentSection.duration;
    }
    //Combines sections of they are too short
    //Skips the first and last section
    for (var i = 1; i < currentSong.analyzedData.sections.length - 1; i++) {
        var currentSection = currentSong.analyzedData.sections[i];
        if (currentSection.duration < 3) {
            //If the intensity is closer to the next section, then merge them AND its not the last section
            if ((Math.abs(currentSection.intensity - currentSong.analyzedData.sections[i + 1].intensity) > Math.abs(currentSection.intensity - currentSong.analyzedData.sections[i - 1].intensity))) {
                combineSection(i, i + 1, currentSong.analyzedData.sections);
            } else {
                combineSection(i - 1, i, currentSong.analyzedData.sections);
                i--;
            }
        }
    }
    for (var i = 1; i < currentSong.analyzedData.sections.length - 1; i++) {
        var currentSection = currentSong.analyzedData.sections[i];
        if (currentSection.duration < 3) {
            //If the intensity is closer to the next section, then merge them AND its not the last section
            if ((Math.abs(currentSection.intensity - currentSong.analyzedData.sections[i + 1].intensity) > Math.abs(currentSection.intensity - currentSong.analyzedData.sections[i - 1].intensity))) {
                combineSection(i, i + 1, currentSong.analyzedData.sections);
            } else {
                combineSection(i - 1, i, currentSong.analyzedData.sections);
                i--;
            }
        }
    }

    for (var i = 0; i < currentSong.analyzedData.sections.length; i++) {
        var currentSection = currentSong.analyzedData.sections[i];
    }
    var totalIntensity = 0;
    currentSong.analyzedData.sections.forEach(function (section) {
        totalIntensity = totalIntensity + section.intensity;
    });
    var avgIntensity = totalIntensity / currentSong.analyzedData.sections.length;
    console.log("Average Intensity: " + avgIntensity);
    var intensityDev = getStandardDev(currentSong.analyzedData.sections, avgIntensity);
    currentSong.analyzedData.sections.forEach(function (section, index) {
        section.intensityDeviation = (section.intensity - avgIntensity) / intensityDev;
    });

}






