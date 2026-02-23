import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ جلب المفتاح من Render Environment
const API_KEY = process.env.GEMINI_API_KEY;

// لا نغلق السيرفر إذا لم يوجد المفتاح، فقط نظهر تحذير
if (!API_KEY) {
  console.warn("⚠️ تحذير: GEMINI_API_KEY غير موجود في Environment Variables");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const model = genAI
  ? genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    })
  : null;

app.use(express.json({ limit: "50mb" }));

// الصفحة الأمامية
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>محلل النباتات</title>
<style>
body{font-family:sans-serif;background:#0f172a;color:white;text-align:center;padding:20px}
.card{background:#1e293b;padding:20px;border-radius:15px;max-width:400px;margin:auto}
img{width:100%;border-radius:10px;display:none;margin-top:10px}
button{background:#10b981;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin:5px}
#result{margin-top:20px;text-align:right;background:#0f172a;padding:15px;border-radius:10px;display:none}
</style>
</head>
<body>
<div class="card">
<h2>🌿 فحص النباتات</h2>
<input type="file" id="file" accept="image/*" hidden>
<button onclick="document.getElementById('file').click()">اختر صورة</button>
<img id="preview">
<button id="analyze" style="display:none;width:100%;background:#3b82f6;margin-top:10px;">تحليل</button>
<div id="result"></div>
</div>

<script>
const file=document.getElementById('file');
const preview=document.getElementById('preview');
const analyze=document.getElementById('analyze');
const result=document.getElementById('result');

file.onchange = (e)=>{
 const reader=new FileReader();
 reader.onload=()=>{
   preview.src=reader.result;
   preview.style.display='block';
   analyze.style.display='block';
 };
 reader.readAsDataURL(e.target.files[0]);
};

analyze.onclick = async ()=>{
 analyze.innerText='جاري التحليل...';
 analyze.disabled=true;

 const res = await fetch('/api/analyze',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({image:preview.src})
 });

 const data = await res.json();
 result.innerText = data.analysis;
 result.style.display='block';

 analyze.innerText='تحليل';
 analyze.disabled=false;
};
</script>
</body>
</html>
`);
});

// API التحليل
app.post("/api/analyze", async (req, res) => {
  try {
    if (!model) {
      return res.json({ analysis: "⚠️ لم يتم إعداد مفتاح API في السيرفر." });
    }

    const { image } = req.body;
    if (!image) {
      return res.json({ analysis: "لم يتم إرسال صورة." });
    }

    const base64Data = image.split(",")[1];

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      },
      { text: "حلل هذه الصورة زراعياً وشخص حالة النبات وقدم نصائح بالعربية." }
    ]);

    res.json({ analysis: result.response.text() });

  } catch (error) {
    console.error(error);
    res.json({ analysis: "حدث خطأ أثناء التحليل." });
  }
});

app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});