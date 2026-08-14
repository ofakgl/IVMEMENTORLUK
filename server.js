require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 

const twilioClient = twilio('AC9d656c107e8c525da4f9fed331d3e68a', 'fa901bd223b76b14cec5602'); 
const TWILIO_PHONE_NUMBER = '+17372212163';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'akgulofaruk@gmail.com',
        pass: 'wrmcqgfazspoxvpw'
    }
});

const ADMIN_EMAIL = 'akgulomerfaruk16@gmail.com';

// GEÇİCİ HAFIZA: Üretilen kodları e-posta adresleriyle eşleştirip burada tutuyoruz
const verificationStore = {};

const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. AŞAMA: KOD GÖNDERME
app.post('/api/verify', async (req, res) => {
    const { name, email, phone } = req.body;

    if (!email || !phone) {
        return res.status(400).json({ success: false, error: 'E-posta ve telefon numarası zorunludur.' });
    }

    const verificationCode = generateVerificationCode();
    
    // Kodu sisteme kaydediyoruz ki birazdan kontrol edebilelim
    verificationStore[email] = verificationCode;

    try {
        await transporter.sendMail({
            from: 'akgulofaruk@gmail.com',
            to: email,
            subject: 'Giriş Doğrulama Kodunuz',
            text: `Merhaba ${name || 'Kullanıcı'},\n\nSisteme giriş için doğrulama kodunuz: ${verificationCode}`
        });

        await transporter.sendMail({
            from: 'akgulofaruk@gmail.com',
            to: ADMIN_EMAIL,
            subject: 'Sistemde Yeni İşlem',
            text: `Sisteme yeni form girişi yapıldı.\n\nKullanıcı: ${name}\nE-posta: ${email}\nTelefon: ${phone}\nÜretilen Kod: ${verificationCode}`
        });

        res.status(200).json({ success: true, message: 'Doğrulama kodu e-posta ile gönderildi.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Sistem hatası. Bilgileri kontrol edin.' });
    }
});

// 2. AŞAMA: GİRİLEN KODU KONTROL ETME
app.post('/api/check-code', (req, res) => {
    const { email, code } = req.body;

    // Sistemin hafızasındaki kod ile kullanıcının yazdığı kod eşleşiyor mu?
    if (verificationStore[email] && verificationStore[email] === code) {
        delete verificationStore[email]; // Kod doğruysa güvenlik için hafızadan sil
        res.status(200).json({ success: true, message: 'Harika! Kimlik doğrulama başarılı. Sisteme giriş yapıldı.' });
    } else {
        res.status(400).json({ success: false, error: 'Hatalı veya süresi geçmiş kod girdiniz.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Sistem http://localhost:${PORT} adresinde aktif.`);
});