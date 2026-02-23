import express from 'express';
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;

const sambanova = new OpenAI({
    apiKey: process.env.SAMBANOVA_API_KEY, 
    baseURL: "https://api.sambanova.ai/v1",
});

app.use(express.json({ limit: '50mb' }));

const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طبيب النبات - كاميرا احترافية</title>
    <style>
        :root { --primary: #10b981; --bg: #0f172a; --accent: #f59e0b; }
        body { font-family: system-ui, sans-serif; background: var(--bg); color: white; display: flex; justify-content: center; padding: 20px; margin: 0; }
        .card { background: #1e293b; padding: 1.5rem; border-radius: 24px; width: 100%; max-width: 500px; text-align: center; border: 1px solid #334155; }
        
        .camera-container { position: relative; width: 100%; border-radius: 15px; overflow: hidden; background: #000; margin-top: 15px; aspect-ratio: 4/3; }
        video, img { width: 100%; height: 100%; object-fit: cover; display: none; }
        
        /* إطار التوجيه */
        .camera-overlay {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 65%; height: 65%; border: 2px dashed var(--accent); border-radius: 15px;
            pointer-events: none; display: none; z-index: 10;
            box-shadow: 0 0 0 1000px rgba(0,0,0,0.4);
        }

        .controls { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 15px; }
        button { border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.2s; font-size: 0.9rem; }
        .btn-main { background: var(--primary); color: white; width: 100%; font-size: 1.1rem; }
        .btn-sec { background: #475569; color: white; flex: 1; min-width: 100px; }
        #btnFlash { background: #334155; color: #fbbf24; display: none; }
        
        #result { margin-top: 25px; padding: 18px; background: #0f172a; border-radius: 15px; text-align: right; display: none; border-right: 5px solid var(--primary); line-height: 1.8; }
        .loader { display: none; border: 4px solid #334155; border-top: 4px solid var(--primary); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 15px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h1>🌿 طبيب النبات الذكي</h1>
        
        <div class="camera-container">
            <video id="v" autoplay playsinline></video>
            <div id="overlay" class="camera-overlay"></div>
            <img id="p">
            <canvas id="c" style="display:none;"></canvas>
        </div>

        <div class="controls">
            <button id="btnStart" class="btn-sec">فتح الكاميرا</button>
            <button id="btnFlash" class="btn-sec">🔦 كشاف</button>
            <button id="btnCap" class="btn-sec" style="display:none; background:#ef4444;">التقاط</button>
            <button class="btn-sec" onclick="document.getElementById('f').click()">صورة من المعرض</button>
        </div>

        <input type="file" id="f" accept="image/*" hidden>
        <button id="btnAnlyz" class="btn-main" style="display:none; margin-top:15px;">تشخيص الإصابة الآن</button>
        
        <div id="loader" class="loader"></div>
        <div id="result"></div>
    </div>

    <script>
        const v=document.getElementById('v'), p=document.getElementById('p'), c=document.getElementById('c'), 
              ov=document.getElementById('overlay'), btnS=document.getElementById('btnStart'), 
              btnF=document.getElementById('btnFlash'), btnC=document.getElementById('btnCap'), 
              btnA=document.getElementById('btnAnlyz'), res=document.getElementById('result'), 
              ld=document.getElementById('loader'), f=document.getElementById('f');

        let stream = null;
        let track = null;
        let flashOn = false;

        btnS.onclick = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: "environment", focusMode: "continuous" } 
                });
                v.srcObject = stream;
                track = stream.getVideoTracks()[0];
                
                v.style.display = 'block';
                ov.style.display = 'block';
                p.style.display = 'none';
                btnC.style.display = 'inline-block';
                btnS.innerText = 'إعادة تشغيل';
                
                // التحقق من دعم الفلاش
                const caps = track.getCapabilities();
                if (caps.torch) btnF.style.display = 'inline-block';
                
            } catch (err) { alert("يرجى السماح بالوصول للكاميرا"); }
        };

        btnF.onclick = async () => {
            if (!track) return;
            flashOn = !flashOn;
            await track.applyConstraints({ advanced: [{ torch: flashOn }] });
            btnF.innerText = flashOn ? 'إطفاء الكشاف' : '🔦 كشاف';
        };

        btnC.onclick = () => {
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            c.getContext('2d').drawImage(v, 0, 0);
            p.src = c.toDataURL('image/jpeg', 0.8);
            p.style.display = 'block';
            v.style.display = 'none';
            ov.style.display = 'none';
            btnC.style.display = 'none';
            btnF.style.display = 'none';
            btnA.style.display = 'block';
            if(stream) stream.getTracks().forEach(t => t.stop());
        };

        f.onchange = (e) => {
            const r = new FileReader();
            r.onload = () => {
                p.src = r.result;
                p.style.display = 'block';
                v.style.display = 'none';
                ov.style.display = 'none';
                btnA.style.display = 'block';
                btnC.style.display = 'none';
            };
            r.readAsDataURL(e.target.files[0]);
        };

        btnA.onclick = async () => {
            ld.style.display = 'block';
            btnA.disabled = true;
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ image: p.src })
                });
                const data = await response.json();
                res.innerHTML = "<strong>التحليل الفوري:</strong><br><br>" + data.analysis;
                res.style.display = 'block';
                res.scrollIntoView({ behavior: 'smooth' });
            } catch (e) { alert("خطأ في الاتصال"); }
            finally { ld.style.display = 'none'; btnA.disabled = false; }
        };
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.post('/api/analyze', async (req, res) => {
    try {
        const { image } = req.body;
        const response = await sambanova.chat.completions.create({
            model: "Llama-4-Maverick-17B-128E-Instruct", 
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "أنت طبيب نباتات خبير. صف المرض في الصورة بدقة وقدم نصائح علاجية فورية بالعربية." },
                        { type: "image_url", image_url: { "url": image } }
                    ]
                }
            ],
        });
        res.json({ analysis: response.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ analysis: "فشل التحليل: " + error.message });
    }
});

app.listen(PORT, () => console.log('Ready with Torch Support!'));