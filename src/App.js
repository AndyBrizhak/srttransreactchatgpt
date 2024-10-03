import React, { useState } from "react";
import { parse, stringify } from "subtitle";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [translatedSubtitles, setTranslatedSubtitles] = useState([]);

  // Обработка загрузки файла
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const parsedSubtitles = parse(content);  // Парсинг SRT
        setSubtitles(parsedSubtitles);
      };
      reader.readAsText(file);
    }
  };

  // Функция для перевода текста через API ChatGPT
  const translateText = async (text) => {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant that translates text from English to Russian." },
            { role: "user", content: text }
          ],
        },
        {
          headers: {
            Authorization: `Bearer YOUR_API_KEY`,  // Ваш ключ API
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Ошибка перевода:", error);
      return text;  // Возвращаем оригинальный текст, если произошла ошибка
    }
  };

  // Обработка перевода субтитров
  const handleTranslate = async () => {
    const translated = await Promise.all(
      subtitles.map(async (subtitle) => {
        const translatedText = await translateText(subtitle.text);
        return { ...subtitle, text: translatedText };
      })
    );
    setTranslatedSubtitles(translated);
  };

  // Сохранение переведённых субтитров в файл
  const handleDownload = () => {
    const translatedContent = stringify(translatedSubtitles);
    const blob = new Blob([translatedContent], { type: "text/srt" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "translated_subtitles.srt";
    link.click();
  };

  return (
    <div>
      <h1>Перевод субтитров</h1>
      <input type="file" accept=".srt" onChange={handleFileUpload} />
      {subtitles.length > 0 && <button onClick={handleTranslate}>Перевести</button>}
      {translatedSubtitles.length > 0 && <button onClick={handleDownload}>Скачать переведённые субтитры</button>}
    </div>
  );
}

export default App;
