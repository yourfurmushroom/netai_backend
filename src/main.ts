import * as fs from 'fs';
import WebSocket = require('ws')
import mysql from 'mysql';
import path from 'path'
import PredictFlow from './Predict';

function ReadData(path: string): string {
  const data = fs.readFileSync(path, 'utf-8');
  return data;
}


function ConnectionToServer(port: number): WebSocket.Server {
  const wss = new WebSocket.Server({ port: 8888, host: "0.0.0.0" });
  console.log("server start on 8888");
  return wss;
}

class DataBase {
  db: any;
  db_option: Object;


  constructor() {
    this.db_option = {
      host: 'localhost',
      user: 'root',
      password: 'Jet..123@2024!',
      database: 'netai_data_scients',
    }
  }



  public CheckConnection(): any {
    this.db.connect((err: mysql.MysqlError | null) => {
      if (err) {
        console.error('Database connection error:', err);
        return;
      }
      console.log("Database connected");
    });
  }

  public async CheckUser(username: string, password: string): Promise<boolean> {
    this.db = mysql.createConnection(this.db_option)
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT * FROM account WHERE account = ? AND password = ?',
        [username, password],
        (err: Error, result: any) => {
          if (err) {
            reject(err);
          } else {
            this.db.end()
            resolve(result.length === 1);
          }
        }
      );
    });
  }

  public async VerifyInDatabase(username: string): Promise<boolean> {

    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT * FROM account WHERE userName = ?',
        [username],
        (err: Error, result: any) => {
          if (err) {
            reject(err);
          } else {

            resolve(result.length === 1);
          }
        }
      );
    });
  }

  public async InsertData(username: string, password: string): Promise<boolean> {
    this.db = mysql.createConnection(this.db_option)
    const veryfied = await this.VerifyInDatabase(username)
    console.log(veryfied)
    try {
      if (!veryfied)
        this.db.query(`INSERT INTO User VALUES("${username}","${password}")`, (err: Error, result: object) => {
          if (err) {
            this.db.end()
            throw err;
          }
          else {
            this.db.end()
          }
        })
      return veryfied
    }
    catch {
      this.db.end()
      return true;
    }
  }

  public async ModifyPassword(account:string,newPassword:string)
  {
    this.db = mysql.createConnection(this.db_option)
    try{
      this.db.query(`UPDATE account set password = ${newPassword} where account = '${account}'`, (err: Error, result: object) => {
        if (err) {
          this.db.end()
          throw err;
        }
        else {
          this.db.end()
          return true;
        }
      })
      return true;
    }
    catch
    {
      this.db.end()
      return false;
    }
  }

  public async GetAllResult()
  {
    return "aa"
  }

  public async GetGroupName(account:string)
  {
    this.db = mysql.createConnection(this.db_option)
    try{
      return new Promise((resolve, reject) => {
        this.db.query(`SELECT name FROM groupName WHERE account='${account}'`, (err: Error, result: any) => {
          if (err) {
            console.log(err);
            this.db.end();
            return reject(err); // 這裡是錯誤的情況
          } else {
            this.db.end();
            if (result.length > 0) {
              let groupname = result.map((row: any) => row.name);
              return resolve(groupname); // 成功情況，回傳結果
            } else {
              return resolve(undefined); // 沒有找到結果時返回 undefined
            }
          }
        });
      });
    }
    catch(e:any)
    {
      this.db.end()
      console.log(e)
      return undefined;
    }
  }
}

async function WssListener(wss: WebSocket.Server, db: any) {
  wss.on('connection', (ws: WebSocket) => {
    // ws.send(JSON.stringify({
    //   items:['aa','bb','cc','aa','bb','cc','aa','bb','cc']
    // }))
    console.log("connected")
    try {
      ws.on('message', (message: string) => {
        let msg = JSON.parse(message)
        try {

          if (msg['flag'] === 'Login') {
            db.CheckUser(msg['username'], msg['password']).then((e: boolean) => {
              console.log(e)
              if (e){
                db.GetGroupName(msg['username']).then((groupname:any)=>
              {
                
                // console.log(db.GetGroupName(msg['username']))
                ws.send(JSON.stringify({ messageField: "True", detail: "login Successful",groupName:groupname}))
              })
                
              }
              else
                ws.send(JSON.stringify({ messageField: "False", detail: "username or password error" }))
            });
          }

          else if(msg['flag']==='ShowOverallBoard')
          {
            ws.send(JSON.stringify({
              items:['aa','bb','cc','aa','bb','cc','aa','bb','cc']
            }))
          }

          else if (msg['flag'] === 'Register') {
            if (msg['password'] === msg['secondpassword']) {
              db.InsertData(msg['username'], msg['password']).then((e: boolean) => {
                if (e == false)
                  ws.send(JSON.stringify({ messageField: "True", detail: "register Successful" }))
                else
                  ws.send(JSON.stringify({ messageField: "False", detail: "username exist" }))
              })
            }
            
            else {
              ws.send(JSON.stringify({ messageField: "False", detail: "typo error" }))
            }
          }

          else if(msg['flag'] === 'Modify')
          {
            if (msg['password'] === msg['secondpassword'])
            {
              db.ModifyPassword(msg['userName'],msg['password']).then((e:boolean)=>{
                
                if (e == true)
                  ws.send(JSON.stringify({ messageField: "True", detail: "修改成功" }))
                else
                  ws.send(JSON.stringify({ messageField: "False", detail: "發生錯誤，稍後重試" }))
              })
            }
            else {
              ws.send(JSON.stringify({ messageField: "False", detail: "密碼不一致" }))
            }
          }
          else if (msg['flag'] === 'Upload') {
            let tmp = msg['filename'].split('.')
            let typeOfFile = tmp.pop();
            if (typeOfFile === 'rar' || typeOfFile === 'zip' || typeOfFile === '7z') {
              const filename=`_${Date.now()}`
              const filePath = path.join(__dirname, '../studentItems', msg['username']+`${filename}.${typeOfFile}`);
              fs.writeFile(filePath, Buffer.from(msg['filebuffer'], 'base64'), (err) => {
                if (err) {
                  console.error('文件保存失敗', err);
                  ws.send(JSON.stringify({ messageField: "False", detail: "資料上傳失敗" }))
                } else {
                  console.log('文件已保存:', filePath);
                  console.log(msg['filename'])
                  ws.send(JSON.stringify({ messageField: "True", detail: "資料上傳成功", filename: msg['filename'] }))
                  PredictFlow(msg['username']+filename,typeOfFile)
                }
              });
            }
            else
            {
              console.error('文件保存失敗');
                ws.send(JSON.stringify({ messageField: "False", detail: "檔案格式不正確，必須為下列各式：\nrar,zip,7z" }))
            }
          }
          else if(msg['flag']==='ShowBoard')
          {
              console.log("correct")
              ws.send(JSON.stringify({
                items:['aa','bb','cc','aa','bb','cc','aa','bb','cc']
              }))
          }
          else {

          }
        }
        catch (error) {
          console.log(error)
        }
      });

      ws.on('close', () => {

      });

      ws.on('error', (error) => {
        console.error(`WebSocket error: ${error.message}`);
      });
    }
    catch {

    }


  });
}
async function main() {
  let port = 8888;
  const wss = ConnectionToServer(port)
  let dataBase = new DataBase();

  WssListener(wss, dataBase);
}

main();