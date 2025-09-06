// AI Prediction System
let metroPredictor = null;

// Function to load AI predictions
async function loadAIPredictions() {
    try {
        const response = await fetch('metro_predictions.json');
        metroPredictor = await response.json();
        console.log('🤖 AI loaded! Ready to predict delays');
        return true;
    } catch (error) {
        console.error('❌ Failed to load AI:', error);
        return false;
    }
}

// Function to get AI prediction
function getSmartDelay(line, hour, weather = "Clear", holiday = "No", event = "None") {
    const key = `${line}_${hour}_${weather}_${holiday}_${event}`;
    
    if (metroPredictor && metroPredictor[key]) {
        return metroPredictor[key]; // AI prediction!
    } else {
        // Fallback if AI not loaded
        let delay = 0;
        if (weather === "Rain") delay += 5;
        if (weather === "Storm") delay += 12;
        if (event !== "None") delay += 8;
        if (holiday !== "No") delay += 3;
        return Math.max(0, delay);
    }
}

// Function to get current conditions (you can make this dynamic later)
function getCurrentConditions() {
    // For now, return some realistic conditions
    // You can later connect this to weather API or user input
    const conditions = [
        { weather: "Clear", holiday: "No", event: "None" },
        { weather: "Rain", holiday: "No", event: "None" },
        { weather: "Cloudy", holiday: "No", event: "None" },
        { weather: "Clear", holiday: "No", event: "Stadium Match" },
        { weather: "Clear", holiday: "Festival", event: "None" }
    ];
    
    // For now, pick a random condition (or you can make it always "Clear")
    return conditions[Math.floor(Math.random() * conditions.length)];
}

// Original Metro Data System
let metroData;

// Load both JSON files when page starts
document.addEventListener('DOMContentLoaded', function() {
    loadAIPredictions(); // Load AI
    loadMetroData();     // Load your original data
});

function loadMetroData() {
    fetch("data.json")
      .then(res => res.json())
      .then(data => {
        metroData = data;
        
        // 🤖 ENHANCE YOUR EXISTING TRAINS WITH AI PREDICTIONS
        enhanceTrainsWithAI();
        
        setupStations();
      })
      .catch(err => console.error("Error loading JSON:", err));
}

// 🚀 NEW FUNCTION: Add AI predictions to your existing train data
function enhanceTrainsWithAI() {
    if (!metroData || !metroData.trains) return;
    
    console.log('🤖 Enhancing trains with AI predictions...');
    
    for (const line in metroData.trains) {
        metroData.trains[line].forEach(train => {
            // Get train hour
            const [hour, minute] = train.time.split(":").map(Number);
            
            // Get current conditions
            const conditions = getCurrentConditions();
            
            // Get AI prediction for this train
            const aiDelay = getSmartDelay(
                line, 
                hour, 
                conditions.weather, 
                conditions.holiday, 
                conditions.event
            );
            
            // Update train delay with AI prediction
            train.delay = Math.round(aiDelay);
            
            // Update train status based on AI delay
            if (train.delay === 0) {
                train.status = "On Time";
            } else if (train.delay <= 5) {
                train.status = "Minor Delay";
            } else if (train.delay <= 15) {
                train.status = "Delayed";
            } else {
                train.status = "Major Delay";
            }
            
            // Store conditions for display
            train.conditions = conditions;
        });
    }
    
    console.log('✅ Trains enhanced with AI predictions!');
}

// Your existing functions (unchanged)
function setupStations() {
  const fromSelect = document.getElementById("source");
  const toSelect = document.getElementById("destination");

  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";

  for (const line in metroData.lines) {
    let groupFrom = document.createElement("optgroup");
    groupFrom.label = line + " Line";

    let groupTo = document.createElement("optgroup");
    groupTo.label = line + " Line";

    metroData.lines[line].stations.forEach(station => {
      let opt1 = document.createElement("option");
      opt1.value = station;
      opt1.textContent = station;
      groupFrom.appendChild(opt1);

      let opt2 = document.createElement("option");
      opt2.value = station;
      opt2.textContent = station;
      groupTo.appendChild(opt2);
    });

    fromSelect.appendChild(groupFrom);
    toSelect.appendChild(groupTo);
  }
}

document.getElementById("findBtn").addEventListener("click", findRoute);

