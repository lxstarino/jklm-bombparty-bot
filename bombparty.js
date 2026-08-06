if (document.getElementById("bp-gui")) {
    document.getElementById("bp-gui").remove();
}

let auto_insert_word = true
let write_speed = 150

const gui = document.createElement("div");
gui.id = "bp-gui";
gui.style.cssText = `
    position: fixed;
    top: 15px;
    right: 15px;
    z-index: 99999;
    background: rgba(20, 20, 25, 0.9);
    backdrop-filter: blur(10px);
    color: #fff;
    padding: 12px 16px;
    border-radius: 10px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    min-width: 210px;
    user-select: none;
`;

gui.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; color: #fff;">BombParty Bot</div>
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <label for="bp-auto-insert" style="cursor: pointer; color: #ddd;">Auto Insert:</label>
        <input type="checkbox" id="bp-auto-insert" checked style="cursor: pointer;">
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <label for="bp-write-speed" style="color: #ddd;">Write Speed (ms):</label>
        <input type="number" id="bp-write-speed" value="150" min="0" max="1000" style="width: 60px; background: #2a2a30; color: #fff; border: 1px solid #444; border-radius: 4px; padding: 2px 5px; text-align: center;">
    </div>
    <div style="margin-top: 8px; font-size: 12px; color: #aaa; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px;">
        Current Word: <span id="bp-current-word" style="color: #ffffff; font-weight: bold;">-</span>
    </div>
`;

document.body.appendChild(gui);

const autoInsertCb = document.getElementById("bp-auto-insert");
autoInsertCb.addEventListener("change", (e) => {
    auto_insert_word = e.target.checked;
});

const writeSpeedInput = document.getElementById("bp-write-speed");
writeSpeedInput.addEventListener("input", (e) => {
    write_speed = parseInt(e.target.value) || 0;
});

const currentWordEl = document.getElementById("bp-current-word");

let updateInt = setInterval(async function () {
    let selfTurn = document.getElementsByClassName("selfTurn")[0] ? window.getComputedStyle(document.getElementsByClassName("selfTurn")[0]).display : null
    if (selfTurn == "none") return

    let round = document.getElementsByClassName("round")[0] ? window.getComputedStyle(document.getElementsByClassName("round")[0]).display : null
    let syllable = document.getElementsByClassName("syllable")[0] ? document.getElementsByClassName("syllable")[0].innerText + " " : null
    console.log("Fetch new syllable text:" + syllable)

    if (!round || !syllable || !selfTurn) {
        console.warn("Some Elements are missing! Search in browser console for:\n" +
            "- Round: " + (round ? 'Found' : "<div class='round'></div> not found") +
            "\n- Syllable: " + (syllable ? 'Found' : "<div class='syllable'></div> not found") +
            "\n- SelfTurn: " + (selfTurn ? 'Found' : "<div class='selfTurn'></div> not found"))

        return clearInterval(updateInt)
    }

    let dictionary = await fetchWord(syllable)
    if (dictionary && dictionary.status != 200 || dictionary && dictionary.word == null) {
        return console.error(`An error occured while fetching word from dictionary API.\nStatus Code: ${dictionary.status}`)
    }
    console.log("Found Word:" + dictionary.word)
    if (currentWordEl) currentWordEl.innerText = dictionary.word

    if (auto_insert_word) {
        splitted_word = dictionary.word.split("")
        for (let i = 0; i < splitted_word.length; i++) {
            type_speed = Math.round(Math.random() * write_speed)

            await sleep(type_speed)
            wordInput.value += splitted_word[i]
            let event = new Event('input', { bubbles: true })
            wordInput.dispatchEvent(event)
        }

        socket.emit("setWord", wordInput.value.trim(), true)
        wordInput.value = ""
    }
}, 2800)

async function fetchWord(letters) {
    try {
        let response = await fetch('https://api.yourdictionary.com/wordfinder/v1/wordlist?contains=' + letters + '&limit=25&offset=0&order_by=score&group_by=word_length&has_definition=check&suggest_links=true&dictionary=WWF')
        let res = await response.json()

        let num1 = Math.floor(Math.random() * res.data._groups.length)
        let num2 = Math.floor(Math.random() * res.data._groups[num1]._items.length)

        return { status: res.status, word: res.data._groups[num1]._items[num2] }
    } catch {
        console.error("An error occured while fetching word from dictionary API")
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}