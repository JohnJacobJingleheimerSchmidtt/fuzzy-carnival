import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// وضعنا المفتاح مباشرة هنا لتجنب أخطاء الإعدادات
const API_KEY = "AIzaSyBa16o1Jv42FfBk8axjnmaTsmI1smKHSfY"; 
const genAI = new GoogleGenerativeAI(API_KEY);

// استخدام النموذج المستقر gemini-1.5-flash
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.json({ limit: '50mb' }));

const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المحلل الذكي المطور</title>
    <style>
        :root { --primary: #4CAF50; --bg: #0f172a; --card: #1e293b; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: white; margin: 0; display: flex; justify-content: center; padding: 20px; }
        .card { background: var(--card); padding: 2rem; border-radius: 24px; width: 100%; max-width: 500px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid #334155; }
        h2 { margin-top: 0; color: var(--primary); text-align: center; }
        video, img { width: 100%; border-radius: 12px; display: none; margin-top: 10px; background: #000; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
        .controls { display: flex; gap: 10px; margin: 20px 0; }
        button { flex: 1; background: var(--primary); color: white; border: none; padding: 14px; border-radius: 12px; cursor: pointer; font-weight: bold; transition: 0.3s; }
        button:hover { filter: brightness(1.1); transform: translateY(-2px); }
        button.secondary { background: #64748b; }
        #analyzeBtn { width: 100%; margin-top: 10px; background: #2563eb; }
        #result { margin-top: 20px; padding: 15px; border-radius: 12px; background: #0f172a; border-right: 6px solid var(--primary); display: none; line-height: 1.7; font-size: 1rem; }
        .loader { display: none; width: 20px; height: 20px; border: 3px solid #FFF; border-bottom-color: transparent; border-radius: 50%; animation: rotation 1s linear infinite; display: inline-block; vertical-align: middle; margin-left: 8px; }
        @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h2>🌿 المحلل الذكي v2.0</h2>
        <p style="color: #94a3b8; text-align: center;">التقط صورة للنبات أو السؤال للتحليل الفوري</p>
        
        <video id="video" autoplay playsinline></video>
        <img id="preview">
        <canvas id="canvas" style="display:none;"></canvas>

        <div class="controls">
            <button id="startCam">فتح الكاميرا</button>
            <button id="captureBtn" class="secondary" style="display:none;">التقاط الصورة</button>
            <button id="uploadBtn" class="secondary" onclick="document.getElementById('fileInput').click()">رفع ملف</button>
        </div>
        
        <input type="file" id="fileInput" accept="image/*" hidden>

        <button id="analyzeBtn" style="display:none;">
            <span id="loader" class="loader" style="display:none;"></span>
            <span id="btnText">بدء التحليل الذكي</span>
        </button>

        <div id="result"></div>
    </div>

    <script>
        const video = document.getElementById