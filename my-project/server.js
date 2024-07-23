const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Создание маршрута для обработки формы
app.post('/submit', upload.array('property-documents'), (req, res) => {
    const formData = req.body;
    const files = req.files;

    // Логирование данных формы и файлов
    console.log('Form Data:', formData);
    console.log('Uploaded Files:', files);

    // Сохранение данных формы в JSON
    const savePath = path.join(__dirname, 'data');
    if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath);
    }

    const dataFilePath = path.join(savePath, 'formData.json');
    fs.writeFileSync(dataFilePath, JSON.stringify(formData, null, 2));

    // Форматирование текста письма с вопросами и ответами
    const emailText = `
    Результаты анкеты:

    1. Укажите свои ФИО (полностью):
    ${formData.fio}

    2. Укажите свой ИИН:
    ${formData.iin}

    3. Укажите свой номер телефона:
    ${formData.phone}

    4. Укажите свою электронную почту:
    ${formData.email}

    5. Являетесь ли Вы резидентом РК?
    ${formData.resident === 'yes' ? 'Да' : 'Нет'}

    6. Если ответ на вопрос 5 «Нет», то укажите страну резидентства:
    ${formData.country || 'Не указано'}

    7. Имеется ли у Вас недвижимое имущество зарегистрированное в иностранном государстве?
    ${formData.property === 'yes' ? 'Да' : 'Нет'}

    8. Укажите вид недвижимого имущества зарегистрированного в иностранном государстве:
    ${formData['property-type'] || 'Не указано'}

    9. Укажите страну регистрации недвижимого имущества:
    ${formData['property-country'] || 'Не указано'}

    10. Укажите идентификационный (кадастровый) номер недвижимого имущества на основании правоустанавливающих документов:
    ${formData['property-id'] || 'Не указано'}

    11. Укажите место нахождения (адрес) недвижимого имущества зарегистрированного за пределами Республики Казахстан:
    ${formData['property-address'] || 'Не указано'}
    `;

    // Подготовка вложений для отправки по email
    const attachments = files.map(file => ({
        filename: file.originalname,
        path: file.path
    }));

    attachments.push({
        filename: 'formData.json',
        path: dataFilePath
    });

    // Настройки и отправка email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-email-password'
        }
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'recipient-email@gmail.com',
        subject: 'Form Submission',
        text: emailText,
        attachments: attachments
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: 'Error sending email', error });
        }
        console.log('Email sent:', info.response);
        res.json({ message: 'Form submitted and files sent successfully' });
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
