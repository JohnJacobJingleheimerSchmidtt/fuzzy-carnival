import express from 'express';
import OpenAI from "openai";
import fetch from 'node-fetch';

const app = express();

// إعدادات الذكاء الاصطناعي
const sambanova = new OpenAI({
    apiKey: process.env.SAMBANOVA_API_KEY,
    baseURL: "https://api.sambanova.ai/v1",
});

// مفاتيح الـ API (يفضل وضعها في بيئة العمل)
const WAQI_TOKEN = process.env.WAQI_TOKEN || "f1c59ef351d2e4cf906174a4a46dbd3633f4a2ab";
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "75cc65105421a699a2aad332d7188f96";

app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SambaNova Aura | Professional Home Monitor</title>
    <style>
        :root { --primary: #10b981; --bg: #f8fafc; --text: #1e293b; --card: #ffffff; --accent: #64748b; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; transition: 0.3s; }
        .container { max-width: 500px; margin: auto; }

        /* Aura Header Design */
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .aura-logo { display: flex; align-items: center; gap: 10px; }
        .logo-ring { width: 14px; height: 14px; border: 2.5px solid var(--primary); border-radius: 50%; }
        .sensor-tag { color: var(--primary); font-size: 0.7rem; font-weight: 800; letter-spacing: 1.5px; }

        .weather-meta { text-align: left; font-size: 0.8rem; color: var(--accent); }
        .w-bold { color: var(--text); font-weight: 700; font-size: 0.95rem; }

        /* Navigation Tabs */
        .nav-tabs { display: flex; gap: 12px; margin-bottom: 30px; background: #e2e8f0; padding: 5px; border-radius: 50px; }
        .tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; border-radius: 50px; font-size: 0.8rem; font-weight: 700; transition: 0.3s; color: var(--accent); }
        .tab.active { background: var(--text); color: white; }

        /* Aura Card (From image) */
        .aura-card { background: var(--card); border-radius: 32px; padding: 45px 25px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; text-align: center; margin-bottom: 25px; }
        .aqi-row { display: flex; align-items: baseline; justify-content: center; margin-bottom: 5px; }
        .aqi-num { font-size: 8.5rem; font-weight: 300; margin: 0; letter-spacing: -5px; line-height: 1; }
        .aqi-meta { text-align: left; margin-right: 15px; }
        
        .aqi-bar { height: 7px; background: linear-gradient(to right, #009966 0%, #ffde33 25%, #ff9933 50%, #cc0033 75%, #660099 100%); border-radius: 20px; margin: 30px 0 10px 0; }
        .bar-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; }

        /* Plant Analyzer Section */
        .page { display: none; animation: slideUp 0.4s ease-out; }
        .page.active { display: block; }
        .scanner-box { width: 100%; aspect-ratio: 1; background: #000; border-radius: 28px; overflow: hidden; position: relative; border: 1px solid #cbd5e1; }
        video, img { width: 100%; height: 100%; object-fit: cover; }
        
        .btn { border: none; padding: 16px; border-radius: 18px; cursor: pointer; font-weight: 700; width: 100%; margin-top: 15px; font-size: 0.9rem; transition: 0.2s; }
        .btn-dark { background: var(--text); color: white; }
        .btn-light { background: white; border: 1px solid #e2e8f0; color: var(--text); }
        
        #res-box { background: #f1f5f9; padding: 20px; border-radius: 24px; text-align: right; margin-top: 20px; display: none; font-size: 0.95rem; line-height: 1.7; border-right: 6px solid var(--primary); }

        @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-top">
            <div class="aura-logo">
                <span class="logo-ring"></span>
                <div>
                    <div style="font-weight: 800; font-size: 1.2rem; letter-spacing: -0.5px;">Aura</div>
                    <div style="font-size: 0.65rem; color: var(--accent); text-transform: uppercase; letter-spacing: 1px;">HOME • LIVING ROOM</div>
                </div>
            </div>
            <div class="sensor-tag">SENSOR ONLINE ●</div>
        </div>

        <div style="margin-bottom: 35px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <h1 id="greeting" style="font-weight: 400; font-size: 1.7rem; margin: 0; max-width: 60%;">Loading your environment...</h1>
                <div class="weather-meta">
                    TEMP <span class="w-bold" id="tDisp">--°</span><br>
                    PRESSURE <span class="w-bold" id="pDisp">-- hPa</span>
                </div>
            </div>
        </div>

        <div class="nav-tabs">
            <div class="tab active" onclick="changeTab('harmony', this)">LIVE READING</div>
            <div class="tab" onclick="changeTab('analyzer', this)">PLANT DOCTOR</div>
        </div>

        <div id="harmony" class="page active">
            <div class="aura-card">
                <div class="aqi-row">
                    <h1 class="aqi-num" id="aqiMain">--</h1>
                    <div class="aqi-meta">
                        <div style="font-weight: 800; font-size: 1.3rem;">AQI</div>
                        <div style="color: #94a3b8; font-size: 0.9rem;">index</div>
                    </div>
                </div>
                <div class="aqi-bar"></div>
                <div class="bar-labels">
                    <span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300+</span>
                </div>
                <div style="margin-top: 35px; font-size: 0.8rem; color: var(--accent); letter-spacing: 1px; font-weight: 600;">
                    <span id="dot" style="color: var(--primary);">●</span> <span id="statusTxt">SYNCING</span> • LIVE READING
                </div>
            </div>
            <button class="btn btn-light" onclick="syncData()">📍 RE-SYNC WITH LOCAL STATION</button>
        </div>

        <div id="analyzer" class="page">
            <div class="scanner-box">
                <video id="v" autoplay playsinline style="display:none;"></video>
                <img id="p" style="display:none;">
                <div id="ph" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#94a3b8;">Scanner Standby</div>
            </div>
            <button class="btn btn-dark" id="camAction" onclick="handleCamera()">ACTIVATE CAMERA</button>
            <button class="btn btn-dark" id="scanBtn" onclick="runAnalysis()" style="display:none; background: var(--primary);">IDENTIFY DISEASE</button>
            <div id="loader" style="display:none; text-align:center; padding:15px; color:var(--primary); font-weight:700;">SambaNova is processing tissue samples...</div>
            <div id="res-box"></div>
        </div>

        <div style="text-align:center; margin-top: 60px; padding: 25px 0; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 0.7rem; color: var(--accent); letter-spacing: 1.5px; line-height: 2;">
                CONCEPT & CODE BY<br>
                <span style="color: var(--text); font-weight: 800;">AHMED MAJED • MOHAMED HASSAN<br>ALI SAUD • AHMED RASHED</span>
            </p>
        </div>
    </div>

    <script>
        let stream = null;

        function changeTab(id, el) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            el.classList.add('active');
            if(id !== 'analyzer') closeCamera();
        }

        async function syncData() {
            document.getElementById('greeting').innerText = "Locating station...";
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const response = await fetch(\`/api/aura-sync?lat=\${pos.coords.latitude}&lon=\${pos.coords.longitude}\`);
                    const data = await response.json();
                    
                    document.getElementById('aqiMain').innerText = data.aqi;
                    document.getElementById('tDisp').innerText = data.temp + "°";
                    document.getElementById('pDisp').innerText = data.press + " hPa";
                    document.getElementById('statusTxt').innerText = data.status.toUpperCase();
                    document.getElementById('greeting').innerText = data.message;
                    document.getElementById('dot').style.color = data.color;
                } catch(e) {
                    document.getElementById('greeting').innerText = "Sync Failed. Check APIs.";
                }
            }, () => {
                document.getElementById('greeting').innerText = "Location denied.";
            });
        }

        async function handleCamera() {
            if(stream) { closeCamera(); return; }
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            document.getElementById('v').srcObject = stream;
            document.getElementById('v').style.display = 'block';
            document.getElementById('p').style.display = 'none';
            document.getElementById('ph').style.display = 'none';
            document.getElementById('camAction').innerText = "DEACTIVATE SCANNER";
            document.getElementById('scanBtn').style.display = 'block';
        }

        function closeCamera() {
            if(stream) stream.getTracks().forEach(t => t.stop());
            stream = null;
            document.getElementById('v').style.display = 'none';
            document.getElementById('camAction').innerText = "ACTIVATE CAMERA";
            document.getElementById('scanBtn').style.display = 'none';
        }

        async function runAnalysis() {
            const canvas = document.createElement('canvas');
            const v = document.getElementById('v');
            canvas.width = v.videoWidth; canvas.height = v.videoHeight;
            canvas.getContext('2d').drawImage(v, 0, 0);
            const imgData = canvas.toDataURL('image/jpeg');
            
            document.getElementById('p').src = imgData;
            document.getElementById('p').style.display = 'block';
            closeCamera();

            document.getElementById('loader').style.display = 'block';
            document.getElementById('res-box').style.display = 'none';

            const r = await fetch('/api/botanist', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ image: imgData })
            });
            const d = await r.json();
            
            document.getElementById('loader').style.display = 'none';
            document.getElementById('res-box').innerHTML = "<b>SambaNova Botanist:</b><br>" + d.text;
            document.getElementById('res-box').style.display = 'block';
        }

        // Auto-load on start
        window.onload = syncData;
    </script>
</body>
</html>
`));

// --- API BACKEND (Server Side) ---

app.get('/api/aura-sync', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        // 1. جلب رقم الـ AQI الحقيقي والدقيق من WAQI
        const aqiData = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_TOKEN}`).then(r => r.json());
        const realAQI = aqiData.data.aqi;

        // 2. جلب بيانات الطقس الحقيقية من OpenWeather
        const weatherData = await fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`).then(r => r.json());

        // منطق الحالة بناءً على المعايير العالمية (EPA Standards)
        let info = { status: "Good", color: "#009966", msg: "A quiet day for breathing." };
        if(realAQI > 50)  info = { status: "Moderate", color: "#ffde33", msg: "Air is okay, but keep plants close." };
        if(realAQI > 100) info = { status: "Unhealthy", color: "#ff9933", msg: "Sensitive groups should stay indoor." };
        if(realAQI > 150) info = { status: "Harmful", color: "#cc0033", msg: "Air quality is poor. Activate filters." };

        res.json({
            aqi: realAQI,
            temp: Math.round(weatherData.main.temp),
            press: weatherData.main.pressure,
            status: info.status,
            color: info.color,
            message: info.msg
        });
    } catch (e) { res.status(500).json({ error: "Sync Error" }); }
});

app.post('/api/botanist', async (req, res) => {
    try {
        const response = await sambanova.chat.completions.create({
            model: "Llama-4-Maverick-17B-128E-Instruct",
            messages: [{ role: "user", content: [
                { type: "text", text: "Identify the plant disease in this image. Provide the diagnosis and immediate care steps in Arabic. Be professional and concise." },
                { type: "image_url", image_url: { url: req.body.image } }
            ]}]
        });
        res.json({ text: response.choices[0].message.content });
    } catch (e) { res.status(500).json({ text: "SambaNova analysis failed." }); }
});

app.listen(3000, () => console.log('Aura Server Running on Port 3000'));