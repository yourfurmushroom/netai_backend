import * as fs from 'fs';
import WebSocket = require('ws')
import mysql from 'mysql';
import path from 'path'
import PredictFlow from './Predict';


function ConnectionToServer(port: number): WebSocket.Server {
  const wss = new WebSocket.Server({ port: 8888, host: "0.0.0.0" });
  console.log("server start on 8888");
  return wss;
}


export class DataBase {
  pool: mysql.Pool;
  db_option: Object;

  constructor() {
    this.db_option = {
      host: 'localhost',
      user: 'root',
      password: 'Jet..123@2024!',
      database: 'netai_data_scients',
      connectionLimit: 100,
      queueLimit: 30,
      waitForConnections: true,
      acquireTimeout: 100000000,
      idleTimeout: 2147483647
    };
    this.pool = mysql.createPool(this.db_option);
    setInterval(() => {
      this.pool.query('SELECT 1', (err) => {
        if (err) {
          console.error('Keep-alive query failed:', err);
        } else {
          console.log('Keep-alive query successful');
        }
      });
    }, 1073741823);

  }


  public async CheckUser(username: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.pool.query(
        'SELECT * FROM account WHERE account = ? AND password = ?',
        [username, password],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result.length === 1);
          }
        }
      );
    });
  }

  public async ModifyPassword(account: string, newPassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const cmd = `UPDATE account set password = ? WHERE account = ?`;
      this.pool.query(cmd, [newPassword, account], (err, result) => {
        if (err) {
          return reject(err);
        } else {
          
          return resolve(true);
        }
      });
    });
  }

  public async GetAllResult() {
    return new Promise((resolve, reject) => {
      this.pool.query('SELECT sr.* FROM submissionRecord sr INNER JOIN (SELECT groupName, MAX(time) AS lastTime FROM submissionRecord GROUP BY groupName) AS latest ON sr.groupName = latest.groupName AND sr.time = latest.lastTime;', (err, result) => {
        if (err) {
          reject(err);
        } else {
          if (Object.keys(result).length > 0) {
            return resolve(result);
          }
        }
      });
    });
  }

  public async GetGroupResult(groupName: string) {
    return new Promise((resolve, reject) => {
      this.pool.query('SELECT * FROM submissionRecord WHERE groupName = ?', [groupName], (err, result) => {
        if (err) {
          reject(err);
        } else {
          if (Object.keys(result).length > 0) {
            return resolve(result);
          }
        }
      });
    });
  }

  public async GetGroupName(account: string) {
    return new Promise((resolve, reject) => {
      this.pool.query(`SELECT distinct name FROM groupName WHERE account = ?`, [account], (err, result) => {
        if (err) {
          console.log(err);
          return reject(err);
        } else {
          if (result.length > 0) {
            let groupname = result.map((row: any) => row.name);
            return resolve(groupname);
          } else {
            return resolve(undefined);
          }
        }
      });
    });
  }

  public async InsertScore(publicScore: Number, privateScore: Number, groupName: string) {
    return new Promise((resolve, reject) => {
      this.pool.query(
        'INSERT INTO submissionRecord (groupName, time, publicAUC, privateAUC) VALUES (?, NOW(), ?, ?)',
        [groupName, publicScore, privateScore],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }
}

async function WssListener(wss: WebSocket.Server, db: any) {
  wss.on('connection', (ws: WebSocket) => {
    console.log("connected")

    try {
      ws.on('message', (message: string) => {
        let msg = JSON.parse(message)
        try {

          if (msg['flag'] === 'Login') {
            db.CheckUser(msg['username'], msg['password']).then((e: boolean) => {
              console.log(e)
              if (e) {
                db.GetGroupName(msg['username']).then((groupname: any) => {
                  ws.send(JSON.stringify({ messageField: "True", detail: "login Successful", groupName: groupname }))
                })

              }
              else
                ws.send(JSON.stringify({ messageField: "False", detail: "username or password error" }))
            });
          }

          else if (msg['flag'] === 'ShowOverallBoard') {
            db.GetAllResult().then((e: any) => {
              ws.send(JSON.stringify({
                items: e
              }))
            })
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

          else if (msg['flag'] === 'Modify') {
            if (msg['password'] === msg['secondpassword']) {
              db.ModifyPassword(msg['userName'], msg['password']).then((e: boolean) => {

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
              const filename = `_${Date.now()}`
              const filePath = path.join(__dirname, '../studentItems', msg['username'] + `${filename}.${typeOfFile}`);
              fs.writeFile(filePath, Buffer.from(msg['filebuffer'], 'base64'), (err) => {
                if (err) {
                  console.error('文件保存失敗', err);
                  ws.send(JSON.stringify({ messageField: "False", detail: "資料上傳失敗" }))
                } else {
                  ws.send(JSON.stringify({ messageField: "True", detail: "資料上傳成功", filename: msg['filename'] }))
                  PredictFlow(msg['username'] + filename, typeOfFile, msg['groupName'])
                }
              });
            }
            else {
              console.error('文件保存失敗');
              ws.send(JSON.stringify({ messageField: "False", detail: "檔案格式不正確，必須為下列各式：\nrar,zip,7z" }))
            }
          }
          else if (msg['flag'] === 'ShowBoard') {
            db.GetGroupResult(msg['groupName']).then((e: any) => {
              ws.send(JSON.stringify({
                items: e
              }))

            })

          }

          else {

          }
        }

        catch (error) {

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