import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// استدعاء المفتاح من Environment Variables للأمان
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.json({ limit: '50mb' }));

const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المحلل الذكي - كاميرا مباشرة</title>
    <style>
        :root { --primary: #4CAF50; --bg: #0f172a; --card: #1e293b; }
        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); color: white; margin: 0; display: flex; justify-content: center; padding: 20px; }
        .card { background: var(--card); padding: 2rem; border-radius: 24px; width: 100%; max-width: 500px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
        video, img { width: 100%; border-radius: 12px; display: none; margin-top: 10px; background: #000; }
        .controls { display: flex; gap: 10px; margin: 20px 0; }
        button { flex: 1; background: var(--primary); color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; }
        button.secondary { background: #64748b; }
        #result { margin-top: 20px; padding: 15px; border-radius: 12px; background: #0f172a; border-right: 5px solid var(--primary); display: none; line-height: 1.6; }
        .loader { display: none; width: 18px; height: 18px; border: 2px solid #FFF; border-bottom-color: transparent; border-radius: 50%; animation: rot 1s linear infinite; vertical-align: middle; }
        @keyframes rot { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h2>🌿 المحلل الذكي (كاميرا)</h2>
        <video id="video" autoplay playsinline></video>
        <img id="preview">
        <canvas id="canvas" style="display:none;"></canvas>
        <div class="controls">
            <button id="startCam">فتح الكاميرا</button>
            <button id="captureBtn" class="secondary" style="display:none;">التقاط</button>
            <button id="uploadBtn" class="secondary" onclick="document.getElementById('fileInput').click()">رفع ملف</button>
        </div>
        <input type="file" id="fileInput" accept="image/*" hidden>
        <button id="analyzeBtn" style="width:100%; margin-top:10px; display:none;">
            <span id="loader" class="loader"></span> بدء التحليل
        </button>
        <div id="result"></div>
    </div>
    <script>
        const video = document.getElementById('video');
        const preview = document.getElementById('preview');
        const canvas = document.getElementById('canvas');
        const startCam = document.getElementById('startCam');
        const captureBtn = document.getElementById('captureBtn');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const fileInput = document.getElementById('fileInput');
        const resultDiv = document.getElementById('result');

        startCam.onclick = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                video.srcObject = stream;
                video.style.display = 'block';
                preview.style.display = 'none';
                captureBtn.style.display = 'inline-block';
                startCam.style.display = 'none';
            } catch (err) { alert("تعذر الوصول للكاميرا. تأكد من استخدام HTTPS وإعطاء الإذن."); }
        };

        captureBtn.onclick = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            preview.src = canvas.toDataURL('image/jpeg');
            preview.style.display = 'block';
            video.style.display = 'none';
            captureBtn.style.display = 'none';
            startCam.style.display = 'inline-block';
            startCam.innerText = "إعادة التقاط";
            analyzeBtn.style.display = 'block';
        };

        fileInput.onchange = (e) => {
            const reader = new FileReader();
            reader.onload = () => {
                preview.src = reader.result;
                preview.style.display = 'block';
                video.style.display = 'none';
                analyzeBtn.style.display = 'block';
            };
            reader.readAsDataURL(e.target.files[0]);
        };

        analyzeBtn.onclick = async () => {
            document.getElementById('loader').style.display = 'inline-block';
            analyzeBtn.disabled = true;
            resultDiv.style.display = 'none';
            try {
                const res = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ image: preview.src })
                });
                const data = await res.json();
                resultDiv.innerHTML = data.analysis.replace(/\\n/g, '<br>');
                resultDiv.style.display = 'block';
            } catch (err) { alert("حدث خطأ في التحليل"); }
            finally {
                document.getElementById('loader').style.display = 'none';
                analyzeBtn.disabled = false;
            }
        };
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.post('/api/analyze', async (req, res) => {
    try {
        const { image } = req.body;
        const base64Data = image.split(",")[1];
        const result = await model.generateContent([
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: "حلل الصورة بدقة باللغة العربية. إذا كان نباتاً اذكر حالته وعلاجه، وإذا كان سؤالاً تعليمياً قم بحله." }
        ]);
        res.json({ analysis: result.response.text() });
    } catch (e) { res.status(500).json({ analysis: "خطأ: " + e.message }); }
});

app.listen(PORT, () => console.log('Server is running...'));