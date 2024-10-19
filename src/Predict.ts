import * as fs from 'fs';
import { parse } from 'csv-parse';
import path from 'path';
const { exec } = require('child_process');

interface dataset {
    name: string;
    path: any;
    // data:number[];
    data?:any;
}

const RootPath = "/var/www/server/netai_backend/netai_backend/predictData"
const StudentDataPath='/var/www/server/netai_backend/netai_backend/studentItems'
const PredictDataPath: dataset[] = [];

function ExportFolder(filename:any,typeOfFile:string)
{
    if(typeOfFile==='zip')
        {
            console.log(filename+" is zip")
            exec(`mkdir ${StudentDataPath}/${filename}`)
            exec(`unzip ${StudentDataPath}/${filename} -d ${StudentDataPath}/${filename}`,(error:any, stdout:any, stderr:any) => {
                if (error) {
                    console.error(`執行命令時出錯: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`錯誤輸出: ${stderr}`);
                    return;
                }
                console.log(`命令輸出: ${stdout}`);
            })
        }
        else if(typeOfFile==='rar')
        {
            exec(`mkdir ${StudentDataPath}/${filename}`)
            console.log(filename+" is rar")
            exec(`unrar x ${StudentDataPath}/${filename} ${StudentDataPath}/${filename}`,(error:any, stdout:any, stderr:any) => {
                if (error) {
                    console.error(`執行命令時出錯: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`錯誤輸出: ${stderr}`);
                    return;
                }
                console.log(`命令輸出: ${stdout}`);
            })
        
        }
        else if(typeOfFile==='7z')
        {
            console.log(filename+" is 7z")
            exec(`mkdir ${StudentDataPath}/${filename}`)
            exec(`7z x  ${StudentDataPath}/${filename}.7z -o${StudentDataPath}/${filename}`,(error:any, stdout:any, stderr:any) => {
                if (error) {
                    console.error(`執行命令時出錯: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`錯誤輸出: ${stderr}`);
                    return;
                }
                console.log(`命令輸出: ${stdout}`);
            }) 
        }
        else
        {
            console.log(filename+" is null")
        }
}

export default function PredictFlow(filename:any,typeOfFile:string) 
{
    ExportFolder(filename,typeOfFile)
    const studentData=GetAllStudentFilePath(`${StudentDataPath}/${filename}`,[])




    studentData.forEach(element => {
        ReadData(JSON.stringify(element))
    });

}

async function Decompressed()
{

    await exec('')
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

function GetAllStudentFilePath(RootPath: any, studentData: dataset[] = []): dataset[] {
    let currentDirItems = fs.readdirSync(RootPath);
    console.log("aa")
    currentDirItems.forEach(item => {
        const itemPath = `${RootPath}/${item}`;

        if (fs.statSync(itemPath).isDirectory()) {
            // 遞迴進入子目錄時，帶入相同的 studentData
            GetAllStudentFilePath(itemPath, studentData);
        } else {
            const filePath = `${RootPath}/y_predict.csv`;

            // 檢查文件是否存在並且 studentData 沒有已存在此文件的資料
            if (item === 'y_predict.csv' && fs.existsSync(filePath) && !studentData.some(data => data.path === filePath)) {
                studentData.push({
                    name: RootPath.split('/').pop() || '',  // 使用當前資料夾名稱作為檔案名稱
                    path: filePath,
                    data: ReadData(filePath) // 讀取文件資料
                });
                console.log('exist');
            }
        }
    });

    return studentData; // 確保遞迴最終返回完整的 studentData
}



function ReadData(PATH: string) {
    let file = fs.readFileSync(PATH, { encoding: "utf-8" })
    const stringArray = file.split('\n').map(item => item.trim());
    stringArray.shift()
    const intArray = stringArray.map(Number);
    return intArray;
    
}

Init()