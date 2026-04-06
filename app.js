import express from 'express';
import OpenAI from "openai";

const app = express();
const sambanova = new OpenAI({
    apiKey: process.env.SAMBANOVA_API_KEY,
    baseURL: "https://api.sambanova.ai/v1",
});

app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>طبيب النبات والمراقب البيئي</title>
    <style>
        :root { --primary: #10b981; --bg: #0f172a; }
        body { font-family: sans-serif; background: var(--bg); color: white; padding: 20px; text-align: center; }
        .box { background: #1e293b; padding: 20px; border-radius: 20px; max-width: 500px; margin: auto; }
        .env-monitor { background: #0f172a; padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid var(--primary); }
        input[type="number"] { width: 60px; padding: 5px; border-radius: 5px; border: none; }
        button { background: var(--primary); color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; margin: 5px; }
        #res { margin-top: 15px; padding: 10px; background: #334155; border-radius: 10px; display: none; }
    </style>
</head>
<body>
    <div class="box">
        <h1>🌿 طبيب النبات</h1>
        
        <div class="env-monitor">
            <p>كم عدد النباتات في غرفتك؟</p>
            <input type="number" id="plantCount" value="1" min="0">
            <button onclick="checkEnvironment()">فحص جودة الهواء والمزاج</button>
            <div id="envRes" style="margin-top:10px; color: #fbbf24;"></div>
        </div>

        <div id="res"></div>
        
        <div style="margin-top: 20px; font-size: 0.8rem; color: #94a3b8;">
            فريق العمل: أحمد ماجد، محمد حسن، علي سعود، أحمد راشد.
        </div>
    </div>

    <script>
        function checkEnvironment() {
            const count = document.getElementById('plantCount').value;
            let quality = count > 5 ? "ممتازة (مستوى أكسجين عالي)" : "متوسطة (تحتاج نباتات إضافية)";
            let mood = count > 3 ? "إيجابي ومريح" : "محايد";
            document.getElementById('envRes').innerHTML = 
                "جودة الهواء: " + quality + "<br>التأثير النفسي: " + mood;
        }
    </script>
</body>
</html>
`));

app.listen(3000);