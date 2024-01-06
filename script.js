const startBtn = document.getElementById("startRecordingBtn");
const stopBtn = document.getElementById("stopRecordingBtn");
const videoContainer = document.getElementById("videoContainer");
const recordedVideo = document.getElementById("recordedVideo");
const downloadLink = document.getElementById("downloadLink");
let mediaRecorder;
let recordedChunks = [];

const uploadEndpoint = 'http://localhost:3000/upload'; // Update with your server URL

startBtn.addEventListener("click", startRecording);
stopBtn.addEventListener("click", stopRecording);
downloadLink.addEventListener("click", saveToDatabase);

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: "screen", width: 1280, height: 720 },
            audio: true
        });

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            recordedVideo.src = url;
            videoContainer.style.display = "block";
            downloadLink.href = url;
            downloadLink.style.display = "block";

            console.log("Video recording complete! You can now download the video.");
        };

        startBtn.disabled = true;
        stopBtn.disabled = false;

        mediaRecorder.start();
    } catch (err) {
        console.error("Error accessing screen and microphone: ", err);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

async function saveToDatabase() {
    if (!recordedChunks.length) {
        console.log("No recorded video available.");
        alert("No recorded video available.");
        return;
    }

    const formData = new FormData();
    formData.append('video', new Blob(recordedChunks, { type: 'video/webm' }));

    try {
        const response = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Assuming data contains the video URL returned from the server
        const videoUrl = data.videoUrl;

        console.log(data);
        alert("Video recorded and uploaded successfully!");
    } catch (error) {
        console.error(error.message);
    }
}
