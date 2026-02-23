import express from 'express';
import OpenAI from "openai";

const app = express();
const sambanova = new OpenAI({
    apiKey: process.env.SAMBANOVA_API_KEY || "YOUR_KEY",
    baseURL: "https://api.sambanova.ai/v1",
});

app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>محلل النبات</title>
    <style>
        body { font-family: sans-serif; background: #111; color: white; text-align: center; padding: 20px; }
        .box { background: #222; padding: 20px; border-radius: 20px; max-width: 500px; margin: auto; border: 1px solid #444; }
        .cam-wrap { position: relative; width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 10px; overflow: hidden; margin: 15px 0; }
        video, img { width: 100%; height: 100%; object-fit: cover; }
        .overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60%; height: 60%; border: 2px dashed #10b981; border-radius: 10px; pointer-events: none; }
        button { background: #10b981; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; margin: 5px; font-weight: bold; }
        #res { margin-top: 20px; text-align: right; background: #333; padding: 15px; border-radius: 10px; display: none; }
    </style>
</head>
<body>
    <div class="box">
        <h2>🌿 طبيب النبات</h2>
        <div class="cam-wrap">
            <video id="v" autoplay playsinline></video>
            <div id="ov" class="overlay"></div>
            <img id="p" style="display:none;">
        </div>
        <button onclick="startCam()">فتح الكاميرا</button>
        <button id="fBtn" onclick="toggleFlash()" style="display:none;">🔦 كشاف</button>
        <button onclick="takePic()">التقاط</button>
        <button id="anBtn" onclick="analyze()" style="display:none; background:#3b82f6;">تحليل الآن</button>
        <div id="ld" style="display:none;">جاري الفحص...</div>
        <div id="res"></div>
    </div>

    <script>
        let stream, track, flash = false;
        const v=document.getElementById('v'), p=document.getElementById('p'), res=document.getElementById('res');

        async function startCam() {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            v.srcObject = stream;
            track = stream.getVideoTracks()[0];
            if (track.getCapabilities().torch) document.getElementById('fBtn').style.display='inline';
        }

        async function toggleFlash() {
            flash = !flash;
            await track.applyConstraints({ advanced: [{ torch: flash }] });
        }

        function takePic() {
            const c = document.createElement('canvas');
            c.width = v.videoWidth; c.height = v.videoHeight;
            c.getContext('2d').drawImage(v, 0, 0);
            p.src = c.toDataURL('image/jpeg');
            p.style.display='block'; v.style.display='none';
            document.getElementById('ov').style.display='none';
            document.getElementById('anBtn').style.display='inline-block';
            stream.getTracks().forEach(t => t.stop());
        }

        async function analyze() {
            document.getElementById('ld').style.display='block';
            const r = await fetch('/analyze', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ image: p.src })
            });
            const d = await r.json();
            res.innerHTML = d.text; res.style.display='block';
            document.getElementById('ld').style.display='none';
        }
    </script>
</body>
</html>
`));

app.post('/analyze', async (req, res) => {
    const response = await sambanova.chat.completions.create({
        model: "Llama-4-Maverick-17B-128E-Instruct",
        messages: [{ role: "user", content: [
            { type: "text", text: "شخص حالة النبات في الصورة بالعربية." },
            { type: "image_url", image_url: { url: req.body.image } }
        ]}]
    });
    res.json({ text: response.choices[0].message.content });
});

app.listen(3000);