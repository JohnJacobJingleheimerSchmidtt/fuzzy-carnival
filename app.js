import express from 'express';
import OpenAI from "openai";
import fetch from 'node-fetch';

const app = express();

// --- 1. CONFIGURATION ---
// Replace with your actual keys
const SAMBANOVA_API_KEY = "6a90c8f4-e563-4fe4-be89-550c66024fef"; 
const WAQI_TOKEN = "f1c59ef351d2e4cf906174a4a46dbd3633f4a2ab"; 
const WEATHER_API_KEY = "75cc65105421a699a2aad332d7188f96";

const sambanova = new OpenAI({
    apiKey: SAMBANOVA_API_KEY,
    baseURL: "https://api.sambanova.ai/v1",
});

app.use(express.json({ limit: '50mb' }));

// --- 2. THE AURA DASHBOARD (FRONTEND) ---
app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SambaNova Aura | UAE Smart Monitor</title>
    <style>
        :root { --primary: #10b981; --bg: #f8fafc; --text: #1e293b; --card: #ffffff; --accent: #64748b; }
        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: auto; }

        /* Aura Professional Header */
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .brand { display: flex; align-items: center; gap: 8px; }
        .brand-ring { width: 12px; height: 12px; border: 2.5px solid var(--primary); border-radius: 50%; }
        .loc-badge { display: flex; align-items: center; gap: 6px; background: #e2e8f0; padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; color: var(--accent); }
        .pulse { width: 7px; height: 7px; background: #ef4444; border-radius: 50%; animation: blink 1.5s infinite; }

        /* Main Data Card */
        .aura-card { background: var(--card); border-radius: 32px; padding: 40px 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; text-align: center; margin-bottom: 20px; }
        .aqi-val { font-size: 8rem; font-weight: 300; margin: 0; letter-spacing: -5px; line-height: 1; }
        .aqi-bar { height: 6px; background: linear-gradient(to right, #009966, #ffde33, #ff9933, #cc0033); border-radius: 10px; margin: 30px 0 10px 0; }
        
        /* Navigation */
        .nav-tabs { display: flex; gap: 10px; margin-bottom: 25px; background: #e2e8f0; padding: 5px; border-radius: 50px; }
        .tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; border-radius: 50px; font-size: 0.8rem; font-weight: bold; color: var(--accent); transition: 0.3s; }
        .tab.active { background: var(--text); color: white; }

        /* Scanner Section (Back Camera Fix Applied) */
        .scanner-view { width: 100%; aspect-ratio: 1; background: #000; border-radius: 28px; overflow: hidden; position: relative; border: 1px solid #cbd5e1; }
        video, img { width: 100%; height: 100%; object-fit: cover; transform: scaleX(1); } 
        
        .btn { border: none; padding: 16px; border-radius: 18px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 15px; font-size: 0.9rem; }
        .btn-dark { background: var(--text); color: white; }
        .btn-outline { background: white; border: 1px solid #e2e8f0; color: var(--text); }

        #res-box { background: #f1f5f9; padding: 20px; border-radius: 20px; margin-top: 15px; display: none; text-align: right; line-height: 1.6; border-right: 5px solid var(--primary); }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .page { display: none; }
        .page.active { display: block; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header-top">
            <div class="brand"><span class="brand-ring"></span><div style="font-weight:900; font-size:1.2rem;">Aura</div></div>
            <div class="loc-badge"><span class="pulse"></span><span id="locName">GPS SCANNING...</span></div>
        </div>

        <!-- Weather Greeting -->
        <div style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
            <h2 id="greet" style="font-weight: 400; font-size: 1.5rem; margin: 0; max-width: 65%;">Calibrating sensors...</h2>
            <div style="text-align: left; font-size: 0.8rem; color: var(--accent);">
                TEMP <span style="color: var(--text); font-weight: bold;" id="tVal">--°</span><br>
                PRESS <span style="color: var(--text); font-weight: bold;" id="pVal">-- hPa</span>
            </div>
        </div>

        <div class="nav-tabs">
            <div class="tab active" onclick="showTab('harmony', this)">LIVE READING</div>
            <div class="tab" onclick="showTab('analyzer', this)">PLANT DOCTOR</div>
        </div>

        <!-- Tab 1: Air Quality -->
        <div id="harmony" class="page active">
            <div class="aura-card">
                <div style="display:flex; align-items:baseline; justify-content:center;">
                    <h1 class="aqi-val" id="aqi">--</h1>
                    <div style="text-align:left; margin-right:15px;">
                        <div style="font-weight:bold; font-size:1.2rem;">AQI</div>
                        <div style="color:#94a3b8; font-size:0.8rem;">index</div>
                    </div>
                </div>
                <div class="aqi-bar"></div>
                <div style="margin-top: 25px; font-size: 0.75rem; color: var(--accent); font-weight: 800; letter-spacing: 1px;">
                    <span id="dot">●</span> <span id="stat">STATION CONNECTED</span>
                </div>
            </div>
            <button class="btn btn-outline" onclick="syncAura()">🔄 RE-SYNC LOCATION</button>
        </div>

        <!-- Tab 2: Plant Analyzer & File Upload -->
        <div id="analyzer" class="page">
            <div class="scanner-view">
                <video id="v" autoplay playsinline style="display:none;"></video>
                <img id="p" style="display:none;">
                <div id="ph" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:var(--accent); font-weight:bold;">Camera Ready</div>
            </div>
            
            <!-- Dual Input Options -->
            <button class="btn btn-dark" id="camBtn" onclick="toggleCamera()">📸 ACTIVATE CAMERA</button>
            <button class="btn btn-outline" onclick="document.getElementById('fileIn').click()">📁 UPLOAD FROM GALLERY</button>
            <input type="file" id="fileIn" style="display:none;" accept="image/*" onchange="handleFile(event)">
            
            <button class="btn btn-dark" id="scanBtn" onclick="doScan()" style="display:none; background: var(--primary);">🎯 ANALYZE IMAGE</button>
            
            <div id="loading" style="display:none; text-align:center; padding:15px; color:var(--primary); font-weight:bold;">SambaNova AI Analysis in progress...</div>
            <div id="res-box"></div>
        </div>

        <div style="text-align: center; margin-top: 40px; font-size: 0.6rem; color: var(--accent); letter-spacing: 1.5px; line-height: 2;">
            ENGINEERED IN THE UNITED ARAB EMIRATES<br>
            <b>AHMED MAJED • MOHAMED HASSAN • ALI SAUD • AHMED RASHED</b>
        </div>
    </div>

    <script>
        let stream;

        // Sync AQI and Weather
        async function syncAura() {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const res = await fetch(\`/api/sync?lat=\${pos.coords.latitude}&lon=\${pos.coords.longitude}\`);
                const d = await res.json();
                document.getElementById('aqi').innerText = d.aqi;
                document.getElementById('tVal').innerText = d.temp + "°";
                document.getElementById('pVal').innerText = d.press + " hPa";
                document.getElementById('locName').innerText = d.city.toUpperCase();
                document.getElementById('stat').innerText = d.status.toUpperCase();
                document.getElementById('dot').style.color = d.color;
                document.getElementById('greet').innerText = d.msg;
            });
        }

        function showTab(id, el) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            el.classList.add('active');
            if(id !== 'analyzer') stopCamera();
        }

        // Camera Logic
        async function toggleCamera() {
            if(stream) { stopCamera(); return; }
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            document.getElementById('v').srcObject = stream;
            document.getElementById('v').style.display = 'block';
            document.getElementById('p').style.display = 'none';
            document.getElementById('ph').style.display = 'none';
            document.getElementById('camBtn').innerText = "🛑 STOP CAMERA";
            document.getElementById('scanBtn').style.display = 'block';
        }

        function stopCamera() {
            if(stream) stream.getTracks().forEach(t => t.stop());
            stream = null;
            document.getElementById('v').style.display = 'none';
            document.getElementById('camBtn').innerText = "📸 ACTIVATE CAMERA";
            document.getElementById('scanBtn').style.display = 'none';
        }

        // Handle File Upload from Gallery
        async function handleFile(e) {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                const data = event.target.result;
                document.getElementById('p').src = data;
                document.getElementById('p').style.display = 'block';
                document.getElementById('ph').style.display = 'none';
                stopCamera();
                processImage(data); // Auto-analyze
            };
            reader.readAsDataURL(file);
        }

        // Capture from Live Video
        async function doScan() {
            const canvas = document.createElement('canvas');
            const v = document.getElementById('v');
            canvas.width = v.videoWidth; canvas.height = v.videoHeight;
            canvas.getContext('2d').drawImage(v, 0, 0);
            const data = canvas.toDataURL('image/jpeg');
            document.getElementById('p').src = data;
            document.getElementById('p').style.display = 'block';
            stopCamera();
            processImage(data);
        }

        // Common Analysis Logic using SambaNova
        async function processImage(base64) {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('res-box').style.display = 'none';
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ image: base64 })
            });
            const result = await res.json();
            document.getElementById('loading').style.display = 'none';
            document.getElementById('res-box').innerHTML = "<b>Aura Botanist Diagnosis:</b><br>" + result.text;
            document.getElementById('res-box').style.display = 'block';
        }

        window.onload = syncAura;
    </script>
</body>
</html>
`));

// --- 3. BACKEND (Node.js Express) ---
app.get('/api/sync', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const aqiRes = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_TOKEN}`).then(r => r.json());
        const wRes = await fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`).then(r => r.json());

        const aqi = aqiRes.data.aqi;
        let info = { status: "Good", color: "#10b981", msg: "A quiet day for breathing." };
        if(aqi > 50) info = { status: "Moderate", color: "#ffde33", msg: "Dust levels rising. Stay aware." };
        if(aqi > 100) info = { status: "Unhealthy", color: "#ef4444", msg: "Poor air quality. Avoid outdoor activities." };

        res.json({
            aqi: aqi,
            temp: Math.round(wRes.main.temp),
            press: wRes.main.pressure,
            city: aqiRes.data.city.name.split(',')[0],
            status: info.status, color: info.color, msg: info.msg
        });
    } catch (e) { res.status(500).send("Sync Error"); }
});

app.post('/api/analyze', async (req, res) => {
    try {
        const response = await sambanova.chat.completions.create({
            model: "Llama-4-Maverick-17B-128E-Instruct",
            messages: [{ role: "user", content: [
                { type: "text", text: "Diagnose this plant disease and provide professional care instructions in Arabic. Be concise." },
                { type: "image_url", image_url: { url: req.body.image } }
            ]}]
        });
        res.json({ text: response.choices[0].message.content });
    } catch (e) { res.status(500).json({ text: "SambaNova analysis failed." }); }
});

app.listen(3000, () => console.log('Aura Online: http://localhost:3000'));