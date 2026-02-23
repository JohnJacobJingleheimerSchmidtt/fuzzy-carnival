import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// استبدل المفتاح بمفتاحك الخاص
const API_KEY = "AIzaSyBa16o1Jv42FfBk8axjnmaTsmI1smKHSfY"; 
const genAI = new GoogleGenerativeAI(API_KEY);

// إعداد النموذج مع تعليمات النظام الصحيحة للإصدار v1
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    system_instruction: "أنت خبير زراعي متخصص. عند استلام صورة، شخص حالة النبات وقدم نصائح دقيقة بالعربية."
});

app.use(express.json({ limit: '50mb' }));

const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>محلل النباتات</title>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: white; text-align: center; padding: 20px; }
        .card { background: #1e293b; padding: 20px; border-radius: 15px; max-width: 400px; margin: auto; }
        img { width: 100%; border-radius: 10px; display: none; margin-top: 10px; }
        button { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin: 5px; }
        #result { margin-top: 20px; text-align: right; background: #0f172a; padding: 15px; border-radius: 10px; display: none; }
    </style>
</head>
<body>
    <div class="card">
        <h2>🌿 فحص النباتات</h2>
        <input type="file" id="f" accept="image/*" hidden>
        <button onclick="document.getElementById('f').click()">اختر صورة</button>
        <img id="p">
        <button id="btn" style="display:none; width:100%; background:#3b82f6; margin-top:10px;">تحليل الآن</button>
        <div id="result"></div>
    </div>
    <script>
        const f=document.getElementById('f'), p=document.getElementById('p'), btn=document.getElementById('btn'), res=document.getElementById('result');
        f.onchange = (e) => {
            const r=new FileReader(); r.onload=()=>{ p.src=r.result; p.style.display='block'; btn.style.display='block'; }; r.readAsDataURL(e.target.files[0]);
        };
        btn.onclick = async () => {
            btn.innerText='جاري التحليل...'; btn.disabled=true;
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ image: p.src })
            });
            const data = await response.json();
            res.innerText = data.analysis;
            res.style.display = 'block';
            btn.innerText='تحليل الآن'; btn.disabled=false;
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
        
        // إرسال الصورة كبيانات مضمنة (Inline Data)
        const result = await model.generateContent([
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: "حلل هذه الصورة زراعياً." }
        ]);
        
        res.json({ analysis: result.response.text() });
    } catch (error) {
        res.status(500).json({ analysis: "خطأ: " + error.message });
    }
});

app.listen(PORT, () => console.log('جاهز على المنفذ ' + PORT));