import * as fs from 'fs';
import { parse } from 'csv-parse';
import path from 'path';
import { promisify } from 'util';
const { exec } = require('child_process');
const promiseExec=promisify(exec);

interface dataset {
    name: string;
    path: any;
    // data:number[];
    data?:any;
}

const RootPath = "/var/www/server/netai_backend/netai_backend/predictData"
const StudentDataPath='/var/www/server/netai_backend/netai_backend/studentItems'
const PredictDataPath: dataset[] = [];

async function ExportFolder(filename:any, typeOfFile:string) {
    try {
        await promiseExec(`mkdir ${StudentDataPath}/${filename}`);
        console.log(`${filename} directory created`);

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


export default async function PredictFlow(filename:any,typeOfFile:string) 
{
    await ExportFolder(filename,typeOfFile)
    console.log("---------------------------------------------------------------after------------------------------------------------------")
    const studentData=GetAllStudentFilePath(`${StudentDataPath}/${filename}`,'',[])




    // await studentData.forEach(element => {
    //     ReadData(JSON.stringify(element))
    // });

}


function Init() {
    try{
        GetAllFilePath(`${RootPath}/all`,"")
        console.log('read dataset complete')
    }
    catch
    {
        console.log('read dataset error')
    }

    // PredictDataPath.forEach(element => {
    //     console.log(`path:${element.data}`)
    // });
    // console.log(PredictDataPath?.length)
}

async function GetAllFilePath(RootPath: any, fileName: string) {

    let currentDirItems = fs.readdirSync(RootPath)
    currentDirItems.forEach(item => {
        if (fs.statSync(`${RootPath}/${item}`).isDirectory()) {
            GetAllFilePath(`${RootPath}/${item}`, item)
        }
        else {
            if (fs.existsSync(`${RootPath}/y_test.csv`) && !PredictDataPath.some(items=>items.name===fileName && items.path === `${RootPath}/y_test.csv`) ){
                PredictDataPath.push({
                    name: fileName,
                    path: `${RootPath}/y_test.csv`.toString(),
                    data:ReadData(`${RootPath}/y_test.csv`)
                })
                console.log('exist')
                return
            }
        }
    });
}

async function GetAllStudentFilePath(RootPath: any, fileName: string ,studentData:dataset[]) {
    
    let currentDirItems = fs.readdirSync(RootPath)
    currentDirItems.forEach(item => {
        console.log(item)
        if (fs.statSync(`${RootPath}/${item}`).isDirectory()) {
            GetAllStudentFilePath(`${RootPath}/${item}`, item,studentData)
        }
        else {
            if (fs.existsSync(`${RootPath}/y_predict.csv`) && !studentData.some(items=>items.name===fileName && items.path === `${RootPath}/y_predict.csv`) ){
                studentData.push({
                    name: fileName,
                    path: `${RootPath}/y_predict.csv`.toString(),
                    data:ReadData(`${RootPath}/y_predict.csv`)
                })
                console.log('exist')
            }
        }
    });
    console.log(JSON.stringify(studentData))
    return studentData;
}


async function ReadData(PATH: string) {
    let file = fs.readFileSync(PATH, { encoding: "utf-8" })
    const stringArray = file.split('\n').map(item => item.trim());
    stringArray.shift()
    const intArray = stringArray.map(Number);
    return intArray;
    
}

Init()