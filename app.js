import express from 'express';
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد SambaNova بالمفتاح والنموذج الجديد من الصورة
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
    <title>SambaNova Maverick Plant Doctor</title>
    <style>
        :root { --primary: #8b5cf6; --bg: #0f172a; }
        body { font-family: system-ui, sans-serif; background: var(--bg); color: white; display: flex; justify-content: center; padding: 20px; }
        .card { background: #1e293b; padding: 2rem; border-radius: 24px; width: 100%; max-width: 500px; text-align: center; border: 1px solid #334155; }
        .upload-area { border: 2px dashed #475569; padding: 30px; border-radius: 20px; cursor: pointer; margin-top: 20px; }
        img { width: 100%; border-radius: 15px; display: none; margin-top: 15px; border: 2px solid var(--primary); }
        button { background: var(--primary); color: white; border: none; padding: 16px; border-radius: 12px; cursor: pointer; width: 100%; font-weight: bold; margin-top: 20px; display: none; }
        #result { margin-top: 25px; padding: 20px; background: #0f172a; border-radius: 15px; text-align: right; line-height: 1.7; display: none; border-right: 5px solid var(--primary); }
        .loader { display: none; border: 4px solid #334155; border-top: 4px solid var(--primary); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h1>🌿 طبيب النبات (Llama 4)</h1>
        <p>تحليل ذكي باستخدام نموذج Maverick الجديد</p>
        <div class="upload-area" onclick="document.getElementById('f').click()">
            <p id="ut">ارفع صورة النبات هنا</p>
            <img id="p">
        </div>
        <input type="file" id="f" accept="image/*" hidden>
        <button id="btn">ابدأ التشخيص المتقدم</button>
        <div id="loader" class="loader"></div>
        <div id="result"></div>
    </div>
    <script>
        const f=document.getElementById('f'), p=document.getElementById('p'), btn=document.getElementById('btn'), res=document.getElementById('result'), ld=document.getElementById('loader');
        f.onchange = (e) => {
            const r = new FileReader();
            r.onload = () => { p.src = r.result; p.style.display = 'block'; btn.style.display = 'block'; document.getElementById('ut').style.display='none'; };
            r.readAsDataURL(e.target.files[0]);
        };
        btn.onclick = async () => {
            ld.style.display = 'block'; btn.disabled = true; res.style.display = 'none';
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ image: p.src })
                });
                const data = await response.json();
                res.innerHTML = "<strong>التحخيص الزراعي:</strong><br><br>" + data.analysis;
                res.style.display = 'block';
            } catch (e) { alert("حدث خطأ في الخادم"); }
            finally { ld.style.display = 'none'; btn.disabled = false; }
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
            // تم تحديث اسم الموديل بناءً على الصورة التي أرسلتها
            model: "Llama-4-Maverick-17B-128E-Instruct", 
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "أنت خبير وقاية نباتات. حلل هذه الصورة بدقة بالعربية: حدد المرض، السبب، والعلاج." },
                        { type: "image_url", image_url: { "url": image } }
                    ]
                }
            ],
            max_tokens: 1000
        });

        res.json({ analysis: response.choices[0].message.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ analysis: "خطأ في النموذج: " + error.message });
    }
});

app.listen(PORT, () => console.log('Maverick Server is Live!'));