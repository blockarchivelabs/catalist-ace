const { execSync } = require('child_process');

// 파일명의 시작 번호와 끝 번호
const start = 2;
const end = 100;

// 반복하여 실행할 명령어
const commandBase = 'npx hardhat add-keys --operator 0 --network ace_mainnet --file ';

// 파일명을 변경하면서 반복 실행
for (let i = start; i <= end; i++) {
    const fileName = `deposit_data_outputs/output_${i}.json`;
    const command = commandBase + fileName;
    console.log(`Processing ${fileName}`);
    try {
        execSync(command);
        console.log(`${fileName} processed successfully.`);
    } catch (error) {
        console.error(`Error processing ${fileName}:`, error.stderr.toString());
    }
}

