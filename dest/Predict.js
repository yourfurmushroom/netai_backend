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
const { exec } = require('child_process');
const promiseExec = (0, util_1.promisify)(exec);
const RootPath = "/var/www/server/netai_backend/netai_backend/predictData";
const StudentDataPath = '/var/www/server/netai_backend/netai_backend/studentItems';
const DatasetName = [];
// const PredictDataPath: dataset[]=[];
const PredictDataPath = [];
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
function PredictFlow(filename, typeOfFile) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ExportFolder(filename, typeOfFile);
        console.log("---------------------------------------------------------------after------------------------------------------------------");
        const studentData = yield GetAllStudentFilePath(`${StudentDataPath}`, filename, DatasetName);
        console.log(Object.keys(studentData).length);
        console.log(Object.keys(PredictDataPath).length);
        let allAUC = [];
        for (let i = 0; i < Object.keys(studentData).length; i++) {
            allAUC.push(checkAUC(PredictDataPath[DatasetName[i]], studentData[DatasetName[i]]));
        }
        allAUC.forEach(element => {
            console.log(element);
        });
        // await studentData.forEach(element => {
        //     ReadData(JSON.stringify(element))
        // });
    });
}
exports.default = PredictFlow;
function checkAUC(correctAns, predictAns) {
    if (predictAns.length !== correctAns.length) {
        throw new Error('Predictions and labels must have the same length');
    }
    let tp = 0; // 真正例
    let fp = 0; // 假正例
    let prevTPR = 0; // 上一個 TPR
    let prevFPR = 0; // 上一個 FPR
    let auc = 0;
    const P = correctAns.filter((correctAns) => correctAns === 1).length; // 正例數量
    const N = correctAns.filter((correctAns) => correctAns === 0).length; // 負例數量
    const combined = predictAns.map((pred, idx) => ({
        score: pred,
        label: correctAns[idx],
    }));
    // 將預測和標籤一起排序，這裡假設你的預測是 0 或 1，按 1 排到前面
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
                // if (fs.existsSync(`${RootPath}/y_test.csv`) && !PredictDataPath.some(items=>items.name===fileName && items.path === `${RootPath}/y_test.csv`) ){
                if (fs.existsSync(`${RootPath}/y_test.csv`) && !PredictDataPath.hasOwnProperty(fileName)) {
                    // PredictDataPath.push({
                    //     name: fileName,
                    //     path: `${RootPath}/y_test.csv`.toString(),
                    //     data:ReadData(`${RootPath}/y_test.csv`)
                    // })
                    PredictDataPath[fileName] = ReadData(`${RootPath}/y_test.csv`);
                    DatasetName.push(fileName);
                    return;
                }
            }
        });
    });
}
function GetAllStudentFilePath(RootPath, fileName, dataSetName) {
    return __awaiter(this, void 0, void 0, function* () {
        // let studentData:dataset[]=[]
        let studentData = [];
        for (let i = 0; i < dataSetName.length; i++) {
            // studentData.push({
            //     name: dataSetName[i],
            //     path: `${RootPath}/${fileName}/Competition_data/${dataSetName[i]}/y_predict.csv`.toString(),
            //     data:ReadData( `${RootPath}/${fileName}/Competition_data/${dataSetName[i]}/y_predict.csv`)
            // })
            studentData[dataSetName[i]] = ReadData(`${RootPath}/${fileName}/Competition_data/${dataSetName[i]}/y_predict.csv`);
        }
        return studentData;
    });
}
function ReadData(PATH) {
    let file = fs.readFileSync(PATH, { encoding: "utf-8" });
    const stringArray = file.split('\n').map(item => item.trim());
    stringArray.shift();
    const intArray = stringArray.map(Number);
    return intArray;
}
Init();
