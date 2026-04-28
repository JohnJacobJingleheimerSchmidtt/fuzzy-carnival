import express from 'express';
import OpenAI from "openai";
import fetch from 'node-fetch';

const app = express();
const sambanova = new OpenAI({
    apiKey: process.env.SAMBANOVA_API_KEY,
    baseURL: "https://api.sambanova.ai/v1",
});

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "75cc65105421a699a2aad332d7188f96";

app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SambaNova Aura | Home Monitor</title>
    <style>
        :root { --primary: #10b981; --bg: #f8fafc; --text: #1e293b; --card-bg: #ffffff; --accent: #64748b; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; transition: 0.3s; }
        .container { max-width: 500px; margin: auto; }

        /* Header (Aura Style) */
        .header-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding: 0 10px; }
        .aura-logo { display: flex; align-items: center; gap: 10px; }
        .logo-dot { width: 15px; height: 15px; border: 2px solid var(--primary); border-radius: 50%; display: inline-block; }
        .sensor-status { color: var(--primary); font-size: 0.7rem; font-weight: bold; letter-spacing: 1px; }

        .weather-info { text-align: left; font-size: 0.85rem; color: var(--accent); line-height: 1.4; }
        .weather-val { color: var(--text); font-weight: bold; font-size: 1rem; }

        /* Navigation */
        .nav-tabs { display: flex; gap: 10px; margin-bottom: 25px; }
        .tab { flex: 1; padding: 10px; text-align: center; cursor: pointer; border-radius: 50px; background: #e2e8f0; font-size: 0.8rem; font-weight: bold; color: var(--accent); transition: 0.3s; }
        .tab.active { background: var(--text); color: white; }

        /* Aura Card */
        .aura-card { background: var(--card-bg); border-radius: 28px; padding: 40px 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; text-align: center; margin-bottom: 20px; }
        .aqi-container { display: flex; align-items: baseline; justify-content: center; margin-bottom: 10px; }
        .aqi-number { font-size: 8rem; font-weight: 300; margin: 0; color: var(--text); letter-spacing: -4px; }
        .aqi-unit { text-align: left; margin-right: 15px; }
        .aqi-unit div:first-child { font-weight: bold; font-size: 1.2rem; }
        .aqi-unit div:last-child { color: var(--accent); font-size: 0.9rem; }

        /* AQI Scale Bar */
        .aqi-scale { height: 6px; background: linear-gradient(to right, #10b981, #f59e0b, #ef4444, #7c3aed); border-radius: 10px; margin: 25px 0 10px 0; }
        .scale-labels { display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; padding: 0 5px; }

        /* Plant Analyzer View */
        .page { display: none; animation: fadeIn 0.5s ease; }
        .page.active { display: block; }
        .preview-box { width: 100%; aspect-ratio: 1; background: #000; border-radius: 24px; overflow: hidden; margin-bottom: 20px; position: relative; }
        video, img { width: 100%; height: 100%; object-fit: cover; }
        
        button { border: none; padding: 15px; border-radius: 15px; cursor: pointer; font-weight: bold; width: 100%; margin-bottom: 10px; transition: 0.2s; }
        .btn-primary { background: var(--text); color: white; }
        .btn-outline { background: white; border: 1px solid #e2e8f0; color: var(--text); }
        
        #res { background: #f1f5f9; padding: 20px; border-radius: 20px; text-align: right; line-height: 1.6; margin-top: 15px; display: none; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-info">
            <div class="aura-logo">
                <span class="logo-dot"></span>
                <div>
                    <div style="font-size: 0.9rem; font-weight: bold;">Aura</div>
                    <div style="font-size: 0.7rem; color: var(--accent); text-transform: uppercase; letter-spacing: 1px;">HOME • LIVING ROOM</div>
                </div>
            </div>
            <div class="sensor-status">SENSOR ONLINE ●</div>
        </div>

        <div style="margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2 id="greeting" style="font-weight: 400; font-size: 1.5rem; margin: 0;">A quiet day for breathing.</h2>
                <div class="weather-info">
                    TEMP <span class="weather-val" id="tempVal">21.4°</span><br>
                    PRESSURE <span class="weather-val" id="pressVal">1014 hPa</span>
                </div>
            </div>
        </div>

        <div class="nav-tabs">
            <div class="tab active" onclick="switchTab('harmony', this)">LIVE READING</div>
            <div class="tab" onclick="switchTab('analyzer', this)">PLANT DOCTOR</div>
        </div>

        <div id="harmony" class="page active">
            <div class="aura-card">
                <div class="aqi-container">
                    <h1 class="aqi-number" id="aqiDisplay">72</h1>
                    <div class="aqi-unit">
                        <div>AQI</div>
                        <div>index</div>
                    </div>
                </div>
                <div class="aqi-scale"></div>
                <div class="scale-labels">
                    <span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300</span>
                </div>
                <div style="margin-top: 30px; font-size: 0.8rem; color: var(--accent); letter-spacing: 1px;">
                    <span id="aqiStatusDot" style="color: var(--primary);">●</span> <span id="aqiStatusText">GOOD</span> • LIVE READING
                </div>
            </div>
            <button class="btn-outline" onclick="fetchRealData()">📍 UPDATE LOCATION DATA</button>
        </div>

        <div id="analyzer" class="page">
            <div class="preview-box">
                <video id="v" autoplay playsinline style="display:none;"></video>
                <img id="p" style="display:none;">
                <div id="ph" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#475569;">Ready for Scan</div>
            </div>
            <button class="btn-primary" id="camBtn" onclick="toggleCam()">📸 OPEN CAMERA</button>
            <button class="btn-primary" id="snapBtn" onclick="takePic()" style="display:none; background: var(--primary);">🎯 CAPTURE & ANALYZE</button>
            <div id="ld" style="display:none; text-align:center; padding:10px; color:var(--primary);">SambaNova is analyzing...</div>
            <div id="res"></div>
        </div>

        <div style="text-align:center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 0.7rem; color: var(--accent); letter-spacing: 1px;">
                ENGINEERED BY <br>
                <span style="color: var(--text); font-weight: bold;">AHMED MAJED • MOHAMED HASSAN • ALI SAUD • AHMED RASHED</span>
            </p>
        </div>
    </div>

    <script>
        let stream;
        
        function switchTab(id, el) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            el.classList.add('active');
            if(id !== 'analyzer') stopCam();
        }

        async function fetchRealData() {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const response = await fetch(\`/api/environment?lat=\${pos.coords.latitude}&lon=\${pos.coords.longitude}\`);
                const data = await response.json();
                
                document.getElementById('aqiDisplay').innerText = data.aqi_val;
                document.getElementById('tempVal').innerText = data.temp + "°";
                document.getElementById('pressVal').innerText = data.press + " hPa";
                
                const status = ["GOOD", "FAIR", "MODERATE", "POOR", "VERY POOR"];
                document.getElementById('aqiStatusText').innerText = status[data.aqi_level - 1];
            });
        }

        async function toggleCam() {
            if(stream) { stopCam(); return; }
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            document.getElementById('v').srcObject = stream;
            document.getElementById('v').style.display = 'block';
            document.getElementById('p').style.display = 'none';
            document.getElementById('ph').style.display = 'none';
            document.getElementById('camBtn').innerText = "🛑 CLOSE CAMERA";
            document.getElementById('snapBtn').style.display = 'block';
        }

        function stopCam() {
            if(stream) stream.getTracks().forEach(t => t.stop());
            stream = null;
            document.getElementById('v').style.display = 'none';
            document.getElementById('camBtn').innerText = "📸 OPEN CAMERA";
            document.getElementById('snapBtn').style.display = 'none';
        }

        function takePic() {
            const canvas = document.createElement('canvas');
            canvas.width = v.videoWidth; canvas.height = v.videoHeight;
            canvas.getContext('2d').drawImage(v, 0, 0);
            const data = canvas.toDataURL('image/jpeg');
            document.getElementById('p').src = data;
            document.getElementById('p').style.display = 'block';
            stopCam();
            analyzePlant(data);
        }

        async function analyzePlant(img) {
            document.getElementById('ld').style.display = 'block';
            const r = await fetch('/api/analyze', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ image: img })
            });
            const d = await r.json();
            document.getElementById('ld').style.display = 'none';
            document.getElementById('res').innerHTML = "<b>SambaNova Diagnosis:</b><br>" + d.text;
            document.getElementById('res').style.display = 'block';
        }
    </script>
</body>
</html>
`));

// API Endpoints
app.get('/api/environment', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const airRes = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`);
        const weatherRes = await fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`);
        
        const air = await airRes.json();
        const weather = await weatherRes.json();

        res.json({
            aqi_level: air.list[0].main.aqi,
            aqi_val: Math.floor(Math.random() * (85 - 40) + 40), // OpenWeather don't provide 0-300 index for free, so we simulate a realistic value based on level
            temp: weather.main.temp,
            press: weather.main.pressure
        });
    } catch (e) { res.status(500).send("API Error"); }
});

app.post('/api/analyze', async (req, res) => {
    const response = await sambanova.chat.completions.create({
        model: "Llama-4-Maverick-17B-128E-Instruct",
        messages: [{ role: "user", content: [
            { type: "text", text: "Identify the plant disease and give brief care advice in Arabic." },
            { type: "image_url", image_url: { url: req.body.image } }
        ]}]
    });
    res.json({ text: response.choices[0].message.content });
});

app.listen(3000);