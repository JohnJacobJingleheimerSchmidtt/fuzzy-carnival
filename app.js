import express from 'express';
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;

// الاتصال بـ SambaNova باستخدام مكتبة OpenAI
const sambanova = new OpenAI({
    apiKey: process.env.SAMBANOVA_API_KEY || "ضع_مفتاحك_هنا_للتجربة_المحلية",
    baseURL: "https://api.sambanova.ai/v1",
});

app.use(express.json({ limit: '50mb' }));

// واجهة المستخدم الاحترافية
const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SambaNova Plant Doctor</title>
    <style>
        :root { --primary: #4f46e5; --bg: #fdfdfd; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); display: flex; justify-content: center; padding: 20px; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 25px; width: 100%; max-width: 500px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.05); border: 1px solid #eee; }
        h1 { color: var(--primary); font-size: 1.8rem; margin-bottom: 5px; }
        .upload-box { border: 2px dashed #cbd5e1; padding: 40px 20px; border-radius: 20px; cursor: pointer; margin-top: 20px; transition: 0.3s; }
        .upload-box:hover { border-color: var(--primary); background: #f5f3ff; }
        img { width: 100%; border-radius: 15px; display: none; margin-top: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .btn { background: var(--primary); color: white; border: none; padding: 16px; border-radius: 14px; cursor: pointer; width: 100%; font-weight: 600; margin-top: 20px; display: none; font-size: 1rem; }
        #result { margin-top: 25px; padding: 20px; background: #f8fafc; border-radius: 18px; text-align: right; line-height: 1.7; display: none; border-right: 6px solid var(--primary); color: #334155; }
        .loader { display: none; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; width: 35px; height: 35px; animation: spin 0.8s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h1>🚀 طبيب النبات السريع</h1>
        <p style="color:#64748b">تشخيص زراعي فوري مدعوم بـ SambaNova AI</p>
        <div class="upload-box" onclick="document.getElementById('f').click()">
            <p id="ut" style="margin:0; color:#94a3b8">اضغط هنا لرفع صورة الورقة المصابة</p>
            <img id="p">
        </div>
        <input type="file" id="f" accept="image/*" hidden>
        <button id="btn" class="btn">بدء التشخيص الفوري</button>
        <div id="loader" class="loader"></div>
        <div id="result"></div>
    </div>
    <script>
        const f=document.getElementById('f'), p=document.getElementById('p'), btn=document.getElementById('btn'), res=document.getElementById('result'), ld=document.getElementById('loader'), ut=document.getElementById('ut');
        f.onchange = (e) => {
            const r = new FileReader();
            r.onload = () => { p.src = r.result; p.style.display = 'block'; btn.style.display = 'block'; ut.style.display='none'; res.style.display='none'; };
            r.readAsDataURL(e.target.files[0]);
        };
        btn.onclick = async () => {
            ld.style.display = 'block'; btn.disabled = true; btn.style.opacity = '0.7';
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ image: p.src })
                });
                const data = await response.json();
                res.innerHTML = "<strong>التقرير الزراعي:</strong><br><br>" + data.analysis.replace(/\\n/g, '<br>');
                res.style.display = 'block';
            } catch (e) { alert("فشل الاتصال بـ SambaNova"); }
            finally { ld.style.display = 'none'; btn.disabled = false; btn.style.opacity = '1'; }
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
            model: "Llama-3.2-11B-Vision-Instruct",
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
            max_tokens: 1000
        });

        res.json({ analysis: response.choices[0].message.content });
    } catch (error) {
        console.error("SambaNova Error:", error);
        res.status(500).json({ analysis: "حدث خطأ فني: " + error.message });
    }
});

app.listen(PORT, () => console.log('SambaNova Server is Active!'));