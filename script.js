let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`/${folder}/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let element of as) {
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
            }
        }

        // Show all the songs in the playlist
        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";
        for (const song of songs) {
            songUL.innerHTML += `<li>
                                    <img class="invert" width="34" src="music.svg" alt="">
                                    <div class="info">
                                        <div>${song}</div>
                                        <div>Artist</div>
                                    </div>
                                    <div class="playnow">
                                        <span>Play Now</span>
                                        <img class="invert" src="play.svg" alt="">
                                    </div>
                                </li>`;
        }

        // Attach an event listener to each song
        document.querySelectorAll(".songList li").forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info > div:first-child").innerHTML.trim());
            });
        });

        return songs;
    } catch (error) {
        console.error('Error fetching songs:', error);
        return [];
    }
}

function playMusic(track, pause = false) {
    currentSong.src = `/${currFolder}/` + encodeURIComponent(track);
    if (!pause) {
        currentSong.play();
        document.querySelector("#play").src = "pause.svg";
    }
    document.querySelector(".songinfo").textContent = track;
    document.querySelector(".songtime").textContent = "00:00 / 00:00";
}

async function displayAlbums() {
    try {
        let response = await fetch(`/songs/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");

        for (let e of anchors) {
            if (e.href.includes("/songs") && !e.href.endsWith(".mp3")) {
                let folder = e.href.split("/").slice(-2)[0];
                cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                                                <div class="play">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                        xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                                            stroke-linejoin="round" />
                                                    </svg>
                                            </div>`;
            }
        }

        // Load the playlist whenever card is clicked
        document.querySelectorAll(".card").forEach(e => {
            e.addEventListener("click", async () => {
                songs = await getSongs(`songs/${e.dataset.folder}`);
                playMusic(songs[0]);
            });
        });
    } catch (error) {
        console.error('Error displaying albums:', error);
    }
}

function setupEventListeners() {
    // Attach an event listener to play/pause button
    document.querySelector("#play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.querySelector("#play").src = "pause.svg";
        } else {
            currentSong.pause();
            document.querySelector("#play").src = "play.svg";
        }
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").textContent = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Add an event listener to previous
    document.querySelector("#previous").addEventListener("click", () => {
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").slice(-1)[0]));
        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Add an event listener to next
    document.querySelector("#next").addEventListener("click", () => {
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").slice(-1)[0]));
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        }
    });

    // Add an event listener to volume range
    document.querySelector(".range input").addEventListener("input", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        document.querySelector(".volume>img").src = currentSong.volume > 0 ? "volume.svg" : "mute.svg";
    });

    // Add an event listener to mute/unmute
    document.querySelector(".volume>img").addEventListener("click", (e) => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

// Get the list of all the songs
async function main() {
    await getSongs("songs/ncs");
    playMusic(songs[0], true);

    // Display all the albums in the page
    await displayAlbums();

    // Set up all event listeners
    setupEventListeners();
}

window.addEventListener('load', main);
