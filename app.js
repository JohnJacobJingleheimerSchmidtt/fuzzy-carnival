import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = "AIzaSyBa16o1Jv42FfBk8axjnmaTsmI1smKHSfY"; 
const genAI = new GoogleGenerativeAI(API_KEY);

// التعديل الجوهري: استخدام الإصدار v1 المستقر صراحةً
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash" 
}, { apiVersion: 'v1' });

app.use(express.json({ limit: '50mb' }));

// ... باقي الكود الخاص بـ htmlContent (كما هو في النسخة السابقة) ...
// تأكد من نسخ الكود كاملاً حتى نهاية ملف app.js

app.get('/', (req, res) => res.send(htmlContent));

app.post('/api/analyze', async (req, res) => {
    try {
        const { image } = req.body;
        const base64Data = image.split(",")[1];
        
        const result = await model.generateContent([
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: "حلل هذه الصورة باللغة العربية واشرح ما فيها بدقة." }
        ]);
        
        res.json({ analysis: result.response.text() });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ analysis: "خطأ في السيرفر: " + e.message }); 
    }
});

app.listen(PORT, () => console.log('Server is running...'));