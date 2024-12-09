import * as fs from 'fs';
import { promisify } from 'util';
import { DataBase } from './main';
import path from 'path';
import { json } from 'stream/consumers';
const { exec } = require('child_process');
const promiseExec = promisify(exec);


const CP2RootPath = "/var/www/server/netai_backend/netai_backend/predictData/DS_Dataset/answer.csv"
const StudentDataPath = '/var/www/server/netai_backend/netai_backend/studentItems'

const PublicAnswerPair: Record<string, string> = {}
const PrivateAnswerPair: Record<string, string> = {}


const ALLANS = []

async function ExportFolder(filename: any, typeOfFile: string) {
    try {
        await promiseExec(`mkdir ${StudentDataPath}/${filename}`);

        let command;
        if (typeOfFile === 'zip') {
            console.log(`${filename} is zip`);
            command = `unzip ${StudentDataPath}/${filename} -d ${StudentDataPath}/${filename}`;
        } else if (typeOfFile === 'rar') {
            console.log(`${filename} is rar`);
            command = `unrar x ${StudentDataPath}/${filename} ${StudentDataPath}/${filename}`;
        } else if (typeOfFile === '7z') {
            console.log(`${filename} is 7z`);
            command = `7z x ${StudentDataPath}/${filename}.7z -o${StudentDataPath}/${filename}`;
        } else {
            console.log(`${filename} is null`);
            return;
        }

        await promiseExec(command);
        console.log(`Command executed: ${command}`);
    } catch (error) {
        console.error("Caught an error:", error);
    }
}


function Init() {
    ReadData(CP2RootPath, PublicAnswerPair, PrivateAnswerPair)
    console.log('readDataComplete')
}

export default async function PredictFlowCP2(ws: any, filename: any, typeOfFile: string, groupName: string) {
    try {
        await ExportFolder(filename, typeOfFile)
        const studentData: Record<string, string> = {}
        let currentDirItems = fs.readdirSync(`${StudentDataPath}/${filename}`)
        currentDirItems.forEach(x=>{
            if (!fs.statSync(`${StudentDataPath}/${filename}/${x}`).isDirectory()) {
                ReadStudentData(`${StudentDataPath}/${filename}/${x}`, studentData)
            }
        })
        if (Object.keys(PublicAnswerPair).length + Object.keys(PrivateAnswerPair).length == Object.keys(studentData).length) {
            let publicAE = await AccumulateAbsoluteError(studentData, PublicAnswerPair)
            let privateAE = await AccumulateAbsoluteError(studentData, PrivateAnswerPair)
            let other=await AccumulateAbsoluteErrorNon(studentData,PublicAnswerPair,PrivateAnswerPair)
            if(isNaN(publicAE) || isNaN(privateAE))
            {
                ws.send(JSON.stringify({ messageField: "True", detail: "上傳的資料有誤" }))
                return
            }
            AddToDB(publicAE+other,privateAE+other,groupName)
            ws.send(JSON.stringify({ messageField: "True", detail: `計算成功，本次上傳結果為：${publicAE+other}` }))
        }
        else {
            console.log("smth wrong data")
            ws.send(JSON.stringify({ messageField: "True", detail: "上傳的資料有誤" }))
        }
    }
    catch {
        console.log("smth wrong")
         ws.send(JSON.stringify({ messageField: "True", detail: "上傳的資料有誤" }))
    }
}

function AddToDB(publicScore: Number, privateScore: Number, groupName: string) {
    
    let db = new DataBase()
    db.InsertScoreCP2(publicScore, privateScore, groupName)
}

async function AccumulateAbsoluteError(studentData: Record<string, string>, answer: Record<string, string>) {
    let totalAE = 0
    for (const id in studentData) {
        if (id in answer) {
            totalAE += Math.abs(parseFloat(studentData[id]) - parseFloat(answer[id]));
        }
    }
    return totalAE
}

async function AccumulateAbsoluteErrorNon(studentData: Record<string, string>, answerPublic: Record<string, string>,answerPrivate:Record<string,string>) {
    let totalAE = 0
    for (const id in studentData) {
        if (!(id in answerPublic || id in answerPrivate)) {
            totalAE += Math.abs(parseFloat(studentData[id]));
        }
    }
    return totalAE
}

function ReadData(path: string, publicField: Record<string, string>, privateField: Record<string, string>) {
    let file = fs.readFileSync(path, { encoding: "utf-8" })
    const stringArray = file.split('\n').map(item => item.trim());
    stringArray.shift()
    stringArray.pop()
    const allDataField: [string, string, string][] = stringArray.map(x => x.split(',').map(item => item.trim()) as [string, string, string])
    allDataField.forEach(element => {
        if (element[2] === '1') {
            privateField[element[0]] = element[1];
        }
        else {
            publicField[element[0]] = element[1];
        }
    });

}

async function ReadStudentData(path: string, studentData: Record<string, string>) {
    try {
        let file = fs.readFileSync(path, { encoding: "utf-8" })
        const stringArray = file.split('\n').map(item => item.trim());
        stringArray.shift()
        stringArray.pop()
        const allDataField: [string, string, string][] = stringArray.map(x => x.split(',').map(item => item.trim()) as [string, string, string])
        allDataField.forEach(element => {
            studentData[element[0]] = element[1];
        });
    }
    catch {
        console.log("asd")
    }
}


Init()
