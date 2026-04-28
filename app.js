import express from 'express';
import OpenAI from "openai";
import fetch from 'node-fetch';

const app = express();
const sambanova = new OpenAI({
    apiKey: process.env.SAMBANOVA_API_KEY,
    baseURL: "https://api.sambanova.ai/v1",
});

// مفتاح API لجودة الهواء (OpenWeatherMap)
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "75cc65105421a699a2aad332d7188f96";

app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SambaNova Plant & Air Monitor</title>
    <style>
        :root { --primary: #10b981; --bg: #0f172a; --card: #1e293b; --accent: #3b82f6; --warning: #f59e0b; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: white; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: auto; }
        
        /* التبويبات Navigation */
        .nav-tabs { display: flex; background: var(--card); border-radius: 15px; padding: 5px; margin-bottom: 20px; border: 1px solid #334155; }
        .tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; border-radius: 10px; font-weight: bold; transition: 0.3s; }
        .tab.active { background: var(--primary); color: white; }
        
        .page { display: none; animation: fadeIn 0.4s ease; }
        .page.active { display: block; }

        /* البطاقات Stats Cards */
        .stat-card { background: var(--card); padding: 20px; border-radius: 18px; border: 1px solid #334155; margin-bottom: 15px; text-align: center; }
        .stat-value { font-size: 1.8rem; font-weight: bold; color: var(--primary); display: block; }
        .stat-label { font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }

        /* الكاميرا Analyzer */
        .preview-box { width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 20px; overflow: hidden; position: relative; margin-bottom: 15px; border: 2px solid #334155; }
        video, img { width: 100%; height: 100%; object-fit: cover; }
        
        button { border: none; padding: 14px; border-radius: 12px; cursor: pointer; font-weight: bold; width: 100%; margin-bottom: 10px; color: white; transition: 0.2s; }
        .btn-main { background: var(--primary); }
        .btn-main:active { transform: scale(0.98); }
        .btn-sec { background: var(--accent); }
        .btn-danger { background: #ef4444; }

        #res { background: var(--card); padding: 15px; border-radius: 15px; margin-top: 15px; text-align: right; border-right: 5px solid var(--primary); display: none; font-size: 0.95rem; line-height: 1.6; }
        
        .credits { margin-top: 40px; padding: 20px; border-top: 1px solid #334155; font-size: 0.8rem; color: #94a3b8; text-align: center; }
        .team-names { color: var(--primary); font-weight: bold; margin-top: 5px; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="container">
        <div style="text-align:center; margin-bottom: 25px;">
            <h1 style="color: var(--primary); margin:0;">🌿 SambaNova AI</h1>
            <p style="color: #94a3b8; font-size: 0.9rem;">Environment & Plant Health Monitor</p>
        </div>

        <div class="nav-tabs">
            <div class="tab active" onclick="showPage('analyzer', this)">🔬 المحلل</div>
            <div class="tab" onclick="showPage('harmony', this)">✨ جودة الهواء</div>
        </div>

        <div id="analyzer" class="page active">
            <div class="preview-box">
                <video id="v" autoplay playsinline style="display:none;"></video>
                <img id="p" style="display:none;">
                <div id="ph" style="color: #475569; font-weight: bold;">📸 جاهز للفحص الضوئي</div>
            </div>
            
            <button class="btn-main" id="startBtn" onclick="startCam()">تشغيل الكاميرا</button>
            <button class="btn-main" id="capBtn" onclick="takePic()" style="display:none; background: var(--warning); color: black;">🎯 التقاط الصورة</button>
            <button class="btn-danger" id="stopBtn" onclick="stopCam()" style="display:none;">إيقاف الكاميرا</button>
            
            <input type="file" id="fileIn" accept="image/*" style="display:none;" onchange="loadFile(event)">
            <button class="btn-sec" onclick="document.getElementById('fileIn').click()">📁 رفع صورة من المعرض</button>
            
            <button id="anBtn" onclick="analyze()" style="display:none; background: var(--accent);">بدء تحليل SambaNova</button>
            <div id="ld" style="display:none; color: var(--primary); margin: 10px; font-weight:bold;">جاري الاتصال بالسحابة...</div>
            <div id="res"></div>
        </div>

        <div id="harmony" class="page">
            <button class="btn-sec" onclick="getRealAirQuality()">📍 تحديث جودة الهواء في موقعي</button>
            
            <div class="stat-card">
                <span class="stat-label">جودة الهواء الخارجية (Real-time)</span>
                <span class="stat-value" id="localAir">--</span>
                <span id="localDesc" style="color: #94a3b8;">اضغط للتحديث بناءً على موقعك</span>
            </div>

            <div class="stat-card">
                <p>عدد النباتات في غرفتك</p>
                <input type="number" id="pCount" value="0" min="0" oninput="updateInternalHarmony()" style="width: 80px; padding: 12px; font-size: 1.2rem; border-radius: 10px; border: none; text-align: center; background: #0f172a; color: white;">
                <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                    <div>
                        <span class="stat-label">المزاج</span>
                        <span class="stat-value" id="moodVal" style="font-size: 1.4rem;">😐</span>
                    </div>
                    <div>
                        <span class="stat-label">تحسين O2</span>
                        <span class="stat-value" id="o2Val" style="font-size: 1.4rem; color: #3b82f6;">0%</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="credits">
            <span>تم التطوير بواسطة فريق العمل:</span><br>
            <div class="team-names">أحمد ماجد | محمد حسن | علي سعود | أحمد راشد</div>
        </div>
    </div>

    <script>
        let stream, track;
        const v=document.getElementById('v'), p=document.getElementById('p'), res=document.getElementById('res'), 
              anBtn=document.getElementById('anBtn'), ph=document.getElementById('ph');

        function showPage(pageId, el) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            el.classList.add('active');
            if(pageId !== 'analyzer') stopCam();
        }

        async function startCam() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                v.srcObject = stream;
                v.style.display='block'; p.style.display='none'; ph.style.display='none';
                document.getElementById('startBtn').style.display='none';
                document.getElementById('capBtn').style.display='block';
                document.getElementById('stopBtn').style.display='block';
            } catch(e) { alert("يرجى تفعيل صلاحية الكاميرا"); }
        }

        function stopCam() {
            if(stream) stream.getTracks().forEach(t => t.stop());
            v.style.display='none'; ph.style.display='block';
            document.getElementById('startBtn').style.display='block';
            document.getElementById('capBtn').style.display='none';
            document.getElementById('stopBtn').style.display='none';
        }

        function takePic() {
            const canvas = document.createElement('canvas');
            canvas.width = v.videoWidth; canvas.height = v.videoHeight;
            canvas.getContext('2d').drawImage(v, 0, 0);
            showPreview(canvas.toDataURL('image/jpeg'));
            stopCam();
        }

        function loadFile(e) {
            const r = new FileReader();
            r.onload = () => showPreview(r.result);
            r.readAsDataURL(e.target.files[0]);
        }

        function showPreview(src) {
            p.src = src; p.style.display='block'; v.style.display='none'; ph.style.display='none';
            anBtn.style.display='block'; res.style.display='none';
        }

        // ميزة جودة الهواء الحقيقية
        async function getRealAirQuality() {
            document.getElementById('localDesc').innerText = "📍 جاري تحديد موقعك...";
            if (!navigator.geolocation) return alert("الموقع الجغرافي غير مدعوم");
            
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const response = await fetch(\`/api/air?lat=\${pos.coords.latitude}&lon=\${pos.coords.longitude}\`);
                    const data = await response.json();
                    const levels = ["ممتاز ✨", "جيد 👍", "متوسط ⚠️", "ضعيف 😷", "سيء جداً 🚨"];
                    document.getElementById('localAir').innerText = "Level " + data.aqi;
                    document.getElementById('localDesc').innerText = levels[data.aqi - 1];
                } catch(e) { 
                    document.getElementById('localDesc').innerText = "فشل جلب البيانات";
                }
            });
        }

        function updateInternalHarmony() {
            const count = document.getElementById('pCount').value || 0;
            const o2 = Math.min(count * 15, 100);
            let mood = "😐";
            if(count >= 5) mood = "🤩";
            else if(count >= 3) mood = "😊";
            else if(count >= 1) mood = "🙂";
            
            document.getElementById('o2Val').innerText = o2 + "%";
            document.getElementById('moodVal').innerText = mood;
        }

        async function analyze() {
            document.getElementById('ld').style.display='block'; anBtn.disabled = true;
            try {
                const r = await fetch('/analyze', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ image: p.src })
                });
                const d = await r.json();
                res.innerHTML = "<b>تشخيص SambaNova AI:</b><br>" + d.text;
                res.style.display='block';
                res.scrollIntoView({ behavior: 'smooth' });
            } catch(e) { alert("خطأ في الاتصال بالسيرفر"); }
            document.getElementById('ld').style.display='none'; anBtn.disabled = false;
        }
    </script>
</body>
</html>
`));

// الـ Route الخاص بجلب جودة الهواء (Backend)
app.get('/api/air', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const response = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`);
        const data = await response.json();
        res.json({ aqi: data.list[0].main.aqi });
    } catch (e) { res.status(500).json({ error: "API Error" }); }
});

app.post('/analyze', async (req, res) => {
    try {
        const response = await sambanova.chat.completions.create({
            model: "Llama-4-Maverick-17B-128E-Instruct",
            messages: [{ role: "user", content: [
                { type: "text", text: "أنت خبير نباتات. حلل الصورة وشخص الحالة بالعربية باختصار." },
                { type: "image_url", image_url: { url: req.body.image } }
            ]}]
        });
        res.json({ text: response.choices[0].message.content });
    } catch (e) { res.status(500).json({ text: "خطأ في التحليل" }); }
});

app.listen(3000, () => console.log('التطبيق يعمل على المنفذ 3000'));