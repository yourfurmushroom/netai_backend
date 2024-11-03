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
const RootPath = "/var/www/server/netai_backend/netai_backend/predictData";
const StudentDataPath = '/var/www/server/netai_backend/netai_backend/studentItems';
const DatasetName = [];
const PredictData = [];
const PredictDataPrivate = [];
const publicDataIndex = [];
const privateDataIndex = [];
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
function PredictFlow(filename, typeOfFile, groupName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield ExportFolder(filename, typeOfFile);
            const studentData = yield GetAllStudentFilePath(`${StudentDataPath}`, filename, DatasetName);
            let publicAUC = [];
            let privateAUC = [];
            for (let i = 0; i < Object.keys(studentData).length; i++) {
                let [ppublicData, pprivateData] = yield splitArrayByDiscreteIndices(PredictData[DatasetName[i]], publicDataIndex[DatasetName[i]]);
                let [spublicData, sprivateData] = yield splitArrayByDiscreteIndices(studentData[DatasetName[i]], publicDataIndex[DatasetName[i]]);
                // let resultPublic=await checkAUC(ppublicData,spublicData)
                // let resultPrivate=await checkAUC(pprivateData,sprivateData)
                // publicAUC.push(resultPublic)
                // privateAUC.push(resultPrivate)
                let tprFpr = yield CountAUC(ppublicData, spublicData);
                let auc = yield calculateAUC(tprFpr);
                publicAUC.push(auc);
                tprFpr = yield CountAUC(pprivateData, sprivateData);
                auc = yield calculateAUC(tprFpr);
                privateAUC.push(auc);
            }
            let score = publicAUC.reduce((a, b) => a + b) / publicAUC.length;
            let privateScore = privateAUC.reduce((a, b) => a + b) / privateAUC.length;
            AddToDB(score, privateScore, groupName);
            console.log(score);
        }
        catch (_a) {
            console.log("smth wrong");
        }
    });
}
exports.default = PredictFlow;
function splitArrayByDiscreteIndices(data, indices) {
    return __awaiter(this, void 0, void 0, function* () {
        const inIndices = data.filter((_, idx) => indices.includes(idx));
        const notInIndices = data.filter((_, idx) => !indices.includes(idx));
        return [inIndices, notInIndices];
    });
}
function AddToDB(publicScore, privateScore, groupName) {
    let db = new main_1.DataBase();
    db.InsertScore(publicScore, privateScore, groupName);
}
function checkAUC(correctAns, predictAns) {
    return __awaiter(this, void 0, void 0, function* () {
        if (predictAns.length !== correctAns.length) {
            throw new Error('Predictions and labels must have the same length');
        }
        let tp = 0; // 真正例
        let fp = 0; // 假正例
        let prevTPR = 0; // 上一個 TPR
        let prevFPR = 0; // 上一個 FPR
        let auc = 0;
        const P = correctAns.filter((correctAns) => correctAns === 1).length;
        const N = correctAns.filter((correctAns) => correctAns === 0).length;
        const combined = predictAns.map((pred, idx) => ({
            score: pred,
            label: correctAns[idx],
        }));
        combined.sort((a, b) => b.score - a.score);
        for (let i = 0; i < combined.length; i++) {
            if (combined[i].label === 1) {
                tp++;
            }
            else {
                fp++;
            }
            const tpr = tp / P; // 真陽率
            const fpr = fp / N; // 假陽率
            auc += (fpr - prevFPR) * (tpr + prevTPR) / 2;
            prevTPR = tpr;
            prevFPR = fpr;
        }
        return auc;
    });
}
function CountAUC(correctAns, predictAnsProb) {
    return __awaiter(this, void 0, void 0, function* () {
        if (predictAnsProb.length !== correctAns.length) {
            throw new Error('Predictions and labels must have the same length');
        }
        const thresholds = Array.from(new Set(predictAnsProb)).sort((a, b) => b - a);
        const tprFpr = [];
        const thresholdsWithoutRepeat = [...new Set(thresholds)];
        thresholdsWithoutRepeat.forEach((threshold) => {
            let tp = 0, fp = 0, fn = 0, tn = 0;
            for (let i = 0; i < predictAnsProb.length; i++) {
                if (predictAnsProb[i] > threshold) {
                    if (correctAns[i] === 1) {
                        tp++;
                    }
                    else {
                        fp++;
                    }
                }
                else {
                    if (correctAns[i] === 1) {
                        fn++;
                    }
                    else {
                        tn++;
                    }
                }
            }
            const tpr = tp / (tp + fn);
            const fpr = fp / (fp + tn);
            tprFpr.push([fpr, tpr]);
        });
        return tprFpr;
    });
}
function calculateAUC(tprFpr) {
    return __awaiter(this, void 0, void 0, function* () {
        let auc = 0;
        for (let i = 1; i < tprFpr.length; i++) {
            const xDiff = tprFpr[i][0] - tprFpr[i - 1][0];
            const ySum = tprFpr[i][1] + tprFpr[i - 1][1];
            auc += xDiff * ySum / 2;
        }
        return auc;
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
}
function GetAllFilePath(RootPath, fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        let currentDirItems = fs.readdirSync(RootPath);
        currentDirItems.forEach(item => {
            if (fs.statSync(`${RootPath}/${item}`).isDirectory()) {
                GetAllFilePath(`${RootPath}/${item}`, item);
            }
            else {
                if (fs.existsSync(`${RootPath}/y_test.csv`) && !PredictData.hasOwnProperty(fileName)) {
                    PredictData[fileName] = ReadData(`${RootPath}/y_test.csv`, true);
                    publicDataIndex[fileName] = ReadData(`${RootPath}/public.txt`, false);
                    privateDataIndex[fileName] = ReadData(`${RootPath}/private.txt`, false);
                    DatasetName.push(fileName);
                    return;
                }
            }
        });
    });
}
function GetAllStudentFilePath(RootPath, fileName, dataSetName) {
    return __awaiter(this, void 0, void 0, function* () {
        let studentData = [];
        for (let i = 0; i < dataSetName.length; i++) {
            studentData[dataSetName[i]] = ReadData(`${RootPath}/${fileName}/Competition_data/${dataSetName[i]}/y_predict.csv`, true);
        }
        return studentData;
    });
}
function ReadData(PATH, isCSV) {
    let file = fs.readFileSync(PATH, { encoding: "utf-8" });
    const stringArray = file.split('\n').map(item => item.trim());
    if (isCSV)
        stringArray.shift();
    const intArray = stringArray.map(Number);
    return intArray;
}
Init();
