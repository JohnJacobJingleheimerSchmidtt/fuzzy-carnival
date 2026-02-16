import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// مفتاح API مباشر
const API_KEY = "AIzaSyBa16o1Jv42FfBk8axjnmaTsmI1smKHSfY"; 
const genAI = new GoogleGenerativeAI(API_KEY);

// إجبار النظام على استخدام الإصدار المستقر v1
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });

app.use(express.json({ limit: '50mb' }));

const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المحلل الذكي v3.0</title>
    <style>
        :root { --primary: #4CAF50; --bg: #0f172a; --card: #1e293b; }
        body { font-family: sans-serif; background: var(--bg); color: white; display: flex; justify-content: center; padding: 20px; }
        .card { background: var(--card); padding: 2rem; border-radius: 20px; width: 100%; max-width: 450px; text-align: center; }
        video, img { width: 100%; border-radius: 10px; display: none; margin-top: 15px; }
        button { background: var(--primary); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; margin: 5px; font-weight: bold; }
        #result { margin-top: 20px; padding: 15px; background: #0f172a; border-radius: 10px; display: none; text-align: right; line-height: 1.6; }
        .loader { display: none; border: 3px solid #f3f3f3; border-top: 3px solid var(--primary); border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; margin: auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h2>🌿 المحلل الذكي</h2>
        <video id="v" autoplay playsinline></video>
        <img id="p">
        <canvas id="c" style="display:none;"></canvas>
        <div>
            <button id="btnStart">فتح الكاميرا</button>
            <button id="btnCap" style="display:none;">التقاط</button>
            <button onclick="document.getElementById('f').click()">رفع صورة</button>
        </div>
        <input type="file" id="f" accept="image/*" hidden>
        <button id="btnAnlyz" style="display:none; width:100%; background:#2563eb; margin-top:10px;">تحليل الآن</button>
        <div id="loader" class="loader"></div>
        <div id="result"></div>
    </div>
    <script>
        const v=document.getElementById('v'), p=document.getElementById('p'), c=document.getElementById('c');
        const btnS=document.getElementById('btnStart'), btnC=document.getElementById('btnCap'), btnA=document.getElementById('btnAnlyz'), res=document.getElementById('result'), ld=document.getElementById('loader');

        btnS.onclick = async () => {
            const s = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
            v.srcObject=s; v.style.display='block'; p.style.display='none'; btnC.style.display='inline'; btnS.style.display='none';
        };

        btnC.onclick = () => {
            c.width=v.videoWidth; c.height=v.videoHeight;
            c.getContext('2d').drawImage(v,0,0);
            p.src=c.toDataURL('image/jpeg'); p.style.display='block'; v.style.display='none'; btnC.style.display='none'; btnS.style.display='inline'; btnA.style.display='block';
        };

        document.getElementById('f').onchange = (e) => {
            const r=new FileReader(); r.onload=()=>{ p.src=r.result; p.style.display='block'; btnA.style.display='block'; }; r.readAsDataURL(e.target.files[0]);
        };

        btnA.onclick = async () => {
            ld.style.display='block'; btnA.disabled=true; res.style.display='none';
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ image: p.src })
                });
                const data = await response.json();
                res.innerHTML = data.analysis;
                res.style.display = 'block';
            } catch (e) { alert("خطأ في الاتصال"); }
            finally { ld.style.display='none'; btnA.disabled=false; }
        };
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.post('/api/analyze', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ analysis: "لم يتم استلام صورة" });

        const base64Data = image.split(",")[1];
        
        // المحاولة المباشرة للتحليل
        const result = await model.generateContent([
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: "حلل هذه الصورة باللغة العربية واذكر التفاصيل." }
        ]);

        const text = result.response.text();
        res.json({ analysis: text });

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ analysis: "حدث خطأ داخلي: " + error.message });
    }
});

app.listen(PORT, () => console.log('Server is running...'));