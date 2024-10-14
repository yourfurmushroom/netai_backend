import * as fs from 'fs';
import WebSocket = require('ws')
import mysql from 'mysql';

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


  constructor() {
    const db_option = {
      host: 'localhost',
      user: 'root',
      password: 'Jet..123@2024!',
      database: 'netai_data_scients',
    }

    this.db = mysql.createConnection(db_option)


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
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT * FROM User WHERE userName = ? AND password = ?',
        [username, password],
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
    const veryfied = await this.VerifyInDatabase(username)
    console.log(veryfied)
    try {
      if (!veryfied)
        this.db.query(`INSERT INTO User VALUES("${username}",${password})`, (err: Error, result: object) => {
          if (err) {
            throw err;
          }
        })
      return veryfied

    }
    catch {
      return false;
    }
  }


}

async function WssListener(wss: WebSocket.Server, db: any) {
  wss.on('connection', (ws: WebSocket) => {

    console.log("connected")

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
        else {

        }
      }
      catch (error) {
        console.log(error)
      }
    });

    ws.on('close', () => {
      console.log("asd")
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error: ${error.message}`);
    });

  });
}
async function main() {
  let port = 8888;
  const wss = ConnectionToServer(port)
  let dataBase = new DataBase();

  WssListener(wss, dataBase);
}

main();