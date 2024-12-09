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
const util_1 = require("util");
const main_1 = require("./main");
const { exec } = require('child_process');
const promiseExec = (0, util_1.promisify)(exec);
const CP2RootPath = "/var/www/server/netai_backend/netai_backend/predictData/DS_Dataset/answer.csv";
const StudentDataPath = '/var/www/server/netai_backend/netai_backend/studentItems';
const PublicAnswerPair = {};
const PrivateAnswerPair = {};
const ALLANS = [];
function ExportFolder(filename, typeOfFile) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield promiseExec(`mkdir ${StudentDataPath}/${filename}`);
            let command;
            if (typeOfFile === 'zip') {
                console.log(`${filename} is zip`);
                command = `unzip ${StudentDataPath}/${filename} -d ${StudentDataPath}/${filename}`;
            }
            else if (typeOfFile === 'rar') {
                console.log(`${filename} is rar`);
                command = `unrar x ${StudentDataPath}/${filename} ${StudentDataPath}/${filename}`;
            }
            else if (typeOfFile === '7z') {
                console.log(`${filename} is 7z`);
                command = `7z x ${StudentDataPath}/${filename}.7z -o${StudentDataPath}/${filename}`;
            }
            else {
                console.log(`${filename} is null`);
                return;
            }
            yield promiseExec(command);
            console.log(`Command executed: ${command}`);
        }
        catch (error) {
            console.error("Caught an error:", error);
        }
    });
}
function Init() {
    ReadData(CP2RootPath, PublicAnswerPair, PrivateAnswerPair);
    console.log('readDataComplete');
}
function PredictFlowCP2(ws, filename, typeOfFile, groupName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield ExportFolder(filename, typeOfFile);
            const studentData = {};
            let currentDirItems = fs.readdirSync(`${StudentDataPath}/${filename}`);
            currentDirItems.forEach(x => {
                if (!fs.statSync(`${StudentDataPath}/${filename}/${x}`).isDirectory()) {
                    ReadStudentData(`${StudentDataPath}/${filename}/${x}`, studentData);
                }
            });
            if (Object.keys(PublicAnswerPair).length + Object.keys(PrivateAnswerPair).length == Object.keys(studentData).length) {
                let publicAE = yield AccumulateAbsoluteError(studentData, PublicAnswerPair);
                let privateAE = yield AccumulateAbsoluteError(studentData, PrivateAnswerPair);
                let other = yield AccumulateAbsoluteErrorNon(studentData, PublicAnswerPair, PrivateAnswerPair);
                if (isNaN(publicAE) || isNaN(privateAE)) {
                    ws.send(JSON.stringify({ messageField: "True", detail: "上傳的資料有誤" }));
                    return;
                }
                AddToDB(publicAE + other, privateAE + other, groupName);
                ws.send(JSON.stringify({ messageField: "True", detail: `計算成功，本次上傳結果為：${publicAE + other}` }));
            }
            else {
                console.log("smth wrong data");
                ws.send(JSON.stringify({ messageField: "True", detail: "上傳的資料有誤" }));
            }
        }
        catch (_a) {
            console.log("smth wrong");
            ws.send(JSON.stringify({ messageField: "True", detail: "上傳的資料有誤" }));
        }
    });
}
exports.default = PredictFlowCP2;
function AddToDB(publicScore, privateScore, groupName) {
    let db = new main_1.DataBase();
    db.InsertScoreCP2(publicScore, privateScore, groupName);
}
function AccumulateAbsoluteError(studentData, answer) {
    return __awaiter(this, void 0, void 0, function* () {
        let totalAE = 0;
        for (const id in studentData) {
            if (id in answer) {
                totalAE += Math.abs(parseFloat(studentData[id]) - parseFloat(answer[id]));
            }
        }
        return totalAE;
    });
}
function AccumulateAbsoluteErrorNon(studentData, answerPublic, answerPrivate) {
    return __awaiter(this, void 0, void 0, function* () {
        let totalAE = 0;
        for (const id in studentData) {
            if (!(id in answerPublic || id in answerPrivate)) {
                totalAE += Math.abs(parseFloat(studentData[id]));
            }
        }
        return totalAE;
    });
}
function ReadData(path, publicField, privateField) {
    let file = fs.readFileSync(path, { encoding: "utf-8" });
    const stringArray = file.split('\n').map(item => item.trim());
    stringArray.shift();
    stringArray.pop();
    const allDataField = stringArray.map(x => x.split(',').map(item => item.trim()));
    allDataField.forEach(element => {
        if (element[2] === '1') {
            privateField[element[0]] = element[1];
        }
        else {
            publicField[element[0]] = element[1];
        }
    });
}
function ReadStudentData(path, studentData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let file = fs.readFileSync(path, { encoding: "utf-8" });
            const stringArray = file.split('\n').map(item => item.trim());
            stringArray.shift();
            stringArray.pop();
            const allDataField = stringArray.map(x => x.split(',').map(item => item.trim()));
            allDataField.forEach(element => {
                studentData[element[0]] = element[1];
            });
        }
        catch (_a) {
            console.log("asd");
        }
    });
}
Init();