// 🚀 ENHANCED: Your findRoute function with AI predictions
function findRoute() {
  const from = document.getElementById("source").value;
  const to = document.getElementById("destination").value;

  const futureTime = document.getElementById("futureTime").value;
  const resultDiv = document.getElementById("result");

  if (!from || !to || from === to) {
    resultDiv.textContent = "⚠️ Please select two different stations.";
    return;
  }

  // figure out lines
  let transfer = false;
  let fromLine = null, toLine = null;
  for (const line in metroData.lines) {
    if (metroData.lines[line].stations.includes(from)) fromLine = line;
    if (metroData.lines[line].stations.includes(to)) toLine = line;
  }
  if (fromLine && toLine && fromLine !== toLine) transfer = true;

  // check time (future or now)
  let checkMinutes;
  if (futureTime) {
    const [h, m] = futureTime.split(":").map(Number);
    checkMinutes = h * 60 + m;
  } else {
    const now = new Date();
    checkMinutes = now.getHours() * 60 + now.getMinutes();
  }

  // trains for chosen line
  const trains = metroData.trains[fromLine];
  let nextTrain = null;
  for (let t of trains) {
    let [h, m] = t.time.split(":").map(Number);
    let tMinutes = h * 60 + m;
    if (tMinutes >= checkMinutes) {
      nextTrain = t;
      break;
    }
  }

  if (!nextTrain) {
    resultDiv.textContent = "⏳ No trains after this time.";
    return;
  }

  // 🤖 ENHANCED: Better delay text with AI predictions
  let delayText = "";
  let delayIcon = "";
  if (nextTrain.delay === 0) {
    delayText = "On schedule ✅";
    delayIcon = "✅";
  } else if (nextTrain.delay > 0) {
    delayText = `Expected delay ~${nextTrain.delay} minutes ⏰`;
    delayIcon = nextTrain.delay <= 5 ? "⚠️" : "❌";
  } else {
    delayText = `Expected ~${Math.abs(nextTrain.delay)} minutes early 🚀`;
    delayIcon = "🚀";
  }

  // 🤖 ENHANCED: Show AI conditions if available
  let conditionsText = "";
  if (nextTrain.conditions) {
    const c = nextTrain.conditions;
    conditionsText = `
      <p><small><strong>Current Conditions:</strong> ${c.weather} weather, ${c.holiday === "No" ? "Regular day" : c.holiday}, ${c.event === "None" ? "No events" : c.event}</small></p>
    `;
  }

  // 🚀 ENHANCED: Better result display
  resultDiv.innerHTML = `
    <div class="route-result">
      <h3>${delayIcon} Route: ${from} → ${to}</h3>
      <div class="train-info">
        <p><strong>Line:</strong> ${fromLine} Line ${transfer ? "(Change at Majestic 🚉)" : ""}</p>
        <p><strong>Next Train:</strong> ${nextTrain.time}</p>
        <p><strong>Status:</strong> <span class="status-${nextTrain.status.toLowerCase().replace(' ', '-')}">${nextTrain.status}</span></p>
        <p><strong>Timing:</strong> ${delayText}</p>
        <p><strong>Crowd Level:</strong> ${nextTrain.crowd}</p>
        <p><strong>Towards:</strong> ${nextTrain.destination}</p>
        ${conditionsText}
      </div>
    </div>
  `;
}

// 🚀 BONUS: Add a function to manually predict delays
function predictCustomDelay() {
    const line = document.getElementById("source").value.includes("Purple") ? "Purple" : "Green";
    const hour = new Date().getHours();
    
    // You can add form inputs for these later
    const weather = "Clear";  // Could be from weather API
    const holiday = "No";     // Could be from calendar API
    const event = "None";     // Could be from events API
    
    const prediction = getSmartDelay(line, hour, weather, holiday, event);
    
    console.log(`🤖 Custom prediction for ${line} line at ${hour}:00: ${prediction} minutes delay`);
    return prediction;
}

// 🚀 BONUS: Test function (call from browser console)
function testAI() {
    console.log('🧪 Testing AI predictions...');
    
    const tests = [
        ["Purple", 8, "Rain", "No", "None"],
        ["Green", 18, "Clear", "Festival", "Stadium Match"],
        ["Purple", 12, "Storm", "No", "Maintenance"]
    ];
    
    tests.forEach(([line, hour, weather, holiday, event]) => {
        const delay = getSmartDelay(line, hour, weather, holiday, event);
        console.log(`🚇 ${line} at ${hour}:00, ${weather} → ${delay} min delay`);
    });
}