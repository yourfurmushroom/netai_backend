import * as fs from 'fs';
import { promisify } from 'util';
const { exec } = require('child_process');
const promiseExec=promisify(exec);

interface dataset {
    name: string;
    path: any;
    data?:any;
}

const RootPath = "/var/www/server/netai_backend/netai_backend/predictData"
const StudentDataPath='/var/www/server/netai_backend/netai_backend/studentItems'
const DatasetName:string[]=[];

// const PredictDataPath: dataset[]=[];
const PredictDataPath: any=[];

async function ExportFolder(filename:any, typeOfFile:string) {
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


export default async function PredictFlow(filename:any,typeOfFile:string) 
{
    await ExportFolder(filename,typeOfFile)
    console.log("---------------------------------------------------------------after------------------------------------------------------")
    const studentData=await GetAllStudentFilePath(`${StudentDataPath}`,filename,DatasetName)
    console.log(Object.keys(studentData).length)
    console.log(Object.keys(PredictDataPath).length)

    let allAUC=[]
    for(let i=0 ;i<Object.keys(studentData).length;i++)
    {
        allAUC.push(checkAUC(PredictDataPath[DatasetName[i]],studentData[DatasetName[i]]))
    }

    allAUC.forEach(element => {
        console.log(element)
    });




    // await studentData.forEach(element => {
    //     ReadData(JSON.stringify(element))
    // });

}

function checkAUC(correctAns:any,predictAns:any)
{
    if (predictAns.length !== correctAns.length) {
        throw new Error('Predictions and labels must have the same length');
    }
    let tp = 0;  // 真正例
    let fp = 0;  // 假正例
    let prevTPR = 0;  // 上一個 TPR
    let prevFPR = 0;  // 上一個 FPR
    let auc = 0;

    const P = correctAns.filter((correctAns:any) => correctAns === 1).length; // 正例數量
    const N = correctAns.filter((correctAns:any) => correctAns === 0).length; // 負例數量

    const combined = predictAns.map((pred:any, idx:any) => ({
        score: pred,
        label: correctAns[idx],
    }));

    // 將預測和標籤一起排序，這裡假設你的預測是 0 或 1，按 1 排到前面
    combined.sort((a:any, b:any) => b.score - a.score);

    for (let i = 0; i < combined.length; i++) {
        if (combined[i].label === 1) {
            tp++;
        } else {
            fp++;
        }

        const tpr = tp / P;  // 真陽率
        const fpr = fp / N;  // 假陽率

        auc += (fpr - prevFPR) * (tpr + prevTPR) / 2;

        prevTPR = tpr;
        prevFPR = fpr;
    }

    return auc;
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
            // if (fs.existsSync(`${RootPath}/y_test.csv`) && !PredictDataPath.some(items=>items.name===fileName && items.path === `${RootPath}/y_test.csv`) ){
            if (fs.existsSync(`${RootPath}/y_test.csv`) && !PredictDataPath.hasOwnProperty(fileName)) {
                // PredictDataPath.push({
                //     name: fileName,
                //     path: `${RootPath}/y_test.csv`.toString(),
                //     data:ReadData(`${RootPath}/y_test.csv`)
                // })
                PredictDataPath[fileName]=ReadData(`${RootPath}/y_test.csv`)
                DatasetName.push(fileName)
                return
            }
        }
    });
}

async function GetAllStudentFilePath(RootPath: any, fileName: string ,dataSetName:string[]) 
{
    // let studentData:dataset[]=[]
    let studentData:any=[]
    for(let i=0;i<dataSetName.length;i++)
    {
        // studentData.push({
        //     name: dataSetName[i],
        //     path: `${RootPath}/${fileName}/Competition_data/${dataSetName[i]}/y_predict.csv`.toString(),
        //     data:ReadData( `${RootPath}/${fileName}/Competition_data/${dataSetName[i]}/y_predict.csv`)
        // })
        studentData[dataSetName[i]]=ReadData( `${RootPath}/${fileName}/Competition_data/${dataSetName[i]}/y_predict.csv`)
    }
    return studentData
    
}


function ReadData(PATH: string) {
    let file = fs.readFileSync(PATH, { encoding: "utf-8" })
    const stringArray = file.split('\n').map(item => item.trim());
    stringArray.shift()
    const intArray = stringArray.map(Number);
    return intArray;
    
}

Init()