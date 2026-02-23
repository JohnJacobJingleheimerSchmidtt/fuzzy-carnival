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
    <title>طبيب النبات</title>
    <style>
        body { font-family: sans-serif; background: #111; color: white; text-align: center; padding: 20px; }
        .box { background: #222; padding: 20px; border-radius: 20px; max-width: 500px; margin: auto; }
        .preview-box { width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 10px; overflow: hidden; margin: 15px 0; }
        video, img { width: 100%; height: 100%; object-fit: cover; }
        button { background: #10b981; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; margin: 5px; font-weight: bold; }
        #res { margin-top: 20px; text-align: right; background: #333; padding: 15px; border-radius: 10px; display: none; }
    </style>
</head>
<body>
    <div class="box">
        <h2>🌿 طبيب النبات</h2>
        
        <div class="preview-box">
            <video id="v" autoplay playsinline></video>
            <img id="p" style="display:none;">
        </div>

        <div style="margin-bottom: 10px;">
            <button onclick="startCam()">تشغيل الكاميرا</button>
            <button onclick="takePic()">التقاط صورة</button>
        </div>
        
        <div style="border-top: 1px solid #444; padding-top: 10px;">
            <p>أو اختر صورة من جهازك:</p>
            <input type="file" id="f" accept="image/*" style="display:none;" onchange="loadFile(event)">
            <button onclick="document.getElementById('f').click()" style="background:#4b5563;">📁 اختيار صورة</button>
        </div>

        <button id="anBtn" onclick="analyze()" style="display:none; background:#3b82f6; width:100%; margin-top:20px;">تحليل الإصابة الآن</button>
        <div id="ld" style="display:none; margin-top:10px;">جاري الفحص...</div>
        <div id="res"></div>
    </div>

    <script>
        let stream;
        const v=document.getElementById('v'), p=document.getElementById('p'), res=document.getElementById('res'), anBtn=document.getElementById('anBtn');

        async function startCam() {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            v.srcObject = stream;
            v.style.display='block'; p.style.display='none';
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
                res.innerHTML = "<b>التشخيص:</b><br>" + d.text;
                res.style.display='block';
            } catch(e) { alert("حدث خطأ في الاتصال"); }
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
                { type: "text", text: "شخص حالة هذا النبات بالعربية بوضوح." },
                { type: "image_url", image_url: { url: req.body.image } }
            ]}]
        });
        res.json({ text: response.choices[0].message.content });
    } catch (e) { res.status(500).json({ text: e.message }); }
});

app.listen(3000);