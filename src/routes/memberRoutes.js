const express = require('express');
const router = express.Router();
const { getConnection } = require('../middleware/database.js'); // getConnection 미들웨어를 임포트
const fs = require('fs'); // 파일 시스템 모듈 추가
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const upload = multer({ dest: '/images/members/' });

router.get('/member', getConnection, async (req, res) => {
    const memberId = req.query.id;

    try {
        if (!memberId) {
            return res.status(404).json({ error: "No data" });
        }

        const query = 'SELECT * FROM member WHERE id = ?';
        const [rows] = await req.dbConnection.query(query, [memberId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Member not found" });
        }

        // 이미지 데이터를 파일로 저장
        const profileImg = rows[0].profileimg;
        if (profileImg) {
            const imgPath = `/images/members/${memberId}.jpg`; // 이미지 경로 수정
            fs.writeFileSync(imgPath, profileImg);
            rows[0].profileimg = imgPath;
        }

        console.log(rows[0]);

        res.json(rows[0]);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// 사용자 등록
router.post('/memberRegister', upload.single('profileimg'), getConnection, async (req, res) => {
    const id = uuidv4(); // UUID 생성
    console.log(`uuid 생성 아이디: ${id}`);
    const { nickname, social_id, social_code, social_token } = req.body;
    const profileimg = req.file ? req.file.path : '';

    try {
        const insertQuery = 'INSERT INTO member (id, nickname, profileimg, social_id, social_code, social_token) VALUES (?, ?, ?, ?, ?, ?)';
        await req.dbConnection.query(insertQuery, [id, nickname, profileimg, social_id, social_code, social_token]);
        res.status(201).json({ message: "사용자 등록 성공", id: id });
    } catch (error) {
        console.error("사용자 등록 실패:", error);
        res.status(500).json({ error: "사용자 등록 실패" });
    }
});

// ID를 기준으로 멤버 삭제
router.delete('/member/:id', getConnection, async (req, res) => {
    const memberId = req.params.id;

    try {
        const deleteQuery = 'DELETE FROM member WHERE id = ?';
        await req.dbConnection.query(deleteQuery, [memberId]);

        res.status(200).json({ message: "Member deleted successfully" });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Error deleting member" });
    }
});

// ID를 기준으로 멤버 정보 업데이트
router.put('/member/:id', getConnection, async (req, res) => {
    const memberId = req.params.id;
    const { nickname, profileimg, social_id, social_code, social_token } = req.body;

    try {
        const updateQuery = 'UPDATE member SET nickname = ?, profileimg = ?, social_id = ?, social_code = ?, social_token = ? WHERE id = ?';
        await req.dbConnection.query(updateQuery, [nickname, profileimg, social_id, social_code, social_token, memberId]);

        res.status(200).json({ message: "Member updated successfully" });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ error: "Error updating member" });
    }
});

// Favorite 등록
router.post('/favoriteRegister', getConnection, async (req, res) => {
    const { memberId, favoriteLatitude, favoriteLongitude, location_code } = req.body;

    try {
        const insertQuery = 'INSERT INTO favorite (memberId, favoriteLatitude, favoriteLongitude, location_code) VALUES (?, ?, ?, ?)';
        await req.dbConnection.query(insertQuery, [memberId, favoriteLatitude, favoriteLongitude, location_code]);
        res.status(201).json({ message: "Favorite 등록 성공" });
    } catch (error) {
        console.error("Favorite 등록 실패:", error);
        res.status(500).json({ error: "Favorite 등록 실패" });
    }
});

// Favorite 정보 업데이트
router.put('/favoriteUpdate/:registrationno', getConnection, async (req, res) => {
    const registrationno = req.params.registrationno;
    const { memberId, favoriteLatitude, favoriteLongitude, location_code } = req.body;

    try {
        const updateQuery = 'UPDATE favorite SET memberId = ?, favoriteLatitude = ?, favoriteLongitude = ?, location_code = ? WHERE registrationno = ?';
        await req.dbConnection.query(updateQuery, [memberId, favoriteLatitude, favoriteLongitude, location_code, registrationno]);
        res.status(200).json({ message: "Favorite 업데이트 성공" });
    } catch (error) {
        console.error("Favorite 업데이트 실패:", error);
        res.status(500).json({ error: "Favorite 업데이트 실패" });
    }
});


module.exports = router;