import express from 'express';
import OpenAI from "openai";

const app = express();
const sambanova = new OpenAI({
    apiKey: process.env.SAMBANOVA_API_KEY,
    baseURL: "https://api.sambanova.ai/v1",
});

app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طبيب النبات - فريق أحمد ماجد</title>
    <style>
        :root { --primary: #10b981; --bg: #0f172a; --accent: #3b82f6; --warning: #f59e0b; }
        body { font-family: system-ui, sans-serif; background: var(--bg); color: white; text-align: center; padding: 20px; margin: 0; }
        .box { background: #1e293b; padding: 20px; border-radius: 24px; max-width: 500px; margin: auto; border: 1px solid #334155; }
        
        /* ميزة جانبية: مراقب البيئة */
        .side-feature { background: #0f172a; padding: 12px; border-radius: 12px; margin-bottom: 15px; border: 1px dashed #475569; font-size: 0.85rem; }
        .side-feature input { width: 45px; background: #1e293b; border: 1px solid var(--primary); color: white; border-radius: 5px; text-align: center; }
        
        .preview-box { width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 15px; overflow: hidden; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; position: relative; }
        video, img { width: 100%; height: 100%; object-fit: cover; }
        
        button { border: none; padding: 12px 15px; border-radius: 10px; cursor: pointer; margin: 4px; font-weight: bold; transition: 0.2s; color: white; font-size: 0.9rem; }
        .btn-cam { background: var(--primary); }
        .btn-stop { background: #ef4444; display: none; }
        .btn-flash { background: var(--warning); display: none; color: black; }
        .btn-upload { background: #475569; width: 90%; margin-top: 10px; }
        
        #res { margin-top: 20px; text-align: right; background: #0f172a; padding: 15px; border-radius: 15px; display: none; border-right: 5px solid var(--primary); line-height: 1.6; }
        .credits { margin-top: 25px; padding-top: 15px; border-top: 1px solid #334155; font-size: 0.8rem; color: #94a3b8; }
        .team-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
        .member { background: #0f172a; padding: 6px; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="box">
        <h1 style="color: var(--primary); margin: 0 0 10px 0;">🌿 طبيب النبات</h1>

        <div class="side-feature">
            <span>عدد النباتات بالمنزل: </span>
            <input type="number" id="pCount" value="1" min="0" oninput="updateEnv()">
            <div id="envStatus" style="margin-top: 8px; color: var(--warning);">جودة الهواء: مستقرة | المزاج: هادئ</div>
        </div>

        <div class="preview-box">
            <video id="v" autoplay playsinline style="display:none;"></video>
            <img id="p" style="display:none;">
            <div id="ph" style="color: #444;">الكاميرا جاهزة للفحص</div>
        </div>

        <div id="controls">
            <button id="sBtn" class="btn-cam" onclick="startCam()">📸 فتح الكاميرا</button>
            <button id="fBtn" class="btn-flash" onclick="toggleFlash()">🔦 كشاف</button>
            <button id="cBtn" class="btn-cam" onclick="takePic()" style="display:none; background: var(--warning); color: black;">🎯 التقاط</button>
            <button id="tBtn" class="btn-stop" onclick="stopCam()">🛑 إغلاق</button>
        </div>
        
        <input type="file" id="fileIn" accept="image/*" style="display:none;" onchange="loadFile(event)">
        <button class="btn-upload" onclick="document.getElementById('fileIn').click()">📁 رفع صورة من المعرض</button>

        <button id="anBtn" onclick="analyze()" style="display:none; background:var(--accent); width:100%; margin-top:15px;">بدء تحليل الذكاء الاصطناعي</button>
        <div id="ld" style="display:none; margin-top:10px; color: var(--primary);">جاري تحليل الأنسجة...</div>
        <div id="res"></div>

        <div class="credits">
            <p style="font-weight: bold; margin-bottom: 5px;">فريق العمل:</p>
            <div class="team-grid">
                <div class="member" style="grid-column: span 2; color: var(--primary); border: 1px solid var(--primary);">أحمد ماجد (Ahmed Majed)</div>
                <div class="member">محمد حسن</div>
                <div class="member">علي سعود</div>
                <div class="member" style="grid-column: span 2;">أحمد راشد</div>
            </div>
        </div>
    </div>

    <script>
        let stream, track, flashOn = false;
        const v=document.getElementById('v'), p=document.getElementById('p'), res=document.getElementById('res'), 
              anBtn=document.getElementById('anBtn'), sBtn=document.getElementById('sBtn'), 
              tBtn=document.getElementById('tBtn'), cBtn=document.getElementById('cBtn'),
              fBtn=document.getElementById('fBtn'), ph=document.getElementById('ph'),
              envStatus=document.getElementById('envStatus');

        // تحديث ميزة جودة الهواء والمزاج (جانبية)
        function updateEnv() {
            const count = document.getElementById('pCount').value;
            let air = count > 5 ? "ممتازة ✨" : (count > 2 ? "جيدة ✅" : "عادية ⚠️");
            let mood = count > 4 ? "سعادة وراحة القصوى 😊" : (count > 1 ? "إيجابي ومريح 🙂" : "محايد 😐");
            envStatus.innerHTML = \`جودة الهواء: \${air} | المزاج: \${mood}\`;
        }

        async function startCam() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                v.srcObject = stream;
                track = stream.getVideoTracks()[0];
                v.style.display='block'; p.style.display='none'; ph.style.display='none';
                sBtn.style.display='none'; tBtn.style.display='inline-block'; cBtn.style.display='inline-block';
                const caps = track.getCapabilities();
                if (caps.torch) fBtn.style.display = 'inline-block';
            } catch(e) { alert("أعطِ صلاحية الكاميرا"); }
        }

        async function toggleFlash() {
            if (!track) return;
            flashOn = !flashOn;
            await track.applyConstraints({ advanced: [{ torch: flashOn }] });
            fBtn.innerText = flashOn ? "📴 إطفاء" : "🔦 كشاف";
        }

        function stopCam() {
            if(stream) {
                stream.getTracks().forEach(t => t.stop());
                v.style.display='none'; ph.style.display='block';
                sBtn.style.display='inline-block'; tBtn.style.display='none'; 
                cBtn.style.display='none'; fBtn.style.display='none';
            }
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
            r.onload = () => { showPreview(r.result); stopCam(); };
            r.readAsDataURL(e.target.files[0]);
        }

        function showPreview(src) {
            p.src = src; p.style.display='block'; v.style.display='none'; ph.style.display='none';
            anBtn.style.display='block'; res.style.display='none';
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
                res.innerHTML = "<b>تحليل الذكاء الاصطناعي:</b><br>" + d.text;
                res.style.display='block';
                res.scrollIntoView({ behavior: 'smooth' });
            } catch(e) { alert("خطأ في الاتصال"); }
            document.getElementById('ld').style.display='none'; anBtn.disabled = false;
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
                { type: "text", text: "أنت خبير زراعي. شخص حالة النبات بالعربية باختصار." },
                { type: "image_url", image_url: { url: req.body.image } }
            ]}]
        });
        res.json({ text: response.choices[0].message.content });
    } catch (e) { res.status(500).json({ text: "فشل التحليل" }); }
});

app.listen(3000);