import * as fs from 'fs';
import WebSocket = require('ws')
import mysql from 'mysql';
import path from 'path'

function ReadData(path: string): string {
  const data = fs.readFileSync(path, 'utf-8');
  return data;
}


function ConnectionToServer(port: number): WebSocket.Server {
  const wss = new WebSocket.Server({ port: 8888 ,host:"0.0.0.0"});
  console.log("server start on 8888");
  return wss;
}

class DataBase {
  db: any;
  db_option:Object;


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
        'SELECT * FROM User WHERE userName = ? AND password = ?',
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
        'SELECT * FROM User WHERE userName = ?',
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
          else
          {
            this.db.end()
          }
        })
      return veryfied

    }
    catch {
      this.db.end()
      return false;
    }
  }


}

async function WssListener(wss: WebSocket.Server, db: any) {
  wss.on('connection', (ws: WebSocket) => {

    console.log("connected")
    try{
      ws.on('message', (message: string) => {
        let msg = JSON.parse(message)
        try {
          if (msg['flag'] === 'Login') {
            console.log("asd")
            db.CheckUser(msg['username'], msg['password']).then((e: boolean) => {
              console.log(e)
              if (e)
                ws.send(JSON.stringify({ messageField: "True", detail: "login Successful" }))
              else
                ws.send(JSON.stringify({ messageField: "False", detail: "username or password error" }))
            });
  
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
          else if (msg['flag']==='Upload')
          {
            const filePath = path.join(__dirname, '../studentItems', `file_${Date.now()}_${msg['filename']}`);
            fs.writeFile(filePath, Buffer.from(msg['filebuffer'],'base64'), (err) => {
              if (err) {
                console.error('文件保存失敗', err);
                ws.send(JSON.stringify({ messageField: "False", detail: "資料上傳失敗" }))
              } else {
                console.log('文件已保存:', filePath);
                ws.send(JSON.stringify({ messageField: "True", detail: "資料上傳成功" ,filename:msg['filename']}))
              }
            });
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
    catch{
      
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