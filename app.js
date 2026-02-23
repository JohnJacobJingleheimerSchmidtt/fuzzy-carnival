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
    <title>طبيب النبات - فريق العمل</title>
    <style>
        :root { --primary: #10b981; --bg: #0f172a; }
        body { font-family: system-ui, sans-serif; background: var(--bg); color: white; text-align: center; padding: 20px; margin: 0; }
        .box { background: #1e293b; padding: 20px; border-radius: 24px; max-width: 500px; margin: auto; border: 1px solid #334155; }
        .preview-box { width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 15px; overflow: hidden; margin: 15px 0; position: relative; }
        video, img { width: 100%; height: 100%; object-fit: cover; }
        button { background: var(--primary); color: white; border: none; padding: 12px 18px; border-radius: 10px; cursor: pointer; margin: 5px; font-weight: bold; transition: 0.3s; }
        button:hover { opacity: 0.9; transform: translateY(-1px); }
        #res { margin-top: 20px; text-align: right; background: #0f172a; padding: 15px; border-radius: 15px; display: none; border-right: 5px solid var(--primary); line-height: 1.8; }
        
        /* قسم أسماء الفريق */
        .credits { margin-top: 30px; padding: 15px; border-top: 1px solid #334155; font-size: 0.9rem; color: #94a3b8; }
        .team-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .member { background: #0f172a; padding: 8px; border-radius: 8px; color: #cbd5e1; border: 1px solid #1e293b; }
        .lead { grid-column: span 2; color: var(--primary); font-weight: bold; border-color: var(--primary); }
    </style>
</head>
<body>
    <div class="box">
        <h1 style="color: var(--primary); margin-bottom: 5px;">🌿 طبيب النبات</h1>
        <p style="color: #94a3b8; font-size: 0.9rem;">بواسطة الذكاء الاصطناعي Llama 4 Maverick</p>
        
        <div class="preview-box">
            <video id="v" autoplay playsinline></video>
            <img id="p" style="display:none;">
        </div>

        <div>
            <button onclick="startCam()">📸 تشغيل الكاميرا</button>
            <button onclick="takePic()">🎯 التقاط صورة</button>
        </div>
        
        <div style="margin-top: 15px;">
            <input type="file" id="f" accept="image/*" style="display:none;" onchange="loadFile(event)">
            <button onclick="document.getElementById('f').click()" style="background:#475569; width: 80%;">📁 اختيار صورة من الجهاز</button>
        </div>

        <button id="anBtn" onclick="analyze()" style="display:none; background:#3b82f6; width:100%; margin-top:20px; font-size: 1.1rem;">بدء التحليل الفوري</button>
        <div id="ld" style="display:none; margin-top:15px; color: var(--primary);">جاري فحص الأنسجة النباتية...</div>
        <div id="res"></div>

        <div class="credits">
            <p style="margin-bottom: 10px; font-weight: bold;">فريق التطوير:</p>
            <div class="team-grid">
                <div class="member lead">أحمد ماجد (Ahmed Majed)</div>
                <div class="member">محمد حسن</div>
                <div class="member">علي سعود</div>
                <div class="member">محمد عبد الرحيم</div>
                <div class="member">معتز سلطان</div>
            </div>
        </div>
    </div>

    <script>
        let stream;
        const v=document.getElementById('v'), p=document.getElementById('p'), res=document.getElementById('res'), anBtn=document.getElementById('anBtn');

        async function startCam() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                v.srcObject = stream;
                v.style.display='block'; p.style.display='none';
            } catch(e) { alert("يرجى السماح بالوصول للكاميرا"); }
        }

        function takePic() {
            const c = document.createElement('canvas');
            c.width = v.videoWidth; c.height = v.videoHeight;
            c.getContext('2d').drawImage(v, 0, 0);
            showPreview(c.toDataURL('image/jpeg'));
            if(stream) stream.getTracks().forEach(t => t.stop());
        }

        function loadFile(event) {
            const reader = new FileReader();
            reader.onload = () => showPreview(reader.result);
            reader.readAsDataURL(event.target.files[0]);
        }

        function showPreview(src) {
            p.src = src;
            p.style.display='block'; v.style.display='none';
            anBtn.style.display='block';
            res.style.display='none';
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
                res.innerHTML = "<strong>التقرير الزراعي:</strong><br><br>" + d.text;
                res.style.display='block';
                res.scrollIntoView({ behavior: 'smooth' });
            } catch(e) { alert("خطأ في الاتصال بالسيرفر"); }
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
                { type: "text", text: "أنت خبير زراعي. حلل صورة النبات وشخص الحالة بالعربية بأسلوب بسيط ومباشر." },
                { type: "image_url", image_url: { url: req.body.image } }
            ]}]
        });
        res.json({ text: response.choices[0].message.content });
    } catch (e) { res.status(500).json({ text: "فشل التحليل: " + e.message }); }
});

app.listen(3000, () => console.log('التطبيق يعمل! شكراً لفريق التطوير بقيادة أحمد ماجد.'));