import express from 'express';
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;

// ضع مفتاح OpenAI الخاص بك هنا
const openai = new OpenAI({ apiKey: "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" });

app.use(express.json({ limit: '50mb' }));

const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المحلل الخبير GPT-4o</title>
    <style>
        :root { --primary: #10b981; --bg: #0f172a; --card: #1e293b; }
        body { font-family: system-ui, sans-serif; background: var(--bg); color: white; display: flex; justify-content: center; padding: 20px; margin: 0; }
        .card { background: var(--card); padding: 2rem; border-radius: 24px; width: 100%; max-width: 450px; text-align: center; border: 1px solid #334155; }
        video, img { width: 100%; border-radius: 16px; display: none; margin-top: 15px; border: 2px solid #334155; }
        button { background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: bold; margin: 5px; }
        #btnAnlyz { width: 100%; background: #3b82f6; display: none; margin-top: 15px; }
        #result { margin-top: 25px; padding: 20px; background: #0f172a; border-radius: 16px; display: none; text-align: right; line-height: 1.8; border-right: 4px solid var(--primary); }
        .loader { display: none; border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 10px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h2>🌿 خبير النباتات GPT</h2>
        <video id="v" autoplay playsinline></video>
        <img id="p">
        <canvas id="c" style="display:none;"></canvas>
        <div>
            <button id="btnStart">فتح الكاميرا</button>
            <button id="btnCap" style="display:none; background:#64748b;">التقاط</button>
            <button style="background:#64748b;" onclick="document.getElementById('f').click()">رفع ملف</button>
        </div>
        <input type="file" id="f" accept="image/*" hidden>
        <button id="btnAnlyz"><span id="txt">تحليل بواسطة GPT-4o</span></button>
        <div id="loader" class="loader"></div>
        <div id="result"></div>
    </div>
    <script>
        const v=document.getElementById('v'), p=document.getElementById('p'), c=document.getElementById('c'), btnS=document.getElementById('btnStart'), btnC=document.getElementById('btnCap'), btnA=document.getElementById('btnAnlyz'), res=document.getElementById('result'), ld=document.getElementById('loader'), txt=document.getElementById('txt');
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
            const r=new FileReader(); r.onload=()=>{ p.src=r.result; p.style.display='block'; btnA.style.display='block'; v.style.display='none'; }; r.readAsDataURL(e.target.files[0]);
        };
        btnA.onclick = async () => {
            ld.style.display='block'; txt.innerText='جاري التواصل مع GPT...'; btnA.disabled=true; res.style.display='none';
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
            finally { ld.style.display='none'; txt.innerText='تحليل بواسطة GPT-4o'; btnA.disabled=false; }
        };
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.post('/api/analyze', async (req, res) => {
    try {
        const { image } = req.body;
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "أنت خبير زراعي متخصص في تشخيص أمراض النباتات من الصور. قدم إجابات دقيقة بالعربية تشمل: اسم المرض، السبب، وخيارات العلاج."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "حلل هذه الصورة وأخبرني بحالة النبات." },
                        { type: "image_url", image_url: { "url": image } },
                    ],
                },
            ],
        });
        res.json({ analysis: response.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ analysis: "حدث خطأ: " + error.message });
    }
});

app.listen(PORT, () => console.log('Server is live with GPT-4o!'));