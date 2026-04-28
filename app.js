import express from 'express';
import OpenAI from "openai";

const app = express();
const sambanova = new OpenAI({
    apiKey: process.env.SAMBANOVA_API_KEY, // تأكد من وضع مفتاحك هنا أو في البيئة
    baseURL: "https://api.sambanova.ai/v1",
});

app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SambaNova Plant & Harmony</title>
    <style>
        :root { --primary: #10b981; --bg: #0f172a; --card: #1e293b; --accent: #3b82f6; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); color: white; margin: 0; padding: 20px; }
        
        .container { max-width: 500px; margin: auto; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { color: var(--primary); margin: 0; font-size: 1.8rem; }
        
        /* نظام التبويبات Navigation */
        .nav-tabs { display: flex; background: var(--card); border-radius: 12px; padding: 5px; margin-bottom: 20px; }
        .tab { flex: 1; padding: 10px; text-align: center; cursor: pointer; border-radius: 8px; transition: 0.3s; font-weight: bold; }
        .tab.active { background: var(--primary); color: white; }

        .page { display: none; animation: fadeIn 0.5s; }
        .page.active { display: block; }

        /* كروت الإحصائيات (Harmony Page) */
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
        .stat-card { background: var(--card); padding: 20px; border-radius: 15px; border: 1px solid #334155; text-align: center; }
        .stat-value { font-size: 1.6rem; font-weight: bold; color: var(--primary); display: block; margin-bottom: 5px; }
        .stat-label { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; }

        /* صندوق الكاميرا (Analyzer Page) */
        .preview-box { width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 15px; overflow: hidden; position: relative; margin-bottom: 15px; border: 2px solid #334155; }
        video, img { width: 100%; height: 100%; object-fit: cover; }
        
        button { border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.2s; color: white; width: 100%; margin-bottom: 10px; }
        .btn-main { background: var(--primary); }
        .btn-upload { background: #475569; }
        .btn-danger { background: #ef4444; }

        #res { background: var(--card); padding: 15px; border-radius: 15px; margin-top: 15px; text-align: right; border-right: 5px solid var(--primary); display: none; }
        
        .credits { margin-top: 40px; padding: 15px; border-top: 1px solid #334155; font-size: 0.8rem; color: #94a3b8; text-align: center; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌿 SambaNova Plant Doctor</h1>
            <p style="font-size: 0.8rem; color: #94a3b8;">إشراف: أحمد ماجد</p>
        </div>

        <div class="nav-tabs">
            <div class="tab active" onclick="showPage('analyzer', this)">🔬 محلل النبات</div>
            <div class="tab" onclick="showPage('harmony', this)">✨ جودة الحياة</div>
        </div>

        <div id="analyzer" class="page active">
            <div class="preview-box">
                <video id="v" autoplay playsinline style="display:none;"></video>
                <img id="p" style="display:none;">
                <div id="ph" style="color:#444;">📸 الكاميرا جاهزة للفحص</div>
            </div>
            
            <div id="camControls">
                <button class="btn-main" id="startBtn" onclick="startCam()">فتح الكاميرا</button>
                <button class="btn-main" id="capBtn" onclick="takePic()" style="display:none; background:#f59e0b;">🎯 التقاط صورة</button>
                <button class="btn-danger" id="stopBtn" onclick="stopCam()" style="display:none;">إغلاق الكاميرا</button>
            </div>

            <input type="file" id="fileIn" accept="image/*" style="display:none;" onchange="loadFile(event)">
            <button class="btn-upload" onclick="document.getElementById('fileIn').click()">📁 رفع صورة من الجهاز</button>
            
            <button id="anBtn" onclick="analyze()" style="display:none; background:var(--accent);">بدء تحليل الذكاء الاصطناعي</button>
            <div id="ld" style="display:none; color:var(--primary); margin:10px;">جاري الفحص...</div>
            <div id="res"></div>
        </div>

        <div id="harmony" class="page">
            <div class="stat-card">
                <p>عدد النباتات في غرفتك</p>
                <input type="number" id="pCount" value="0" min="0" oninput="updateHarmony()" style="width: 80px; padding: 10px; font-size: 1.2rem; border-radius: 8px; border: none; text-align: center;">
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value" id="airVal">0%</span>
                    <span class="stat-label">جودة الهواء</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="moodVal">😐</span>
                    <span class="stat-label">الحالة المزاجية</span>
                </div>
                <div class="stat-card" style="grid-column: span 2;">
                    <span class="stat-value" id="o2Val" style="color: #60a5fa;">0.0 L/h</span>
                    <span class="stat-label">إنتاج الأكسجين المتوقع</span>
                </div>
            </div>
            
            <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 20px;">
                * هذه البيانات تقديرية بناءً على عدد النباتات وتأثيرها البيئي في الأماكن المغلقة.
            </p>
        </div>

        <div class="credits">
            <strong>فريق العمل</strong><br>
            أحمد ماجد | محمد حسن | علي سعود | أحمد راشد
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
            } catch(e) { alert("يرجى تفعيل الكاميرا"); }
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

        function updateHarmony() {
            const count = document.getElementById('pCount').value || 0;
            const air = Math.min(count * 20, 100);
            const o2 = (count * 0.5).toFixed(1);
            let mood = "😐";
            if(count >= 5) mood = "🤩 السعادة القصوى";
            else if(count >= 3) mood = "😊 إيجابي جداً";
            else if(count >= 1) mood = "🙂 مريح";

            document.getElementById('airVal').innerText = air + "%";
            document.getElementById('o2Val').innerText = o2 + " L/h";
            document.getElementById('moodVal').innerText = mood;
        }

        async function analyze() {
            document.getElementById('ld').style.display='block';
            anBtn.disabled = true;
            try {
                const r = await fetch('/analyze', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ image: p.src })
                });
                const d = await r.json();
                res.innerHTML = "<b>تشخيص SambaNova:</b><br>" + d.text;
                res.style.display='block';
            } catch(e) { alert("خطأ في الاتصال"); }
            document.getElementById('ld').style.display='none';
            anBtn.disabled = false;
        }
    </script>
</body>
</html>
`));

app.post('/analyze', async (req, res) => {
    try {
        const response = await sambanova.chat.completions.create({
            model: "Llama-4-Maverick-17B-128E-Instruct",
            messages: [{ role: "user", content: [
                { type: "text", text: "شخص حالة هذا النبات بالعربية بوضوح واختصار." },
                { type: "image_url", image_url: { url: req.body.image } }
            ]}]
        });
        res.json({ text: response.choices[0].message.content });
    } catch (e) { res.status(500).json({ text: "فشل التحليل" }); }
});

app.listen(3000);