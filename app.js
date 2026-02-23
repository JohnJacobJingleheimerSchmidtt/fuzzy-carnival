import express from 'express';
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد الاتصال بـ SambaNova
// تأكد من إضافة SAMBANOVA_API_KEY في Environment Variables على Render
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
    <title>SambaNova 90B Plant Doctor</title>
    <style>
        :root { --primary: #6366f1; --bg: #f8fafc; --text: #1e293b; }
        body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); display: flex; justify-content: center; padding: 20px; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 24px; width: 100%; max-width: 500px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        h1 { color: var(--primary); font-size: 1.5rem; margin-bottom: 0.5rem; }
        .upload-area { border: 2px dashed #cbd5e1; padding: 30px; border-radius: 20px; cursor: pointer; margin-top: 20px; transition: all 0.3s ease; }
        .upload-area:hover { border-color: var(--primary); background: #f5f3ff; }
        img { width: 100%; border-radius: 15px; display: none; margin-top: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .btn { background: var(--primary); color: white; border: none; padding: 16px; border-radius: 12px; cursor: pointer; width: 100%; font-weight: bold; margin-top: 20px; display: none; font-size: 1rem; transition: 0.2s; }
        .btn:active { transform: scale(0.98); }
        #result { margin-top: 25px; padding: 20px; background: #f1f5f9; border-radius: 15px; text-align: right; line-height: 1.7; display: none; border-right: 5px solid var(--primary); }
        .loader { display: none; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h1>🌿 طبيب النبات (SambaNova 90B)</h1>
        <p>تشخيص فائق الدقة والسرعة لأمراض النباتات</p>
        
        <div class="upload-area" onclick="document.getElementById('f').click()">
            <p id="ut" style="color: #64748b;">اضغط هنا لرفع صورة الورقة المصابة</p>
            <img id="p">
        </div>
        
        <input type="file" id="f" accept="image/*" hidden>
        <button id="btn" class="btn">تحليل الصورة الآن</button>
        
        <div id="loader" class="loader"></div>
        <div id="result"></div>
    </div>

    <script>
        const f=document.getElementById('f'), p=document.getElementById('p'), btn=document.getElementById('btn'), 
              res=document.getElementById('result'), ld=document.getElementById('loader'), ut=document.getElementById('ut');

        f.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const r = new FileReader();
                r.onload = () => {
                    p.src = r.result;
                    p.style.display = 'block';
                    btn.style.display = 'block';
                    ut.style.display = 'none';
                    res.style.display = 'none';
                };
                r.readAsDataURL(file);
            }
        };

        btn.onclick = async () => {
            ld.style.display = 'block';
            btn.disabled = true;
            btn.innerText = 'جاري التحليل السريع...';
            
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ image: p.src })
                });
                const data = await response.json();
                res.innerHTML = "<strong>التقرير الزراعي:</strong><br><br>" + data.analysis.replace(/\\n/g, '<br>');
                res.style.display = 'block';
            } catch (e) {
                alert("حدث خطأ في الاتصال بالسيرفر");
            } finally {
                ld.style.display = 'none';
                btn.disabled = false;
                btn.innerText = 'تحليل الصورة الآن';
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

        const response = await sambanova.chat.completions.create({
            model: "Llama-3.2-90B-Vision-Instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "أنت خبير وقاية نباتات. حلل هذه الصورة بدقة بالعربية: حدد اسم المرض، المسبب، وخطة العلاج." },
                        { type: "image_url", image_url: { "url": image } }
                    ]
                }
            ],
            temperature: 0.1,
            max_tokens: 1024
        });

        res.json({ analysis: response.choices[0].message.content });
    } catch (error) {
        console.error("SambaNova Error:", error);
        res.status(500).json({ analysis: "حدث خطأ فني: " + error.message });
    }
});

app.listen(PORT, () => console.log('SambaNova 90B Server is running!'));