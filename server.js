require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 

// --- E-POSTA AYARLARI ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'akgulofaruk@gmail.com', 
        pass: 'wrmcqgfazspoxvpw'            
    }
});

const ADMIN_EMAIL = 'akgulomerfaruk16@gmail.com'; 

const verificationStore = {};
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. AŞAMA: KOD GÖNDERME
app.post('/api/verify', async (req, res) => {
    const { name, email, phone } = req.body;

    if (!email || !phone) {
        return res.status(400).json({ success: false, error: 'E-posta ve telefon numarası zorunludur.' });
    }

    const verificationCode = generateVerificationCode();
    verificationStore[email] = verificationCode;

    try {
        // 1. Kullanıcıya giden mail
        await transporter.sendMail({
            from: 'akgulofaruk@gmail.com', 
            to: email,
            subject: 'Giriş Doğrulama Kodunuz',
            text: `Merhaba ${name || 'Kullanıcı'},\n\nSisteme giriş için doğrulama kodunuz: ${verificationCode}`
        });

        // 2. Sana gelen bildirim maili (Buradaki from adresi düzeltildi)
        await transporter.sendMail({
            from: 'akgulofaruk@gmail.com', 
            to: ADMIN_EMAIL,
            subject: 'Sistemde Yeni İşlem',
            text: `Sisteme yeni form girişi yapıldı.\n\nKullanıcı: ${name}\nE-posta: ${email}\nTelefon: ${phone}\nÜretilen Kod: ${verificationCode}`
        });

        res.status(200).json({ success: true, message: 'Doğrulama kodu e-posta ile gönderildi.' });
    } catch (error) {
        console.error('Mail Gönderim Hatası:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası. E-posta ayarlarını kontrol edin.' });
    }
});

// 2. AŞAMA: KODU KONTROL ETME
app.post('/api/check-code', (req, res) => {
    const { email, code } = req.body;

    if (verificationStore[email] && verificationStore[email] === code) {
        delete verificationStore[email]; 
        res.status(200).json({ success: true, message: 'Kimlik doğrulama başarılı.' });
    } else {
        res.status(400).json({ success: false, error: 'Hatalı veya süresi geçmiş kod girdiniz.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sistem ${PORT} portunda aktif.`);
});
