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
const RootPath = "/var/www/server/netai_backend/netai_backend/predictData";
const PredictDataPath = [];
function PredictFlow() {
    // allDataPath.forEach(element => {
    //     ReadData(element)
    // });
}
exports.default = PredictFlow;
function Init() {
    GetAllFilePath(`${RootPath}/all`, "");
    PredictDataPath.forEach(element => {
        console.log(`path:${element.data}`);
    });
    console.log(PredictDataPath === null || PredictDataPath === void 0 ? void 0 : PredictDataPath.length);
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
function ReadData(PATH) {
    let file = fs.readFileSync(PATH, { encoding: "utf-8" });
    const stringArray = file.split('\n').map(item => item.trim());
    const removedElement = stringArray.shift();
    const intArray = stringArray.map(Number);
    console.log(intArray);
    return intArray;
}
Init();
