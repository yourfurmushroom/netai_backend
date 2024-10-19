"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const { exec } = require('child_process');
const RootPath = "/var/www/server/netai_backend/netai_backend/predictData";
const StudentDataPath = '/var/www/server/netai_backend/netai_backend/studentItems';
const PredictDataPath = [];
function ExportFolder(filename, typeOfFile) {
    if (typeOfFile === 'zip') {
        console.log(filename + " is zip");
        exec(`mkdir ${StudentDataPath}/${filename}`);
        exec(`unzip ${StudentDataPath}/${filename} -d ${StudentDataPath}/${filename}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`執行命令時出錯: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`錯誤輸出: ${stderr}`);
                return;
            }
            console.log(`命令輸出: ${stdout}`);
        });
    }
    else if (typeOfFile === 'rar') {
        exec(`mkdir ${StudentDataPath}/${filename}`);
        console.log(filename + " is rar");
        exec(`unrar x ${StudentDataPath}/${filename} ${StudentDataPath}/${filename}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`執行命令時出錯: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`錯誤輸出: ${stderr}`);
                return;
            }
            console.log(`命令輸出: ${stdout}`);
        });
    }
    else if (typeOfFile === '7z') {
        console.log(filename + " is 7z");
        exec(`mkdir ${StudentDataPath}/${filename}`);
        exec(`7z x  ${StudentDataPath}/${filename}.7z -o${StudentDataPath}/${filename}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`執行命令時出錯: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`錯誤輸出: ${stderr}`);
                return;
            }
            console.log(`命令輸出: ${stdout}`);
        });
    }
    else {
        console.log(filename + " is null");
    }
}
function PredictFlow(filename, typeOfFile) {
    ExportFolder(filename, typeOfFile);
    const studentData = GetAllStudentFilePath(`${StudentDataPath}/${filename}`, []);
    studentData.forEach(element => {
        ReadData(JSON.stringify(element));
    });
}
exports.default = PredictFlow;
function Decompressed() {
    return __awaiter(this, void 0, void 0, function* () {
        yield exec('');
    });
}
function Init() {
    try {
        GetAllFilePath(`${RootPath}/all`, "");
        console.log('read dataset complete');
    }
    catch (_a) {
        console.log('read dataset error');
    }
    // PredictDataPath.forEach(element => {
    //     console.log(`path:${element.data}`)
    // });
    // console.log(PredictDataPath?.length)
}
function GetAllFilePath(RootPath, fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        let currentDirItems = fs.readdirSync(RootPath);
        currentDirItems.forEach(item => {
            if (fs.statSync(`${RootPath}/${item}`).isDirectory()) {
                GetAllFilePath(`${RootPath}/${item}`, item);
            }
            else {
                if (fs.existsSync(`${RootPath}/y_test.csv`) && !PredictDataPath.some(items => items.name === fileName && items.path === `${RootPath}/y_test.csv`)) {
                    PredictDataPath.push({
                        name: fileName,
                        path: `${RootPath}/y_test.csv`.toString(),
                        data: ReadData(`${RootPath}/y_test.csv`)
                    });
                    console.log('exist');
                    return;
                }
            }
        });
    });
}
function GetAllStudentFilePath(RootPath, studentData = []) {
    let currentDirItems = fs.readdirSync(RootPath);
    console.log("aa");
    currentDirItems.forEach(item => {
        const itemPath = `${RootPath}/${item}`;
        if (fs.statSync(itemPath).isDirectory()) {
            // 遞迴進入子目錄時，帶入相同的 studentData
            GetAllStudentFilePath(itemPath, studentData);
        }
        else {
            const filePath = `${RootPath}/y_predict.csv`;
            // 檢查文件是否存在並且 studentData 沒有已存在此文件的資料
            if (item === 'y_predict.csv' && fs.existsSync(filePath) && !studentData.some(data => data.path === filePath)) {
                studentData.push({
                    name: RootPath.split('/').pop() || '',
                    path: filePath,
                    data: ReadData(filePath) // 讀取文件資料
                });
                console.log('exist');
            }
        }
    });
    return studentData; // 確保遞迴最終返回完整的 studentData
}
function ReadData(PATH) {
    let file = fs.readFileSync(PATH, { encoding: "utf-8" });
    const stringArray = file.split('\n').map(item => item.trim());
    stringArray.shift();
    const intArray = stringArray.map(Number);
    return intArray;
}
Init();
