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
const PredictDataPath: dataset[] = [];


export default function PredictFlow(filename:any) 
{
    const studentData:dataset[]=[]
    




    // allDataPath.forEach(element => {
    //     ReadData(element)
    // });

}

async function Decompressed()
{

    await exec('')
}

function Init() {
    GetAllFilePath(`${RootPath}/all`,"")
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

function ReadData(PATH: string) {
    let file = fs.readFileSync(PATH, { encoding: "utf-8" })
    const stringArray = file.split('\n').map(item => item.trim());
    stringArray.shift()
    const intArray = stringArray.map(Number);
    return intArray;
    
}

Init()