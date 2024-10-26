import * as fs from 'fs';
import { promisify } from 'util';
import { DataBase } from './main';
const { exec } = require('child_process');
const promiseExec=promisify(exec);


const RootPath = "/var/www/server/netai_backend/netai_backend/predictData"
const StudentDataPath='/var/www/server/netai_backend/netai_backend/studentItems'
const DatasetName:string[]=[];


const PredictData: any=[];
const PredictDataPrivate: any=[];
const publicDataIndex:any=[];
const privateDataIndex:any=[];

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


export default async function PredictFlow(filename:any,typeOfFile:string,groupName:string) 
{
    // try{
        await ExportFolder(filename,typeOfFile)
        console.log("---------------------------------------------------------------after------------------------------------------------------")
        const studentData=await GetAllStudentFilePath(`${StudentDataPath}`,filename,DatasetName)
        console.log(Object.keys(studentData).length)
        console.log(Object.keys(PredictData).length)
    
        let publicAUC=[]
        let privateAUC=[]
        for(let i=0 ;i<Object.keys(studentData).length;i++)
        {
            console.log(`check length: ${PredictData[DatasetName[i]].length}  ,  ${studentData[DatasetName[i]].length}`)
            // let ppublicData=[]
            // let pprivateData=[]
            // let spublicData=[]
            // let sprivateData=[]
            // for(let j=0;i<PredictData[DatasetName[i]].length;j++)
            // {
            //     if ( j+1 in publicDataIndex[DatasetName[i]])
            //     {
            //         ppublicData.push(PredictData[DatasetName[i]][j])
            //         spublicData.push(studentData[DatasetName[i]][j])
            //     }
            //     else
            //     {
            //         pprivateData.push(PredictData[DatasetName[i]][j])
            //         sprivateData.push(studentData[DatasetName[i]][j])
            //     }
            // }
            let [ppublicData, pprivateData] = await splitArrayByDiscreteIndices(PredictData[DatasetName[i]], publicDataIndex[DatasetName[i]]);
            let [spublicData, sprivateData] = await splitArrayByDiscreteIndices(studentData[DatasetName[i]], publicDataIndex[DatasetName[i]]);
            
            
            let resultPublic=await checkAUC(ppublicData,spublicData)
            let resultPrivate=await checkAUC(pprivateData,sprivateData)
            publicAUC.push(resultPublic)
            privateAUC.push(resultPrivate)
        }
        let score=publicAUC.reduce((a,b)=>a+b)/publicAUC.length
        let privateScore=privateAUC.reduce((a,b)=>a+b)/privateAUC.length
        AddToDB(score,privateScore,groupName)
        console.log(score)


    // }
    // catch
    // {
    //     console.log("smth wrong")
    // }
}

async function splitArrayByDiscreteIndices<T>(data: T[], indices: number[]):Promise<[T[], T[]]> {
    const inIndices = data.filter((_, idx) => indices.includes(idx));
    const notInIndices = data.filter((_, idx) => !indices.includes(idx));
    console.log(`show :${inIndices}`)
    return [inIndices, notInIndices];
}

function AddToDB(publicScore:Number,privateScore:Number,groupName:string)
{
    let db=new DataBase()
    db.InsertScore(publicScore,privateScore,groupName)

}

async function checkAUC(correctAns:any,predictAns:any)
{

    if (predictAns.length !== correctAns.length) {
        throw new Error('Predictions and labels must have the same length');
    }
    
    
    let tp = 0;  // 真正例
    let fp = 0;  // 假正例
    let prevTPR = 0;  // 上一個 TPR
    let prevFPR = 0;  // 上一個 FPR
    let auc = 0;

    const P = correctAns.filter((correctAns:any) => correctAns === 1).length;
    const N = correctAns.filter((correctAns:any) => correctAns === 0).length; 

    const combined = predictAns.map((pred:any, idx:any) => ({
        score: pred,
        label: correctAns[idx],
    }));

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
}

async function GetAllFilePath(RootPath: any, fileName: string) {

    let currentDirItems = fs.readdirSync(RootPath)
    currentDirItems.forEach(item => {
        if (fs.statSync(`${RootPath}/${item}`).isDirectory()) {
            GetAllFilePath(`${RootPath}/${item}`, item)
        }
        else {
            if (fs.existsSync(`${RootPath}/y_test.csv`) && !PredictData.hasOwnProperty(fileName)) {
                PredictData[fileName]=ReadData(`${RootPath}/y_test.csv`,true)
                publicDataIndex[fileName]=ReadData(`${RootPath}/public.txt`,false)
                privateDataIndex[fileName]=ReadData(`${RootPath}/private.txt`,false)
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
        studentData[dataSetName[i]]=ReadData( `${RootPath}/${fileName}/Competition_data/${dataSetName[i]}/y_predict.csv`,true)
    }
    return studentData
    
}


function ReadData(PATH: string,isCSV:boolean) {
    let file = fs.readFileSync(PATH, { encoding: "utf-8" })
    const stringArray = file.split('\n').map(item => item.trim());
    if(isCSV)
        stringArray.shift()
    const intArray = stringArray.map(Number);
    return intArray;
}


Init()