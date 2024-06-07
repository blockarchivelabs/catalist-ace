const fs = require('fs');

// JSON 파일 경로
const filePath = 'deposit_data-1717612146.json';

// 파일 읽기
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('파일을 읽는 도중 오류가 발생했습니다.', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        const chunkSize = 100; // 각 파일에 저장할 JSON 배열 요소 수

        // JSON 데이터를 chunkSize 크기로 분할하여 배열 생성
        const chunks = [];
        for (let i = 0; i < jsonData.length; i += chunkSize) {
            chunks.push(jsonData.slice(i, i + chunkSize));
        }

        // 각 청크를 파일로 저장
        chunks.forEach((chunk, index) => {
            const fileName = `deposit_data_outputs/output_${index + 1}.json`;
            fs.writeFile(fileName, JSON.stringify(chunk), 'utf8', (err) => {
                if (err) {
                    console.error(`${fileName} 파일을 저장하는 도중 오류가 발생했습니다.`, err);
                    return;
                }
                console.log(`${fileName} 파일이 성공적으로 저장되었습니다.`);
            });
        });

    } catch (err) {
        console.error('JSON 파싱 중 오류가 발생했습니다.', err);
    }
});

