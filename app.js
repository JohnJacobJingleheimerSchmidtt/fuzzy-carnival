import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// مفتاح API المباشر
const API_KEY = "AIzaSyBa16o1Jv42FfBk8axjnmaTsmI1smKHSfY"; 
const genAI = new GoogleGenerativeAI(API_KEY);

// استخدام أحدث نسخة مستقرة لتجنب خطأ 404
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

app.use(express.json({ limit: '50mb' }));

const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المحلل الذكي v4.0</title>
    <style>
        :root { --primary: #10b981; --bg: #0f172a; --card: #1e293b; }
        body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: white; display: flex; justify-content: center; padding: 20px; margin: 0; }
        .card { background: var(--card); padding: 2rem; border-radius: 24px; width: 100%; max-width: 450px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid #334155; }
        h2 { color: var(--primary); margin-bottom: 1rem; }
        video, img { width: 100%; border-radius: 16px; display: none; margin-top: 15px; border: 2px solid #334155; }
        .btn-group { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 20px; }
        button { background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: bold; transition: 0.2s; }
        button:hover { opacity: 0.9; transform: scale(1.02); }
        button.secondary { background: #64748b; }
        #btnAnlyz { width: 100%; background: #3b82f6; display: none; margin-top: 15px; font-size: 1.1rem; }
        #result { margin-top: 25px; padding: 20px; background: #0f172a; border-radius: 16px; display: none; text-align: right; line-height: 1.8; border-right: 4px solid var(--primary); font-size: 0.95rem; }
        .loader { display: none; border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 10px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h2>🌿 المحلل الذكي</h2>
        <p style="color: #94a3b8; font-size: 0.9rem;">التقط صورة للنبات أو السؤال للتحليل</p>
        
        <video id="v" autoplay playsinline></video>
        <img id="p">
        <canvas id="c" style="display:none;"></canvas>

        <div class="btn-group">
            <button id="btnStart">فتح الكاميرا</button>
            <button id="btnCap" class="secondary" style="display:none;">التقاط الصورة</button>
            <button class="secondary" onclick="document.getElementById('f').click()">رفع ملف</button>
        </div>

        <input type="file" id="f" accept="image/*" hidden>
        
        <button id="btnAnlyz">
            <span id="btnText">بدء التحليل الذكي</span>
        </button>
        
        <div id="loader" class="loader"></div>
        <div id="result"></div>
    </div>

    <script>
        const v=document.getElementById('v'), p=document.getElementById('p'), c=document.getElementById('c');
        const btnS=document.getElementById('btnStart'), btnC=document.getElementById('btnCap'), btnA=document.getElementById('btnAnlyz'), res=document.getElementById('result'), ld=document.getElementById('loader'), txt=document.getElementById('btnText');

        btnS.onclick = async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
                v.srcObject=s; v.style.display='block'; p.style.display='none'; btnC.style.display='inline'; btnS.style.display='none';
            } catch (e) { alert("يرجى استخدام HTTPS والسماح بالكاميرا."); }
        };

        btnC.onclick = () => {
            c.width=v.videoWidth; c.height=v.videoHeight;
            c.getContext('2d').drawImage(v,0,0);
            p.src=c.toDataURL('image/jpeg'); p.style.display='block'; v.style.display='none'; btnC.style.display='none'; btnS.style.display='inline'; btnA.style.display='block';
        };

        document.getElementById('f').onchange = (e) => {
            const r=new FileReader(); r.onload=()=>{ p.src=r.result; p.style.display='block'; btnA.style.display='block'; v.style.display='none'; }; r.readAsDataURL(e.target.files[0]);
        };

        btnA.onclick = async () => {
            ld.style.display='block'; txt.innerText='جاري المعالجة...'; btnA.disabled=true; res.style.display='none';
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ image: p.src })
                });
                const data = await response.json();
                res.innerHTML = data.analysis.replace(/\\n/g, '<br>');
                res.style.display = 'block';
            } catch (e) { alert("حدث خطأ في الاتصال بالسيرفر"); }
            finally { ld.style.display='none'; txt.innerText='بدء التحليل الذكي'; btnA.disabled=false; }
        };
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.post('/api/analyze', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ analysis: "يرجى اختيار صورة أولاً." });

        const base64Data = image.split(",")[1];
        
        const result = await model.generateContent([
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: "حلل هذه الصورة باللغة العربية. إذا كان نباتاً حدد نوعه وحالته، وإذا كان سؤالاً قم بحله." }
        ]);

        res.json({ analysis: result.response.text() });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ analysis: "حدث خطأ: " + error.message });
    }
});

app.listen(PORT, () => console.log('السيرفر جاهز!'));